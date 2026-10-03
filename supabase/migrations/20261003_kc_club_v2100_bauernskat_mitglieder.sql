-- KC Club-App – Version 2.10.0
-- KC-CLUB-BAUERNSKAT-MG (Wunsch Hansi): Bauernskat zwischen zwei Mitgliedern in kc_club_spiele.
--   spiel 'bsk': groesse 32 (Karten), brett = 'bsk' (Platzhalter), bsk = vollständiger Spielstand (Handkarten, verdeckte Bauern).
--   Die Spalte bsk verlässt nie den Server: die App bekommt nur ihre eigene Sicht (eigene Hand, offene Bauern, Stiche).
--   Tabelle hat RLS ohne Richtlinien – nur die Server-Funktion (service role) liest/schreibt.
-- Nur Prüfregeln erweitert + eine Spalte ergänzt; vorhandene Daten bleiben unverändert.
-- Rückweg: Prüfregeln wie in v2800, alter table kc_club_spiele drop column bsk (vorher Bauernskat-Zeilen löschen).
alter table kc_club_spiele add column if not exists bsk jsonb;
alter table kc_club_spiele drop constraint if exists kc_club_spiele_spiel_check;
alter table kc_club_spiele drop constraint if exists kc_club_spiele_groesse_check;
alter table kc_club_spiele drop constraint if exists kc_club_spiele_brett_check;
alter table kc_club_spiele add constraint kc_club_spiele_spiel_check check (spiel in ('ttt', 'schach', 'bsk'));
alter table kc_club_spiele add constraint kc_club_spiele_groesse_check check ((spiel = 'ttt' and groesse in (3, 4)) or (spiel = 'schach' and groesse = 8) or (spiel = 'bsk' and groesse = 32));
alter table kc_club_spiele add constraint kc_club_spiele_brett_check check ((spiel = 'ttt' and brett ~ '^[.xo]{9}$|^[.xo]{16}$') or (spiel = 'schach' and length(brett) between 20 and 100) or (spiel = 'bsk' and brett = 'bsk' and bsk is not null));
