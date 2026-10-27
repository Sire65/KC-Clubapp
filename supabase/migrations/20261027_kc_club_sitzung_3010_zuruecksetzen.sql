-- 27.10.2026, Wunsch Hansi („Habe Fehler gemacht. Habe die Sitzung schon vorbereitet. Das muss wieder rückgängig“):
-- Büro-Speichern vom 27.10. 07:01 für das Treffen am 30.10. zurücknehmen – Stand der Spiegelung vom 26.10. 22:09.
-- Nur Daten, kein Schema. Greift nur, wenn seitdem niemand mehr etwas geändert hat (geaendert_am als Wächter).
update public.kc_club_sitzungsprotokolle
   set anwesend = '{}', entschuldigt = '{}',
       tagesordnung = array['Die Club App vorstellen und besprechen','Metall Schilder für die qr Code Etiketten.','Liste unterschreiben wegen Ehrenamt','Km Pauschale','Besetzungsmatrix besprechen','Diverse Fragen klären und darüber abstimmen'],
       geaendert_am = '2026-10-26T21:09:16.335Z'
 where id = '6ef28b5b-59ff-4830-a0a0-61bec4c3808f' and status = 'entwurf' and geaendert_am = '2026-10-27 06:01:54.461+00';
delete from public.kc_club_buero_sitzung
 where treffen_id = '968c95d3-dce0-49ea-a375-af24fe9b7308' and geaendert_am = '2026-10-27 06:01:54.337+00';
