-- KC Club-App – Version 2.14.0
-- KC-CLUB-KUECHENTERROR (Wunsch Hansi): Küchenquiz auf Zeit zwischen zwei Mitgliedern in kc_club_spiele.
--   spiel 'kt': groesse 12 (Fragen), brett = 'kt' (Platzhalter), quiz = Spielstand (Fragen-ids, Antworten mit Punkten/Zeit,
--   offene Frage mit Startzeit und Antwort-Reihenfolge). Verlässt nie den Server (Tabelle: RLS ohne Richtlinien).
-- Nur Prüfregeln erweitert + eine Spalte ergänzt; vorhandene Daten bleiben unverändert.
-- Rückweg: Prüfregeln wie in v2100, alter table kc_club_spiele drop column quiz (vorher Küchenterror-Zeilen löschen).
alter table kc_club_spiele add column if not exists quiz jsonb;
alter table kc_club_spiele drop constraint if exists kc_club_spiele_spiel_check;
alter table kc_club_spiele drop constraint if exists kc_club_spiele_groesse_check;
alter table kc_club_spiele drop constraint if exists kc_club_spiele_brett_check;
alter table kc_club_spiele add constraint kc_club_spiele_spiel_check check (spiel in ('ttt', 'schach', 'bsk', 'kt'));
alter table kc_club_spiele add constraint kc_club_spiele_groesse_check check ((spiel = 'ttt' and groesse in (3, 4)) or (spiel = 'schach' and groesse = 8) or (spiel = 'bsk' and groesse = 32) or (spiel = 'kt' and groesse = 12));
alter table kc_club_spiele add constraint kc_club_spiele_brett_check check ((spiel = 'ttt' and brett ~ '^[.xo]{9}$|^[.xo]{16}$') or (spiel = 'schach' and length(brett) between 20 and 100) or (spiel = 'bsk' and brett = 'bsk' and bsk is not null) or (spiel = 'kt' and brett = 'kt' and quiz is not null));
