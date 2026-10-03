-- KC Club-App – Version 1.90.0
-- KC-CLUB-HILFE-ABSPRACHE (Wunsch Hansi: „ich suche nicht für heute, sondern nach Terminabsprache“):
--   nach_absprache = true → kein fester Tag; datum ist dann nur „offen bis“ (30 Tage, vorher schließbar).
-- KC-CLUB-HILFE-TEXT (Wunsch Hansi: „Texteingabe für das Gesuch größer“): Hinweis bis 1000 statt 300 Zeichen.
-- Nur neue Spalte mit Standardwert + gelockerte Längenprüfung; vorhandene Daten bleiben unverändert.
-- Rückweg: alter table kc_club_hilfe_aufrufe drop column nach_absprache;
--          alter table kc_club_hilfe_aufrufe drop constraint kc_club_hilfe_aufrufe_notiz_check;
--          alter table kc_club_hilfe_aufrufe add constraint kc_club_hilfe_aufrufe_notiz_check check (notiz is null or char_length(notiz) <= 300);
--          (vorher längere Hinweise kürzen)

alter table kc_club_hilfe_aufrufe add column if not exists nach_absprache boolean not null default false;
alter table kc_club_hilfe_aufrufe drop constraint if exists kc_club_hilfe_aufrufe_notiz_check;
alter table kc_club_hilfe_aufrufe add constraint kc_club_hilfe_aufrufe_notiz_check check (notiz is null or char_length(notiz) <= 1000);
