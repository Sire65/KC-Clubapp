-- KC-CLUB-PROBEPHASE (2.51.0) – Daten (Auftrag Hansi, 07.10.2026): Manfred (KC-P-M0011) in die Probephase, Frist ab morgen 4 Wochen.
-- Nutzen kann er die App weiter ganz normal; die Probe ändert nur Begrüßung/Statistik/Abstimmung. Nur einfügen, wenn noch keine Probe besteht.
-- Rückweg: delete from kc_club_person_einstellung where person_id = 'KC-P-M0011' and schluessel = 'probephase';
insert into kc_club_person_einstellung (person_id, schluessel, wert, geaendert_am)
values ('KC-P-M0011', 'probephase', jsonb_build_object('an', true, 'seit', '2026-10-08T00:00:00+02:00', 'bis', '2026-11-05', 'von', 'KC-P-002'), now())
on conflict (person_id, schluessel) do nothing;
insert into kc_club_protokoll (person_id, aktion, details)
values ('KC-P-002', 'probe_gestartet', jsonb_build_object('fuer', 'KC-P-M0011', 'bis', '2026-11-05', 'weg', 'db-einspielen'));
