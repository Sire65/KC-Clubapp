-- KC-SECURITY-DEFINER-REGISTER (08.11.2026, Wunsch Hansi „Ja mach die Regel“): Prüfregister-Einträge für die zwei Funktionen aus
-- 20261108_kc_dp_dienst_rueckmeldung.sql (System-Check meldete GELB „2 SECURITY-DEFINER-Ausführungsrecht(e) · prüfen“).
-- Geprüft 08.11.2026: beide verlangen auth.uid() und eine aktive DP-Mitgliedschaft (entscheiden: Planer-Rolle), kein anon.
-- Am 08.11. schon von Hand eingetragen – diese Datei hält es im Repository fest (wiederholbar, legt nichts doppelt an).
insert into public.kc_security_reviewed_exceptions (object_schema, object_name, object_type, finding_code, decision, reason, reviewed_at, review_after, active)
select 'public', v.name, 'function', 'security_definer_authenticated_execute', 'accepted_required', 'KC-CLUB-SYSTEMCHECK-GRUEN 08.11.2026: ' || v.grund, now(), now() + interval '6 months', true
  from (values
    ('kc_dp_rueckmeldung_entscheiden', 'verlangt auth.uid() und aktive DP-Rolle admin/planner/duty_manager der Organisation der Rückmeldung; Status nur bestaetigt/abgelehnt, Ablehnung nur mit Grund. Kein anon.'),
    ('kc_dp_rueckmeldungen_liste', 'verlangt auth.uid() und aktive DP-Mitgliedschaft für p_org_id; Planer sehen alle, sonst nur eigene Rückmeldungen (person_id); Zeitraum höchstens 400 Tage. Kein anon.')
  ) as v(name, grund)
 where not exists (select 1 from public.kc_security_reviewed_exceptions r
                    where r.object_schema = 'public' and r.object_name = v.name and r.finding_code = 'security_definer_authenticated_execute' and r.active);
