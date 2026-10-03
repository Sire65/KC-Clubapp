-- KC Club-App – Version 1.64.0
-- KC-CLUB-CHRONIK (Vorschlag + Freigabe Hansi): Clubchronik im Vereinsarchiv.
--   einreichen: alle Mitglieder dürfen in diesen Vereinsordner etwas legen – sichtbar erst nach Prüfung (Clubsprecher/Admin).
--   beschreibung: kurzer Text zu jedem Eintrag (Wer, was, wo) – erscheint auch beim Blättern.
-- Nur neue Spalten mit Standardwert; vorhandene Daten bleiben unverändert.
-- Rückweg: alter table kc_club_archiv_ordner drop column einreichen; alter table kc_club_archiv_dokumente drop column beschreibung;

alter table kc_club_archiv_ordner add column if not exists einreichen boolean not null default false;
alter table kc_club_archiv_dokumente add column if not exists beschreibung text not null default '';
