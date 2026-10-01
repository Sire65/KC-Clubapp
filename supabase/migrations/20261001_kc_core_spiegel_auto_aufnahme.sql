-- KC-SPIEGEL-AUTO (01.10.2026, Freigabe Hansi „1 ja, 2 ja“): neue Tabellen kommen automatisch in den Neon-Spiegel.
-- Anlass: Club-App 0.92–1.4.1 legte über Nacht 9 Tabellen ohne Spiegel-Regel an (Abdeckung WARNING), am 30.09. fehlten
-- in Neon 4 neue kc_club_anruf-Spalten (verification mismatch). Beides soll künftig ohne Handarbeit gehen.
--
-- 1) kc_db_mirror_spalten(tabelle): Spaltenliste (Name + Typ, Reihenfolge wie in Supabase) für den Spiegel-Arbeiter.
--    Nur service_role. Eigene Typen (Enum u. ä.) werden als text gespiegelt, Domänen als ihr Grundtyp.
-- 2) kc_internal.kc_db_mirror_abdeckung_check (läuft alle 30 Min. im Watchdog-Takt) nimmt Tabellen ohne Regel selbst auf:
--    - unauffällig → Regel „sensitive“, gespiegelt + gesichert, in kc_neon_resume_tables (6-h-Spiegellauf);
--    - Spalten, die nach Geheimnis oder Standort aussehen → Regel angelegt, aber NICHT gespiegelt/gesichert
--      (note 'AUTO-HALT …'); die Abdeckung meldet WARNING „wartet auf Admin-Freigabe“, bis jemand entscheidet.
--    Jeder Schritt landet in kc_db_mirror_audit (action 'mirror_auto_aufnahme').
-- 3) Der Spiegel-Arbeiter (kc-db-mirror-worker) legt fehlende Neon-Tabellen/-Spalten vor dem Kopieren additiv an
--    (nie löschen, nie Typ ändern) – siehe supabase/functions/kc-db-mirror-worker/index.ts.
-- 4) Bewusste Einzelentscheidungen: kc_club_standort_live (flüchtige GPS-Positionen) nicht spiegeln/sichern;
--    kc_club_mitfahrt_suche (Neon-Tabelle legt jetzt der Arbeiter an) wird gespiegelt.
-- Rückweg: kc_internal.kc_db_mirror_abdeckung_check_vor_autoaufnahme zurückkopieren; AUTO-Regeln per note finden.

-- Wiederherstellungspunkt
do $sich$
declare d text;
begin
  d := pg_get_functiondef('kc_internal.kc_db_mirror_abdeckung_check'::regproc);
  d := regexp_replace(d, '(FUNCTION [a-z_]+\.[a-z_]+)\(', '\1_vor_autoaufnahme(');
  execute d;
end $sich$;
revoke all on function kc_internal.kc_db_mirror_abdeckung_check_vor_autoaufnahme() from public, anon, authenticated;

-- 1) Spaltenliste für den Arbeiter
create or replace function public.kc_db_mirror_spalten(p_table_name text)
returns jsonb
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select coalesce(jsonb_agg(jsonb_build_object('name', a.attname, 'type',
           case when t.typnamespace = 'pg_catalog'::regnamespace then format_type(a.atttypid, a.atttypmod)
                when t.typtype = 'd' and bt.typnamespace = 'pg_catalog'::regnamespace then format_type(t.typbasetype, t.typtypmod)
                when t.typcategory = 'A' then 'text[]'
                else 'text' end) order by a.attnum), '[]'::jsonb)
  from pg_class c
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  join pg_type t on t.oid = a.atttypid
  left join pg_type bt on bt.oid = t.typbasetype
  where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p') and c.relname = p_table_name
    and exists (select 1 from public.kc_db_mirror_table_rules r where r.table_name = p_table_name and r.mirror_enabled);
$function$;
revoke all on function public.kc_db_mirror_spalten(text) from public, anon, authenticated;
grant execute on function public.kc_db_mirror_spalten(text) to service_role;

-- 4) Einzelentscheidungen (vor der ersten Automatik, damit sie nicht als AUTO-HALT hängen bleiben)
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_standort_live', 'Club-App', 'sensitive', false, false, false,
        'KC-SPIEGEL-AUTO (01.10.2026, Freigabe Hansi): flüchtige Live-Standorte (GPS) – bewusst nicht gespiegelt und nicht gesichert (Datensparsamkeit)')
on conflict (table_name) do nothing;
update public.kc_db_mirror_table_rules set mirror_enabled = true, backup_enabled = true, updated_at = now(),
       note = 'KC-SPIEGEL-AUTO (01.10.2026): gespiegelt; Neon-Tabelle legt der Spiegel-Arbeiter selbst an'
 where table_name = 'kc_club_mitfahrt_suche' and mirror_enabled = false;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_mitfahrt_suche') on conflict (table_name) do nothing;

-- 2) Automatische Aufnahme in der Abdeckungsprüfung
create or replace function kc_internal.kc_db_mirror_abdeckung_check()
returns void
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'kc_internal'
as $function$
declare
  v jsonb; v_ohne int; v_msg text; t text; v_verdacht text; v_bereich text;
  v_auf text[] := '{}'; v_halt text[] := '{}'; v_wartet text[];
  c_verdacht constant text := '(token|secret|geheim|passw|pwd|api_?key|key_material|private_?key|p256dh|auth_key|endpoint|subscription|pairing|(^|_)pin(_|$)|(^|_)otp(_|$)|(^|_)(lat|lon|lng|latitude|longitude|gps|standort|position)(_|$))';
