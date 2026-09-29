-- KC-SPIEGEL-AUFNAHMEFRIST (29.09.2026): Fehlalarm „KC System Check ROT“ an der Quelle behoben.
-- Ursache 1: Watchdog und Quellprüfung gaben neuen Tabellen fest 30 Minuten. Seit der Spiegel aus Kostengründen nur im
--   sparsamen 6-h-Lauf arbeitet (kc-neon-low-compute-cycle, 5-Minuten-Nachlauf seit 20.09. aus), erreicht eine neue Tabelle
--   die Frist nie → jede neue Tabelle war bis zum nächsten Lauf ein „Problem“. Jetzt: Aufnahmefrist = Frischefenster
--   (kc_internal.kc_db_mirror_frischefenster(), derzeit 390 min) – dieselbe Zeit, die bestehende Tabellen haben.
-- Ursache 2: kc_system_check_snapshot nannte als „betroffen“ die 5 ältesten Läufe (feste 65 min aus der 5-Minuten-Zeit) und
--   übersah nie gespiegelte Tabellen. Jetzt: genau die Problemtabellen des letzten Watchdog-Laufs (eine Wahrheit).
-- Nur Überwachungslogik; kein Spiegel-/Neon-Lauf, keine Daten geändert.
-- Wiederherstellungspunkt (Freigabe Hansi 29.09.2026): alte Fassungen als *_vor_aufnahmefrist sichern
do $sich$
declare d text; alt text;
begin
  foreach alt in array array['kc_internal.kc_db_mirror_watchdog','kc_internal.kc_db_mirror_source_check','public.kc_system_check_snapshot'] loop
    d := pg_get_functiondef(alt::regproc);
    d := regexp_replace(d, '(FUNCTION [a-z_]+\.[a-z_]+)\(', '\1_vor_aufnahmefrist(');
    execute d;
  end loop;
end $sich$;
revoke all on function kc_internal.kc_db_mirror_watchdog_vor_aufnahmefrist() from public, anon, authenticated;
revoke all on function kc_internal.kc_db_mirror_source_check_vor_aufnahmefrist() from public, anon, authenticated;
revoke all on function public.kc_system_check_snapshot_vor_aufnahmefrist() from public, anon, authenticated;

do $mig$
declare d text; alt text;
begin
  foreach alt in array array['kc_internal.kc_db_mirror_watchdog','kc_internal.kc_db_mirror_source_check'] loop
    d := pg_get_functiondef(alt::regproc);
    if position($x$v_aufnahme_grace interval := interval '30 minutes';$x$ in d) = 0 then raise exception 'Frist in % nicht gefunden', alt; end if;
    d := replace(d, $x$v_aufnahme_grace interval := interval '30 minutes';$x$, $x$v_aufnahme_grace interval := kc_internal.kc_db_mirror_frischefenster(); -- = nächster regulärer Lauf$x$);
    d := replace(d, $x$'enrollment_grace_minutes',30$x$, $x$'enrollment_grace_minutes',ceil(extract(epoch from v_aufnahme_grace)/60)::int$x$);
    d := replace(d, 'Aufnahmefrist (30 Minuten)', 'Aufnahmefrist (bis zum nächsten regulären Spiegellauf)');
    d := replace(d, 'Aufnahmefrist 30 Minuten.', 'Aufnahmefrist bis zum nächsten regulären Spiegellauf.');
    d := replace(d, 'Dynamischer Spiegellauf wiederholt automatisch.', 'Der nächste reguläre Spiegellauf wiederholt automatisch.');
    execute d;
  end loop;
end $mig$;

create or replace function public.kc_system_check_snapshot()
 returns jsonb
 language sql
 security definer
 set search_path to 'pg_catalog', 'public'
 set statement_timeout to '12s'
as $function$
  with latest as (
    select status, started_at, finished_at, source_rows, target_rows,
           replication_lag_sec, mismatch_count
    from public.kc_db_mirror_runs
    where finished_at is not null
      and status is distinct from 'running'
    order by finished_at desc, started_at desc
    limit 1
  ), day_stats as (
    select count(*) filter (where finished_at is not null)::bigint as runs_24h,
           count(*) filter (
             where finished_at is not null
               and status is distinct from 'ok'
           )::bigint as non_ok_24h,
           coalesce(sum(mismatch_count) filter (where finished_at is not null),0)::bigint as mismatches_24h
    from public.kc_db_mirror_runs
    where started_at >= now() - interval '24 hours'
  ), letzter_befund as (
    select started_at, status, message, metrics ->> 'table' as tabelle
    from public.kc_db_mirror_runs
    where started_at >= now() - interval '24 hours'
      and finished_at is not null
      and (status is distinct from 'ok' or coalesce(mismatch_count,0) > 0)
    order by started_at desc
    limit 1
  ), wd as (
    -- KC-SPIEGEL-AUFNAHMEFRIST: betroffene Tabellen = Problemtabellen des letzten Watchdog-Laufs (nicht eigene Regel)
    select metrics from public.kc_db_mirror_runs where run_type = 'watchdog' order by started_at desc limit 1
  ), veraltet as (
    select n.tabelle, s.status, s.started_at
    from wd
    cross join lateral jsonb_array_elements_text(coalesce(wd.metrics -> 'problem_table_names', '[]'::jsonb)) with ordinality as n(tabelle, i)
    left join lateral (
      select status, started_at from public.kc_db_mirror_runs
      where run_type = 'snapshot' and metrics ->> 'table' = n.tabelle
      order by started_at desc limit 1
    ) s on true
    order by n.i
    limit 5
  )
  select jsonb_build_object(
    'checked_at', now(),
    'database_bytes', pg_database_size(current_database()),
    'mirror', coalesce((select to_jsonb(latest) from latest), '{}'::jsonb),
    'runs_24h', (select runs_24h from day_stats),
    'non_ok_24h', (select non_ok_24h from day_stats),
    'mismatches_24h', (select mismatches_24h from day_stats),
    'last_issue', case when exists (select 1 from letzter_befund)
      then (select to_jsonb(letzter_befund) from letzter_befund)
           || jsonb_build_object(
                'veraltete_tabellen',
                coalesce((select jsonb_agg(to_jsonb(veraltet)) from veraltet), '[]'::jsonb))
      else null end
  );
$function$;
