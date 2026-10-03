-- KC Club-App – Version 1.86.0
-- KC-CLUB-ORDNER-EINLEITUNG (Wunsch Hansi: Einleitungstext für die Clubchronik): Vereinsordner können eine Einleitung haben
-- (erste Zeile = Überschrift, Absätze durch Leerzeile). Erscheint oben im Ordner und beim Blättern als erste Seite nach dem Deckblatt.
-- Nur eine neue, leere Spalte. Rückweg: alter table kc_club_archiv_ordner drop column einleitung;
alter table kc_club_archiv_ordner add column if not exists einleitung text check (einleitung is null or char_length(einleitung) <= 4000);