begin
  -- KC-SPIEGEL-AUTO: Tabellen ohne Regel selbst aufnehmen (gleiche Liste wie die Abdeckung)
  for t in select jsonb_array_elements_text(public.kc_db_mirror_abdeckung() -> 'liste') loop
    select string_agg(a.attname, ', ' order by a.attnum) into v_verdacht
      from pg_attribute a where a.attrelid = format('public.%I', t)::regclass and a.attnum > 0 and not a.attisdropped
       and a.attname ~* c_verdacht;
    v_bereich := case when t like 'kc_club_%' then 'Club-App' when t like 'kc_dp_%' then 'KC DP'
      when t like 'kc_communication_%' then 'communication' when t like 'kc_manager_%' then 'PC Manager'
      when t like 'kc_core_%' then 'KC Core' when t like 'kicc_%' then 'KICC' when t like 'kc_wm_%' then 'Weihnachtsmarkt'
      when t like 'kc_besuche%' then 'Besuchsprotokoll' when t like 'kng_%' then 'Schlüsselverwaltung'
      when t like 'kc_termin%' then 'Termine' when t like 'kc_finance_%' then 'Finanzen' else 'Automatisch' end;
    if v_verdacht is null then
      insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
      values (t, v_bereich, 'sensitive', false, true, true,
              format('AUTO-AUFNAHME %s: automatisch gespiegelt und gesichert (KC-SPIEGEL-AUTO)', to_char(now() at time zone 'Europe/Berlin', 'DD.MM.YYYY HH24:MI')))
      on conflict (table_name) do nothing;
      insert into public.kc_neon_resume_tables (table_name) values (t) on conflict (table_name) do nothing;
      v_auf := v_auf || t;
      insert into public.kc_db_mirror_audit (severity, action, detail, metadata)
      values ('info', 'mirror_auto_aufnahme', format('Neue Tabelle %s automatisch in den Spiegel aufgenommen', t), jsonb_build_object('table', t, 'area', v_bereich));
    else
      insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
      values (t, v_bereich, 'sensitive', false, false, false,
              format('AUTO-HALT %s: wartet auf Admin-Freigabe – auffällige Spalten: %s', to_char(now() at time zone 'Europe/Berlin', 'DD.MM.YYYY HH24:MI'), v_verdacht))
      on conflict (table_name) do nothing;
      v_halt := v_halt || t;
      insert into public.kc_db_mirror_audit (severity, action, detail, metadata)
      values ('warning', 'mirror_auto_aufnahme', format('Neue Tabelle %s NICHT gespiegelt – auffällige Spalten (%s), Admin-Freigabe nötig', t, v_verdacht),
              jsonb_build_object('table', t, 'area', v_bereich, 'held', true, 'columns', v_verdacht));
    end if;
  end loop;

  v := public.kc_db_mirror_abdeckung(); v_ohne := (v->>'ohne_regel')::int;
  select coalesce(array_agg(table_name order by table_name), '{}') into v_wartet
    from public.kc_db_mirror_table_rules where note like 'AUTO-HALT%' and mirror_enabled = false;
  v := v || jsonb_build_object('auto_aufgenommen', to_jsonb(v_auf), 'auto_gehalten', to_jsonb(v_halt), 'wartet_auf_freigabe', to_jsonb(v_wartet));

  v_msg := case
    when v_ohne > 0 then format('Spiegel-Abdeckung WARNING: %s von %s Tabellen ohne Spiegel-Regel (weder gespiegelt noch bewusst ausgeschlossen): %s', v_ohne, v->>'tabellen',
      (select string_agg(x, ', ') from (select jsonb_array_elements_text(v->'liste') x limit 8) s) || case when v_ohne > 8 then ' …' else '' end)
    when cardinality(v_wartet) > 0 then format('Spiegel-Abdeckung WARNING: %s neue Tabelle(n) warten auf Admin-Freigabe (mögliche Geheimnis-/Standortspalten, nicht gespiegelt): %s',
      cardinality(v_wartet), array_to_string(v_wartet[1:8], ', ') || case when cardinality(v_wartet) > 8 then ' …' else '' end || '.')
    else format('Spiegel-Abdeckung OK: alle %s Tabellen haben eine Regel.', v->>'tabellen') end
    || case when cardinality(v_auf) > 0 then format(' Automatisch aufgenommen: %s.', array_to_string(v_auf, ', ')) else '' end;

  insert into public.kc_db_mirror_runs(run_type,status,started_at,finished_at,mismatch_count,message,metrics)
  values ('coverage', case when v_ohne = 0 and cardinality(v_wartet) = 0 then 'ok' else 'warning' end, now(), now(), v_ohne + cardinality(v_wartet), v_msg, v);
  -- Warnung ins Audit höchstens alle 6 Stunden (sonst doppelt je Watchdog-Takt)
  if (v_ohne > 0 or cardinality(v_wartet) > 0) and not exists (select 1 from public.kc_db_mirror_audit where action = 'mirror_coverage' and happened_at > now() - interval '6 hours') then
    insert into public.kc_db_mirror_audit(severity,action,detail,metadata) values ('warning','mirror_coverage',v_msg,v);
  end if;
end;
$function$;
revoke all on function kc_internal.kc_db_mirror_abdeckung_check() from public, anon, authenticated;
