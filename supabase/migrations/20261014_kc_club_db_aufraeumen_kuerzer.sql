-- KC Club-App – Datenbank (ohne App-Build)
-- KC-CLUB-DB-AUFRAEUMEN-KUERZER (14.10.2026, Wunsch Hansi „Der Communicator hat doch auch ein Journal – das müsste ziemlich voll sein“):
-- Messung 14.10.: Datenbank 141 MB von 500 MB. Größte Posten: System-Check-Verlauf 40 MB (≈ 96 Prüfungen/Tag, je ≈ 9,5 kB Ergebnisse)
-- und Communicator-Messwerte 17 MB (≈ 240/Tag). Beide wurden erst nach 90 Tagen gelöscht – der System-Check-Verlauf wäre bis dahin
-- auf ≈ 85 MB gewachsen. Das Versand-Journal selbst (Aufträge 2,8 MB, Zustellmeldungen 1 MB) bleibt unverändert (eigene 180-Tage-Regel).
-- Neu (weiter nur technische Protokolle, nie Club-Daten):
--   • Communicator-Messwerte (kc_communication_health_snapshots): nur noch 30 Tage (Verlauf/Durchschnitte brauchen höchstens 7 Tage)
--   • System-Check-Verlauf: nach 14 Tagen AUSGEDÜNNT – je Prüfpunkt bleiben id, Name, Status und Gesundheit (Verlauf und Trend bleiben
--     sichtbar, Details wie Messwerte und Texte entfallen); gelöscht wird weiter erst nach p_tage (Standard 90, mindestens 60)
--   • alles andere unverändert (Spiegel-Läufe, Lebenszeichen, Rückgabe-Felder; neu: 'ausgeduennt')
-- Rückweg: Fassung aus 20261006_kc_club_v2247_db_aufraeumen.sql erneut einspielen (ausgedünnte Details kommen nicht zurück).
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
  v_ausgeduennt integer;
  v_messwerte integer;
  v_lebenszeichen integer;
begin
  select count(*) into v_spiegel_vor from public.kc_db_mirror_runs;
  perform kc_internal.kc_db_mirror_retention_cleanup();
  select count(*) into v_spiegel_nach from public.kc_db_mirror_runs;
  delete from public.kc_system_check_history where checked_at < now() - make_interval(days => v_tage);
  get diagnostics v_pruefungen = row_count;
  -- ausdünnen: nur Zeilen älter als 14 Tage, die noch Details tragen (ein Prüfpunkt mit mehr als den vier Kernfeldern); höchstens 2000 je Lauf
  update public.kc_system_check_history h
     set results = coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id', e->'id', 'name', e->'name', 'status', e->'status', 'health', e->'health')))
                               from jsonb_array_elements(h.results) e), '[]'::jsonb)
   where h.id in (select x.id from public.kc_system_check_history x
                   where x.checked_at < now() - interval '14 days' and jsonb_typeof(x.results) = 'array'
                     and exists (select 1 from jsonb_array_elements(x.results) e
                                  where jsonb_typeof(e) = 'object' and exists (select 1 from jsonb_object_keys(e) k where k not in ('id', 'name', 'status', 'health'))
                                  limit 1)
                   order by x.checked_at limit 2000);
  get diagnostics v_ausgeduennt = row_count;
  delete from public.kc_communication_health_snapshots where created_at < now() - interval '30 days';
  get diagnostics v_messwerte = row_count;
  v_lebenszeichen := coalesce(public.kc_lebenszeichen_aufraeumen(30), 0);
  return jsonb_build_object('tage', v_tage, 'spiegel', greatest(v_spiegel_vor - v_spiegel_nach, 0), 'pruefungen', v_pruefungen,
    'ausgeduennt', v_ausgeduennt, 'messwerte', v_messwerte, 'lebenszeichen', v_lebenszeichen, 'vorher', v_vorher, 'nachher', pg_database_size(current_database()));
end;
$function$;
revoke all on function public.kc_club_db_aufraeumen(integer) from public, anon, authenticated;
grant execute on function public.kc_club_db_aufraeumen(integer) to service_role;
