-- KC-DP-STEMPEL-PRUEFREGISTER (18.11.2026): System Check GELB „3 SECURITY-DEFINER-Ausführungsrecht(e) · prüfen“ – die Stempel-Kasse
-- (Migrationen kc_dp_stempel_kasse / kc_dp_stempel_manager_session vom 18.11., andere Sitzung) wurde ohne Eintrag im Prüfregister angelegt.
-- Geprüft 18.11.2026 (nur Funktionscode): alle drei verlangen service_role oder auth.uid() mit aktiver DP-Mitgliedschaft admin/planner der
-- Organisation; kein anon. Am 18.11. schon von Hand eingetragen – diese Datei hält es im Repository fest (wiederholbar, legt nichts doppelt an).
insert into public.kc_security_reviewed_exceptions (object_schema, object_name, object_type, finding_code, decision, reason, reviewed_at, review_after, active)
select 'public', v.name, 'function', 'security_definer_authenticated_execute', 'accepted_required', 'KC-DP-STEMPEL-PRUEFREGISTER 18.11.2026 (Freigabe-Regel Hansi): ' || v.grund, now(), now() + interval '6 months', true
  from (values
    ('kc_dp_stempel_kasse_melden', 'nur service_role oder auth.uid() mit aktiver DP-Mitgliedschaft admin/planner der Organisation; höchstens 100 Buchungen je Aufruf, Felder geprüft. Kein anon.'),
    ('kc_dp_stempel_kasse_stand', 'nur service_role oder auth.uid() mit aktiver DP-Mitgliedschaft admin/planner der Organisation; nur letzte Buchung je Mitglied der letzten 36 Std. Kein anon.'),
    ('kc_dp_stempel_paare_liste', 'verlangt auth.uid() und aktive DP-Mitgliedschaft admin/planner der Organisation; Zeitraum höchstens 400 Tage. Kein anon.')
  ) as v(name, grund)
 where exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = v.name)
   and not exists (select 1 from public.kc_security_reviewed_exceptions r
                    where r.object_schema = 'public' and r.object_name = v.name and r.finding_code = 'security_definer_authenticated_execute' and r.active);
