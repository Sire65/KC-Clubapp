-- KC Club-App – Datenbank (ohne App-Build)
-- KC-CLUB-SYSTEMCHECK-GRUEN (03.11.2026, Wunsch Hansi „Ja mach das und Optimierung Tabelle und Regel zum Löschen, dass alte gelöscht werden“)
-- Anlass: KC System Check meldet seit Tagen GELB aus zwei Gründen:
--   1. Datenbank-Kapazität: kc_system_check_history ist die größte Tabelle (35 MB) und hatte einen Vacuum-Rückstand
--      (die nächtliche Ausdünnung schreibt Zeilen um, Autovacuum sprang bei der Tabelle nie an).
--      Messung 03.11.: 5946 Zeilen seit 01.09.; neue Zeilen je ≈ 56 kB (früher 9,5 kB – die Sicherheitsprüfung schreibt lange Listen mit),
--      die letzten 14 Tage allein 18 MB.
--   2. Datenbank-Sicherheitslage: 26 SECURITY-DEFINER-Funktionen, die angemeldete Programme (authenticated) aufrufen dürfen, standen noch
--      nicht im Prüfregister kc_security_reviewed_exceptions.
-- Neu:
--   a) System-Check-Verlauf: nach 3 Tagen ausgedünnt (bisher 14; je Prüfpunkt bleiben id, Name, Status, Gesundheit), nach 40 Tagen gelöscht
--      (bisher 90; kc_system_check_usage wertet 31 Tage aus). Übrige Regeln unverändert (Messwerte 30 Tage, Lebenszeichen 30, Spiegel-Läufe).
--   b) Autovacuum für diese Tabelle früher (2 % statt 20 % geänderter Zeilen), damit nach dem Ausdünnen der Platz frei wird.
--   c) Prüfregister: die 26 Funktionen einzeln geprüft (03.11.2026) – jede verlangt eine Anmeldung (auth.uid()) und eine aktive Rolle
--      (DP-Planung admin/planner/duty_manager, KC-Manager operator/manager/admin bzw. KC_MANAGER-Zugang, Admin/Superadmin), bevor sie
--      etwas liest oder schreibt; die zwei Dankes-Mail-Funktionen nur mit Geheimnis (wie schon für anon geprüft). Wiedervorlage in 6 Monaten.
-- Nur Technik, keine Club-Inhalte. Rückweg: 20261014_kc_club_db_aufraeumen_kuerzer.sql erneut einspielen; alter table … reset (…);
--   delete from public.kc_security_reviewed_exceptions where reason like 'KC-CLUB-SYSTEMCHECK-GRUEN%';

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
  v_check_tage integer := least(v_tage, 40); -- KC-CLUB-SYSTEMCHECK-SCHLANK: System-Check-Verlauf höchstens 40 Tage (Auswertung braucht 31)
begin
  select count(*) into v_spiegel_vor from public.kc_db_mirror_runs;
  perform kc_internal.kc_db_mirror_retention_cleanup();
  select count(*) into v_spiegel_nach from public.kc_db_mirror_runs;
  delete from public.kc_system_check_history where checked_at < now() - make_interval(days => v_check_tage);
  get diagnostics v_pruefungen = row_count;
  -- ausdünnen: nur Zeilen älter als 3 Tage (bisher 14), die noch Details tragen (ein Prüfpunkt mit mehr als den vier Kernfeldern); höchstens 2000 je Lauf
  update public.kc_system_check_history h
     set results = coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id', e->'id', 'name', e->'name', 'status', e->'status', 'health', e->'health')))
                               from jsonb_array_elements(h.results) e), '[]'::jsonb)
   where h.id in (select x.id from public.kc_system_check_history x
                   where x.checked_at < now() - interval '3 days' and jsonb_typeof(x.results) = 'array'
                     and exists (select 1 from jsonb_array_elements(x.results) e
                                  where jsonb_typeof(e) = 'object' and exists (select 1 from jsonb_object_keys(e) k where k not in ('id', 'name', 'status', 'health'))
                                  limit 1)
                   order by x.checked_at limit 2000);
  get diagnostics v_ausgeduennt = row_count;
  delete from public.kc_communication_health_snapshots where created_at < now() - interval '30 days';
  get diagnostics v_messwerte = row_count;
  v_lebenszeichen := coalesce(public.kc_lebenszeichen_aufraeumen(30), 0);
  return jsonb_build_object('tage', v_tage, 'checkTage', v_check_tage, 'spiegel', greatest(v_spiegel_vor - v_spiegel_nach, 0), 'pruefungen', v_pruefungen,
    'ausgeduennt', v_ausgeduennt, 'messwerte', v_messwerte, 'lebenszeichen', v_lebenszeichen, 'vorher', v_vorher, 'nachher', pg_database_size(current_database()));
end;
$function$;
revoke all on function public.kc_club_db_aufraeumen(integer) from public, anon, authenticated;
grant execute on function public.kc_club_db_aufraeumen(integer) to service_role;

alter table public.kc_system_check_history set (autovacuum_vacuum_scale_factor = 0.02, autovacuum_vacuum_threshold = 50,
  toast.autovacuum_vacuum_scale_factor = 0.02, toast.autovacuum_vacuum_threshold = 50);

