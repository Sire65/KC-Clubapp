-- KC Club-App – Version 2.24.3
-- KC-CLUB-GRUPPEN-ADMIN (Wunsch Hansi): weitere Gruppen-Admins neben dem, der die Gruppe angelegt hat.
-- Nur hinzufügend (keine bestehenden Daten geändert). Rückweg: alter table kc_club_gruppen drop column admins;
alter table kc_club_gruppen add column if not exists admins text[] not null default '{}';
