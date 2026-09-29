-- KC Core Spiegel (Supabase → Neon) – 29.09.2026, mit Club-App 0.50.0 dokumentiert (Admin-Freigabe Hansi)
-- 1) kc_internal.kc_db_mirror_frischefenster(): im Sparmodus (5-Min-Spiegel aus, kc-neon-low-compute-cycle an) gilt dessen
--    Stunden-Takt + 30 Min. (bei „alle 6 Std.“ = 6:30) – sonst meldete der Watchdog im Sparmodus dauernd Alarm.
-- 2) public.kc_db_mirror_abdeckung(): welche Tabellen in public haben KEINE Spiegel-Regel (weder gespiegelt noch bewusst
--    ausgeschlossen)? Nur lesen, kein Neon-Zugriff. Ausgenommen: Spiegel-Infrastruktur und lokale Technik-Tabellen.
-- 3) kc_internal.kc_db_mirror_abdeckung_check(): schreibt run_type 'coverage' (Warnung ins Audit höchstens alle 6 Std.).
-- 4) Cron: 17 kc-db-mirror-watchdog wieder an (2,32 * * * *, ruft Watchdog + Abdeckung), 14 source-health stündlich (7 * * * *).
--    Alle drei laufen nur in Supabase – keine Neon-Rechenzeit.
create or replace function kc_internal.kc_db_mirror_frischefenster()
 returns interval language plpgsql stable security definer
 set search_path to 'pg_catalog', 'public', 'cron', 'kc_internal'
as $function$
declare
  v_cron text; v_aktiv boolean; v_interval_min numeric := 5; v_tables integer := 0; v_batches integer := 1; v_match text[];
  v_spar text; v_spar_aktiv boolean;
begin
  select j.schedule, j.active into v_cron, v_aktiv from cron.job j where j.jobname = 'kc-db-mirror-dynamic-5min' limit 1;
  select j.schedule, j.active into v_spar, v_spar_aktiv from cron.job j where j.jobname = 'kc-neon-low-compute-cycle' limit 1;
  if coalesce(v_aktiv, false) = false and coalesce(v_spar_aktiv, false) then
    v_match := regexp_match(v_spar, '^\S+ \*/([0-9]+) ');
    return make_interval(mins => (coalesce(v_match[1]::int, 24) * 60 + 30));
  end if;
  if v_cron is not null then
    v_match := regexp_match(v_cron, '^\*/([0-9]+) ');
    if v_match is not null and array_length(v_match,1)>=1 then
      v_interval_min := greatest(1, v_match[1]::numeric);
    else
      select 1440.0 / nullif(a.weckungen_tag,0) into v_interval_min from public.kc_core_takt_auswahl a where a.cron = v_cron limit 1;
      v_interval_min := coalesce(v_interval_min,5);
    end if;
  end if;
  select count(*)::int into v_tables from public.kc_db_mirror_table_rules where mirror_enabled;
  v_batches := greatest(1,ceil(v_tables / 20.0)::int);
  return make_interval(mins => ceil(v_interval_min * (v_batches + 2))::int);
end;
$function$;

create or replace function public.kc_db_mirror_abdeckung()
 returns jsonb language sql stable security definer set search_path to 'pg_catalog', 'public'
as $$
  with alle as (
    select c.relname as t from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r','p')
      and c.relname not like 'kc_db_mirror_%' and c.relname not like 'kc_neon_%'
      and c.relname not in ('kc_cron_runs_daily','kicc_program_heartbeat_nonces','kicc_program_flow_nonces')
  ), ohne as (select t from alle a where not exists (select 1 from public.kc_db_mirror_table_rules r where r.table_name = a.t))
  select jsonb_build_object('tabellen', (select count(*) from alle), 'mit_regel', (select count(*) from alle) - (select count(*) from ohne),
    'ohne_regel', (select count(*) from ohne), 'liste', coalesce((select jsonb_agg(t order by t) from ohne), '[]'::jsonb), 'geprueft', now());
$$;
revoke all on function public.kc_db_mirror_abdeckung() from public, anon, authenticated;
grant execute on function public.kc_db_mirror_abdeckung() to service_role;

create or replace function kc_internal.kc_db_mirror_abdeckung_check()
 returns void language plpgsql security definer set search_path to 'pg_catalog', 'public', 'kc_internal'
as $$
declare v jsonb := public.kc_db_mirror_abdeckung(); v_ohne int := (v->>'ohne_regel')::int; v_msg text;
begin
  v_msg := case when v_ohne = 0 then format('Spiegel-Abdeckung OK: alle %s Tabellen haben eine Regel.', v->>'tabellen')
    else format('Spiegel-Abdeckung WARNING: %s von %s Tabellen ohne Spiegel-Regel (weder gespiegelt noch bewusst ausgeschlossen): %s', v_ohne, v->>'tabellen',
      (select string_agg(x, ', ') from (select jsonb_array_elements_text(v->'liste') x limit 8) s) || case when v_ohne > 8 then ' …' else '' end) end;
  insert into public.kc_db_mirror_runs(run_type,status,started_at,finished_at,mismatch_count,message,metrics)
  values ('coverage', case when v_ohne = 0 then 'ok' else 'warning' end, now(), now(), v_ohne, v_msg, v);
  if v_ohne > 0 and not exists (select 1 from public.kc_db_mirror_audit where action = 'mirror_coverage' and happened_at > now() - interval '6 hours') then
    insert into public.kc_db_mirror_audit(severity,action,detail,metadata) values ('warning','mirror_coverage',v_msg,v);
  end if;
end;
$$;
revoke all on function kc_internal.kc_db_mirror_abdeckung_check() from public, anon, authenticated;

select cron.alter_job(17, command := 'select kc_internal.kc_db_mirror_watchdog(); select kc_internal.kc_db_mirror_abdeckung_check();', active := true);
select cron.alter_job(14, schedule := '7 * * * *', active := true);
