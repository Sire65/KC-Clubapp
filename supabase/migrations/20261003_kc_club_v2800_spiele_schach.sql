-- KC Club-App – Version 2.8.0
-- KC-CLUB-SCHACH (Wunsch Hansi, Stufe 2 der Spiele): Schach zwischen zwei Mitgliedern in kc_club_spiele.
--   spiel 'schach': groesse 8, brett = Stellung als FEN (Weiß = spieler_x beginnt), letzter_zug = z. B. 'e2e4',
--   verlauf = Züge in Kurzschrift (für die Anzeige). Der Server prüft jeden Zug mit chess.js (BSD-2, im Funktionsordner).
-- Nur Prüfregeln erweitert + zwei Spalten ergänzt; vorhandene Daten bleiben unverändert.
-- Rückweg: alter table kc_club_spiele drop column letzter_zug, drop column verlauf; Prüfregeln wie in v2700.
alter table kc_club_spiele drop constraint if exists kc_club_spiele_spiel_check;
alter table kc_club_spiele drop constraint if exists kc_club_spiele_groesse_check;
alter table kc_club_spiele drop constraint if exists kc_club_spiele_brett_check;
alter table kc_club_spiele add column if not exists letzter_zug text check (letzter_zug is null or letzter_zug ~ '^[a-h][1-8][a-h][1-8][qrbn]?$');
alter table kc_club_spiele add column if not exists verlauf text not null default '' check (length(verlauf) <= 6000);
alter table kc_club_spiele add constraint kc_club_spiele_spiel_check check (spiel in ('ttt', 'schach'));
alter table kc_club_spiele add constraint kc_club_spiele_groesse_check check ((spiel = 'ttt' and groesse in (3, 4)) or (spiel = 'schach' and groesse = 8));
alter table kc_club_spiele add constraint kc_club_spiele_brett_check check ((spiel = 'ttt' and brett ~ '^[.xo]{9}$|^[.xo]{16}$') or (spiel = 'schach' and length(brett) between 20 and 100));
