-- KC-CLUB-WM-TODO (09.10.2026, Wunsch Hansi): To-do-Liste Weihnachtsmarkt Kirchplatz (04.–13.12.2026) aus dem Vertrag mit Werne Marketing.
-- Nur Daten: 17 To-dos für Hansi (KC-P-002, „nur ich“, keine Zuständigen → keine Benachrichtigung). Wiederholbar (legt nichts doppelt an).
-- Rückweg: update public.kc_club_todo set entfernt_am = now() where person_id = 'KC-P-002' and text like '🎄 WM: %' and entfernt_am is null;
insert into public.kc_club_todo (person_id, text, kategorie, fuer, faellig)
select 'KC-P-002', v.text, v.kat, 'ich', v.faellig::date
from (values
  ('🎄 WM: Vertrag unterschrieben zurück an Werne Marketing', 'erledigen', '2026-10-16'),
  ('🎄 WM: Müllentsorgung mit Werne Marketing abstimmen', 'anrufen', '2026-10-16'),
  ('🎄 WM: Gasnutzung bei Werne Marketing anmelden', 'erledigen', '2026-11-06'),
  ('🎄 WM: Parkausweis beantragen (Kennzeichen + Name, 20 €)', 'erledigen', '2026-11-06'),
  ('🎄 WM: Versicherungsnachweis (Haftpflicht/Unfall) bereitlegen', 'vorbereiten', '2026-11-06'),
  ('🎄 WM: Feuerlöscher prüfen', 'vorbereiten', '2026-11-20'),
  ('🎄 WM: Warmwasserstelle zum Händewaschen organisieren', 'vorbereiten', '2026-11-20'),
  ('🎄 WM: Beleuchtung + Stromverteilung (32 A CEE) besorgen', 'bestellung', '2026-11-20'),
  ('🎄 WM: Standschild (Name/Anschrift) + Preisschilder erstellen', 'vorbereiten', '2026-11-20'),
  ('🎄 WM: Kasse einrichten (Grünkohl, Eintöpfe, Getränke)', 'vorbereiten', '2026-11-20'),
  ('🎄 WM: Rechnung Standmiete bezahlen', 'erledigen', '2026-11-27'),
  ('🎄 WM: Mehrweggeschirr, Scherbenbehälter, Kehrgeräte bereitstellen', 'vorbereiten', '2026-11-27'),
  ('🎄 WM: Bodenschutz für den Stand besorgen', 'einkaufen', '2026-11-27'),
  ('🎄 WM: Behälter für Altfett bereitstellen', 'vorbereiten', '2026-11-27'),
  ('🎄 WM: Stand aufbauen (Do 03.12. ab 10 Uhr bis Fr 04.12., 13 Uhr)', 'vorbereiten', '2026-12-03'),
  ('🎄 WM: Täglich – Öffnung Mo–Fr 15–21, Sa 12–22, So 12–20 Uhr · ab Dunkelheit beleuchten · nach Schluss fegen, Hütte abschließen', 'erledigen', '2026-12-04'),
  ('🎄 WM: Stand abbauen, Hütte leer, Altfett mitnehmen, Platz sauber (So 13.12. ab 20 Uhr bis Mo 14.12., 12 Uhr)', 'erledigen', '2026-12-13')
) as v(text, kat, faellig)
where not exists (select 1 from public.kc_club_todo t where t.person_id = 'KC-P-002' and t.text = v.text and t.entfernt_am is null);
