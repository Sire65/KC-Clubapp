-- KC Club-App – Version 2.23.38
-- KC-CLUB-SCHACH-UHR (Wunsch Hansi): Live-Schach mit Schachuhr (5/10/15 Minuten je Spieler) in kc_club_spiele.
--   uhr = { min, rest: { x, o } (Millisekunden), seit (Zeitpunkt, seit dem die Uhr des Spielers am Zug läuft) oder null,
--   aus: "x"|"o"|null (wem die Zeit abgelaufen ist) }. null = Fernpartie ohne Uhr (wie bisher).
--   Die Zeit misst nur der Server (Edge Function kc-club); Tabelle weiter RLS ohne Richtlinien.
-- Nur eine Spalte + Prüfregel ergänzt; vorhandene Daten bleiben unverändert.
-- Rückweg: alter table kc_club_spiele drop constraint kc_club_spiele_uhr_check; alter table kc_club_spiele drop column uhr;
alter table kc_club_spiele add column if not exists uhr jsonb;
alter table kc_club_spiele drop constraint if exists kc_club_spiele_uhr_check;
alter table kc_club_spiele add constraint kc_club_spiele_uhr_check check (uhr is null or (spiel = 'schach' and jsonb_typeof(uhr) = 'object' and (uhr->>'min')::int in (5, 10, 15)));
