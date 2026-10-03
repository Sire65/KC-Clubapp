-- KC Club-App – Version 1.69.2
-- KC-CLUB-POSTAUSGANG: neue Art „archiv_ablage“ – Aufstellungen (Erstattung, Dienstwünsche) als Textdatei in den persönlichen
-- Archiv-Ordner des Mitglieds, Status „zur Prüfung“ (der Besitzer nimmt an oder lehnt ab – persönliche Ordner bleiben seine Sache).
-- Rückweg: Constraint wieder auf ('erstattung_bestaetigung') setzen.
alter table kc_club_postausgang drop constraint if exists kc_club_postausgang_art_check;
alter table kc_club_postausgang add constraint kc_club_postausgang_art_check check (art in ('erstattung_bestaetigung', 'archiv_ablage'));
