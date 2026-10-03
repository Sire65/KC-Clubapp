-- KC Club-App – Version 1.92.0
-- KC-CLUB-HILFE-OHNE-GRENZE (Wunsch Hansi: „bei Anzahl Helfer muss es auch ohne geben, egal wie viele sich melden“):
--   anzahl = null → keine Obergrenze (nie „voll“). Vorhandene Aufrufe behalten ihre Zahl.
-- Rückweg: update kc_club_hilfe_aufrufe set anzahl = 20 where anzahl is null;
--          alter table kc_club_hilfe_aufrufe alter column anzahl set not null;
--          (Prüfung bleibt: anzahl is null or anzahl between 1 and 20)

alter table kc_club_hilfe_aufrufe alter column anzahl drop not null;
alter table kc_club_hilfe_aufrufe drop constraint if exists kc_club_hilfe_aufrufe_anzahl_check;
alter table kc_club_hilfe_aufrufe add constraint kc_club_hilfe_aufrufe_anzahl_check check (anzahl is null or anzahl between 1 and 20);
