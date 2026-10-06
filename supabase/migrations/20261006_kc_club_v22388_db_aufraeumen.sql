-- KC Club-App – Version 2.23.88
-- KC-CLUB-DB-AUFRAEUMEN (Wunsch Hansi): Platz in der Haupt-Datenbank (Supabase, 500 MB kostenlos) im Blick behalten und aufräumen.
--   Gelöscht werden NUR technische Protokolle und Messwerte – nie Club-Daten, Kasse, Dienstpläne oder Mitglieder:
--     • Spiegel-/Zeitplaner-Läufe nach der bestehenden Regel (kc_internal.kc_db_mirror_retention_cleanup, unverändert benutzt)
--     • System-Check-Verlauf und Kommunikations-Messwerte älter als p_tage (mindestens 60, Standard 90 – der Verbrauch rechnet mit 31 Tagen)
--     • Lebenszeichen der Programme nach der bestehenden Regel (kc_lebenszeichen_aufraeumen, jüngste Sitzung je Programm bleibt)
--   Läuft jede Nacht von selbst (3:50 Uhr) und auf Knopfdruck im Admin-Bereich (🗄️ Supabase → 🧹 Jetzt aufräumen).
--   kc_club_db_belegung: die größten Tabellen (nur Namen und Größen, keine Inhalte) für die Anzeige.
--   Zugriff nur über den Server (service_role).
-- Rückweg: select cron.unschedule('kc-club-db-aufraeumen'); drop function kc_club_db_aufraeumen(integer); drop function kc_club_db_belegung();
create or replace function public.kc_club_db_aufraeumen(p_tage integer default 90)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
set statement_timeout to '60s'
as $function$
declare
  v_tage integer := greatest(coalesce(p_tage, 90), 60);
  v_vorher bigint := pg_database_size(current_database());
  v_spiegel_vor bigint;
  v_spiegel_nach bigint;
  v_pruefungen integer;
  v_messwerte integer;
  v_lebenszeichen integer;
begin
  select count(*) into v_spiegel_vor from public.kc_db_mirror_runs;
  perform kc_internal.kc_db_mirror_retention_cleanup();
  select count(*) into v_spiegel_nach from public.kc_db_mirror_runs;
  delete from public.kc_system_check_history where checked_at < now() - make_interval(days => v_tage);
  get diagnostics v_pruefungen = row_count;
  delete from public.kc_communication_health_snapshots where created_at < now() - make_interval(days => v_tage);
  get diagnostics v_messwerte = row_count;
  v_lebenszeichen := coalesce(public.kc_lebenszeichen_aufraeumen(30), 0);
  return jsonb_build_object('tage', v_tage, 'spiegel', greatest(v_spiegel_vor - v_spiegel_nach, 0), 'pruefungen', v_pruefungen,
    'messwerte', v_messwerte, 'lebenszeichen', v_lebenszeichen, 'vorher', v_vorher, 'nachher', pg_database_size(current_database()));
end;
$function$;
revoke all on function public.kc_club_db_aufraeumen(integer) from public, anon, authenticated;
grant execute on function public.kc_club_db_aufraeumen(integer) to service_role;

create or replace function public.kc_club_db_belegung()
returns jsonb
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select coalesce(jsonb_agg(jsonb_build_object('tabelle', t.name, 'bytes', t.bytes) order by t.bytes desc), '[]'::jsonb)
  from (
    select n.nspname || '.' || c.relname as name, pg_total_relation_size(c.oid) as bytes
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where c.relkind in ('r', 'm') and n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
    order by pg_total_relation_size(c.oid) desc
    limit 8
  ) t;
$function$;
revoke all on function public.kc_club_db_belegung() from public, anon, authenticated;
grant execute on function public.kc_club_db_belegung() to service_role;

select cron.schedule('kc-club-db-aufraeumen', '50 3 * * *', $$select public.kc_club_db_aufraeumen(90);$$);
