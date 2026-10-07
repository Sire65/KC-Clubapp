-- Daten (Auftrag Hansi, 07.10.2026): Protokoll-Entwurf für die Besprechung mit Klaus am 08.10.2026, 9:30 Uhr – im Protokoll-System der App.
-- Nur Entwurf (nicht veröffentlicht): sichtbar für Verfasser und Clubleitung, kein Push, keine Mail. Nur anlegen, wenn noch nicht vorhanden.
-- Rückweg: delete from kc_club_sitzungsprotokolle where titel = 'Besprechung Hansi & Klaus, 08.10.26' and datum = '2026-10-08' and status = 'entwurf';
insert into kc_club_sitzungsprotokolle (titel, datum, ort, anwesend, tagesordnung, kurzfassung, status, verfasser)
select 'Besprechung Hansi & Klaus, 08.10.26', date '2026-10-08', null, array['KC-P-002', 'KC-P-M0009'],
  array['Dienstplanung mit der neuen App (DP2)', 'Schulungsstand', 'Club-App – Stand und nächste Schritte', 'Abstimmungsliste bezüglich Clubvorgaben', 'Verschiedenes / weitere Punkte'],
  'Beginn: 9:30 Uhr. Weitere Punkte können noch ergänzt werden.', 'entwurf', 'KC-P-002'
where not exists (select 1 from kc_club_sitzungsprotokolle where titel = 'Besprechung Hansi & Klaus, 08.10.26' and datum = date '2026-10-08');
insert into kc_club_protokoll (person_id, aktion, details)
select 'KC-P-002', 'sitzungsprotokoll_angelegt', jsonb_build_object('protokoll', id, 'weg', 'db-einspielen') from kc_club_sitzungsprotokolle
where titel = 'Besprechung Hansi & Klaus, 08.10.26' and datum = date '2026-10-08' and not exists (select 1 from kc_club_protokoll where aktion = 'sitzungsprotokoll_angelegt' and details->>'protokoll' = kc_club_sitzungsprotokolle.id::text);
