-- KC Club-App – Version 2.219.0
-- KC-CLUB-FDK-MG + KC-CLUB-DK-MG (Wunsch Hansi „auch gegen Mitglieder mit Terminabfrage“): Fang den Koch und Doppelkopf
-- zwischen zwei Mitgliedern in kc_club_spiele.
--   spiel 'fdk': groesse 24 (Felder), brett = 'fdk' (Platzhalter), fdk = Spielstand (Bons, Karten, Vorräte, Verlauf).
--   spiel 'dk':  groesse 4 (Plätze), brett = 'dk' (Platzhalter), dk = Spielstand (Hände, Stiche); die zwei freien Plätze spielt der Server-Computer.
--   Der Server würfelt/mischt und prüft jeden Zug; die Hände verlassen nie den Server (RLS ohne Richtlinien).
-- Nur Prüfregeln erweitert + zwei Spalten ergänzt; vorhandene Daten bleiben unverändert.
-- Rückweg: Prüfregeln wie in v2260 (ohne 'fdk', 'dk'), alter table kc_club_spiele drop column fdk, drop column dk (vorher Zeilen mit spiel in ('fdk','dk') löschen).
alter table kc_club_spiele add column if not exists fdk jsonb;
alter table kc_club_spiele add column if not exists dk jsonb;
alter table kc_club_spiele drop constraint if exists kc_club_spiele_spiel_check;
alter table kc_club_spiele drop constraint if exists kc_club_spiele_groesse_check;
alter table kc_club_spiele drop constraint if exists kc_club_spiele_brett_check;
alter table kc_club_spiele add constraint kc_club_spiele_spiel_check check (spiel in ('ttt', 'schach', 'bsk', 'kt', 'mae', 'fdk', 'dk'));
alter table kc_club_spiele add constraint kc_club_spiele_groesse_check check ((spiel = 'ttt' and groesse in (3, 4)) or (spiel = 'schach' and groesse = 8) or (spiel = 'bsk' and groesse = 32) or (spiel = 'kt' and groesse = 12) or (spiel = 'mae' and groesse = 4) or (spiel = 'fdk' and groesse = 24) or (spiel = 'dk' and groesse = 4));
alter table kc_club_spiele add constraint kc_club_spiele_brett_check check ((spiel = 'ttt' and brett ~ '^[.xo]{9}$|^[.xo]{16}$') or (spiel = 'schach' and length(brett) between 20 and 100) or (spiel = 'bsk' and brett = 'bsk' and bsk is not null) or (spiel = 'kt' and brett = 'kt' and quiz is not null) or (spiel = 'mae' and brett = 'mae' and mae is not null and jsonb_typeof(mae) = 'object') or (spiel = 'fdk' and brett = 'fdk' and fdk is not null and jsonb_typeof(fdk) = 'object') or (spiel = 'dk' and brett = 'dk' and dk is not null and jsonb_typeof(dk) = 'object'));
