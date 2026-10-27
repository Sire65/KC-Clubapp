-- KC-DB-SICHERUNG-ZEITEN (27.10.2026, Wunsch Hansi „Datensicherung nachts machen – vorher prüfen, ob es zu allen anderen Zeiten passt“):
-- Die Spiegelung zu Neon (Anstoß kc-neon-low-compute-cycle + Welle kc-db-mirror-welle) läuft weiter alle 6 Stunden, aber 2 Stunden früher:
-- bisher 0,6,12,18 UTC (01/07/13/19 Uhr Winterzeit) → jetzt 4,10,16,22 UTC (05/11/17/23 Uhr Winterzeit; Sommerzeit je +1 Std.).
-- Grund: 19 Uhr und 07 Uhr sind die stärksten Stunden der App, 13 Uhr liegt direkt hinter dem 12-Uhr-Einspielen.
-- Geprüft: kein Zusammentreffen mit Neon-Nachtsicherung (00:40 UTC), Aufräumen (03:05–03:50 UTC), Backup-Prüfung (06:30 UTC), FRA-Sicherung (01–03 UTC).
-- Nur Daten/Zeitplan und die Wächter-Fensterberechnung – kein Schema, keine Tabelle.
-- Rückweg: alter_job auf '10 */6 * * *' bzw. '11-22 0,6,12,18 * * *'; die Funktion versteht beide Schreibweisen.

-- 1) Wächter-Fenster: versteht jetzt auch eine Stundenliste („10 4,10,16,22 * * *“) – größter Abstand + 30 Min. (sonst fiele er auf 24 Std. zurück)
create or replace function kc_internal.kc_db_mirror_frischefenster()
 returns interval
 language plpgsql
 stable security definer
 set search_path to 'pg_catalog', 'public', 'cron', 'kc_internal'
as $function$
declare
  v_cron text; v_aktiv boolean; v_interval_min numeric := 5; v_tables integer := 0; v_batches integer := 1; v_match text[];
  v_spar text; v_spar_aktiv boolean; v_std int[]; v_abstand int := 0; i int;
begin
  select j.schedule, j.active into v_cron, v_aktiv from cron.job j where j.jobname = 'kc-db-mirror-dynamic-5min' limit 1;
  -- Sparmodus: dynamische Spiegelung aus, gebündelter Lauf (kc-neon-low-compute-cycle) an → dessen Stunden-Takt zählt
  select j.schedule, j.active into v_spar, v_spar_aktiv from cron.job j where j.jobname = 'kc-neon-low-compute-cycle' limit 1;
  if coalesce(v_aktiv, false) = false and coalesce(v_spar_aktiv, false) then
    v_match := regexp_match(v_spar, '^\S+ \*/([0-9]+) ');
    if v_match is not null then return make_interval(mins => (v_match[1]::int * 60 + 30)); end if;
    -- 27.10.2026: Stundenliste, z. B. „10 4,10,16,22 * * *“ → größter Abstand zwischen zwei Läufen (über Mitternacht gerechnet)
    if split_part(v_spar, ' ', 2) ~ '^[0-9]+(,[0-9]+)+$' then
      select array_agg(h order by h) into v_std from (select distinct x::int as h from unnest(string_to_array(split_part(v_spar, ' ', 2), ',')) x) s;
      for i in 1 .. array_length(v_std, 1) loop
        v_abstand := greatest(v_abstand, case when i < array_length(v_std, 1) then v_std[i + 1] - v_std[i] else 24 - v_std[i] + v_std[1] end);
      end loop;
      return make_interval(mins => (v_abstand * 60 + 30));
    end if;
    return make_interval(mins => (24 * 60 + 30));
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
  -- Ein kompletter Umlauf aller freigegebenen Tabellen plus zwei Takte Reserve.
  return make_interval(mins => ceil(v_interval_min * (v_batches + 2))::int);
end;
$function$;

-- 2) Zeitpläne verlegen (beide zusammen: Anstoß um :10, Welle :11–:22 derselben Stunden)
select cron.alter_job(j.jobid, schedule => '10 4,10,16,22 * * *') from cron.job j where j.jobname = 'kc-neon-low-compute-cycle';
select cron.alter_job(j.jobid, schedule => '11-22 4,10,16,22 * * *') from cron.job j where j.jobname = 'kc-db-mirror-welle';
