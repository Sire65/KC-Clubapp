-- KC Club-App – Version 2.26.0
-- KC-CLUB-MAE (Wunsch Hansi): „Mensch ärgere dich nicht“ zwischen zwei Mitgliedern in kc_club_spiele.
--   spiel 'mae': groesse 4 (Farben), brett = 'mae' (Platzhalter), mae = Spielstand (Sitze mit Figuren, wer dran ist, Wurf, Verlauf).
--   Der Server würfelt und prüft jeden Zug; freie Farben spielt der Server-Computer. Verlässt nie den Server (RLS ohne Richtlinien).
-- Nur Prüfregeln erweitert + eine Spalte ergänzt; vorhandene Daten bleiben unverändert.
-- Rückweg: Prüfregeln wie in v2140 (ohne 'mae'), alter table kc_club_spiele drop column mae (vorher Zeilen mit spiel = 'mae' löschen).
alter table kc_club_spiele add column if not exists mae jsonb;
alter table kc_club_spiele drop constraint if exists kc_club_spiele_spiel_check;
alter table kc_club_spiele drop constraint if exists kc_club_spiele_groesse_check;
alter table kc_club_spiele drop constraint if exists kc_club_spiele_brett_check;
alter table kc_club_spiele add constraint kc_club_spiele_spiel_check check (spiel in ('ttt', 'schach', 'bsk', 'kt', 'mae'));
alter table kc_club_spiele add constraint kc_club_spiele_groesse_check check ((spiel = 'ttt' and groesse in (3, 4)) or (spiel = 'schach' and groesse = 8) or (spiel = 'bsk' and groesse = 32) or (spiel = 'kt' and groesse = 12) or (spiel = 'mae' and groesse = 4));
alter table kc_club_spiele add constraint kc_club_spiele_brett_check check ((spiel = 'ttt' and brett ~ '^[.xo]{9}$|^[.xo]{16}$') or (spiel = 'schach' and length(brett) between 20 and 100) or (spiel = 'bsk' and brett = 'bsk' and bsk is not null) or (spiel = 'kt' and brett = 'kt' and quiz is not null) or (spiel = 'mae' and brett = 'mae' and mae is not null and jsonb_typeof(mae) = 'object'));