insert into public.kc_security_reviewed_exceptions (object_schema, object_name, object_type, finding_code, decision, reason, reviewed_at, review_after, active)
select 'public', v.name, 'function', 'security_definer_authenticated_execute', 'accepted_required',
       'KC-CLUB-SYSTEMCHECK-GRUEN 03.11.2026: ' || v.grund, now(), now() + interval '6 months', true
  from (values
    ('kc_club_adress_meldung_erledigen', 'verlangt auth.uid() und aktive KC-Manager-Rolle operator/manager/admin der Organisation der Meldung; Status nur uebernommen/abgelehnt.'),
    ('kc_club_adress_meldungen_offen', 'verlangt auth.uid() und aktive KC-Manager-Rolle operator/manager/admin für p_org_id, sonst Fehler 42501.'),
    ('kc_core_person_aenderung_quittieren', 'verlangt auth.uid() und Admin oder KC_MANAGER-Zugang manager/admin der Organisation; Status validiert.'),
    ('kc_core_person_aenderung_uebernehmen', 'verlangt auth.uid(), Programm KC_MANAGER und Admin oder KC_MANAGER-Zugang manager/admin, bevor geschrieben wird; Entscheidung validiert.'),
    ('kc_core_person_aenderungen_offen', 'verlangt auth.uid() und Admin oder KC_MANAGER-Zugang manager/admin für p_org_id.'),
    ('kc_dp_carpools_publish', 'verlangt auth.uid() und aktive DP-Rolle admin/planner/duty_manager für p_org_id.'),
    ('kc_dp_days_publish', 'verlangt auth.uid() und aktive DP-Rolle admin/planner/duty_manager für p_org_id.'),
    ('kc_dp_hour_report_decide', 'verlangt auth.uid() und aktive DP-Rolle admin/planner/duty_manager der Organisation der Meldung; Status und Grund validiert.'),
    ('kc_dp_hour_reports_pending', 'verlangt auth.uid() und aktive DP-Rolle admin/planner/duty_manager für p_org_id.'),
    ('kc_dp_nicht_planbar', 'verlangt auth.uid() und aktive DP-Rolle admin/planner/duty_manager für p_org.'),
    ('kc_dp_plan_publish', 'verlangt auth.uid() und aktive DP-Rolle admin/planner/duty_manager für p_org_id.'),
    ('kc_dp_special_event_signups_list', 'verlangt auth.uid() und aktive DP-Rolle admin/planner/duty_manager für p_org_id.'),
    ('kc_dp_special_events_publish', 'verlangt auth.uid() und aktive DP-Rolle admin/planner/duty_manager für p_org_id.'),
    ('kc_dp_wish_inbox_ack', 'verlangt auth.uid() und aktive DP-Rolle admin/planner/duty_manager der Organisation des Eingangs; Status validiert.'),
    ('kc_dp_wish_inbox_ack_claimed', 'verlangt auth.uid(), Reservierungs-Token und aktive DP-Rolle admin/planner/duty_manager; prüft Revision.'),
    ('kc_dp_wish_inbox_claim', 'verlangt auth.uid(), Geräte-Kennung und aktive DP-Rolle admin/planner/duty_manager der Organisation des Eingangs.'),
    ('kc_dp_wish_inbox_pending', 'verlangt auth.uid() und aktive DP-Rolle admin/planner/duty_manager für p_org_id.'),
    ('kc_dp_wish_inbox_receipt', 'verlangt auth.uid() und aktive DP-Rolle admin/planner/duty_manager der Organisation des Eingangs; liefert nur Status-Angaben.'),
    ('kc_dp_wish_inbox_release', 'verlangt auth.uid() und aktive DP-Rolle; gibt nur mit passendem Reservierungs-Token frei.'),
    ('kc_dp_workspace_read', 'verlangt auth.uid(), dauerhaften (nicht anonymen) Benutzer und aktive DP-Rolle admin/planner/duty_manager, sonst Fehler 42501.'),
    ('kc_dp_workspace_save', 'verlangt auth.uid(), dauerhaften Benutzer und aktive DP-Rolle admin/planner/duty_manager; Versionsprüfung.'),
    ('kc_manager_section_speichern', 'verlangt auth.uid() und aktive KC-Manager-Rolle operator/manager/admin für p_org_id; Abschnittsname per Muster geprüft, Versionsprüfung.'),
    ('kc_rt_programm_kanal', 'liefert nur für angemeldete, nicht anonyme Benutzer mit passender Admin-/Manager-/DP-Mitgliedschaft einen Kanal, sonst null.'),
    ('kc_wm_danke_mail_erledigt', 'nur mit Geheimnis (kc_wm_danke_mail_pruefen, SHA-256 in kc_automation_credentials) – gleicher Weg wie die geprüfte anon-Ausnahme.'),
    ('kc_wm_danke_mail_offen', 'nur mit Geheimnis (kc_wm_danke_mail_pruefen, SHA-256 in kc_automation_credentials) – gleicher Weg wie die geprüfte anon-Ausnahme.'),
    ('kc_zeiterfassung_zugaenge', 'liefert nur für angemeldete, nicht anonyme Benutzer mit aktiver KC-Manager-Rolle admin/superadmin Daten, sonst null.')
  ) as v(name, grund)
 where not exists (select 1 from public.kc_security_reviewed_exceptions r
                    where r.object_schema = 'public' and r.object_name = v.name and r.finding_code = 'security_definer_authenticated_execute' and r.active);
