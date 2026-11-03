-- 2.830.0 KC-DB-KLEIN-HALTEN (Gesamtprüfung #44 Etappe 3, Vorschlag E – Hansi „A, B, E“): zwei Protokoll-Tabellen wuchsen ohne Grenze.
-- cron.job_run_details (ein Eintrag je Zeitplan-Lauf, alle 5 Min. → 19 MB): nur 7 Tage behalten – gelesen werden höchstens 24–26 Std.
-- (Wächter-Lage, Datenbank-Aussetzer; Aussetzer sind in kc_club_db_aussetzer 90 Tage gesichert).
-- kc_communication_health_snapshots: 35 Tage – gelesen wird nur der neueste Messwert. Höchstens 20 000 Zeilen je Lauf (kurz, nie blockierend).
-- Täglich 03:45 UTC (im Aufräum-Fenster, nicht in den Spiegel-/Sicherungszeiten). Rückweg: select cron.unschedule('kc-db-klein-halten');
create or replace function kc_internal.kc_db_klein_halten()
returns jsonb language plpgsql security definer set search_path = pg_catalog, public set statement_timeout = '60s' as $$
declare v_cron int := 0; v_health int := 0;
begin
  delete from cron.job_run_details where runid in (select runid from cron.job_run_details where end_time < now() - interval '7 days' limit 20000);
  get diagnostics v_cron = row_count;
  delete from public.kc_communication_health_snapshots where id in (select id from public.kc_communication_health_snapshots where created_at < now() - interval '35 days' limit 20000);
  get diagnostics v_health = row_count;
  return jsonb_build_object('zeitplan_protokoll', v_cron, 'kommunikation_messwerte', v_health, 'regel', jsonb_build_object('zeitplan_tage', 7, 'messwerte_tage', 35));
end $$;
revoke all on function kc_internal.kc_db_klein_halten() from public;
select cron.unschedule('kc-db-klein-halten') where exists (select 1 from cron.job where jobname = 'kc-db-klein-halten');
select cron.schedule('kc-db-klein-halten', '45 3 * * *', 'select kc_internal.kc_db_klein_halten()');
