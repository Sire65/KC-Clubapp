-- KC Club-App – Version 2.15.0
-- KC-CLUB-HILFE-WICHTIG (Wunsch Hansi): Hilfe-Aufruf („🙋 Hilfe gesucht“ an der Pinnwand) als ❗ wichtig markieren.
-- Nur eine Spalte ergänzt (Standard false); vorhandene Daten bleiben unverändert.
-- Rückweg: alter table kc_club_hilfe_aufrufe drop column wichtig;
alter table kc_club_hilfe_aufrufe add column if not exists wichtig boolean not null default false;
