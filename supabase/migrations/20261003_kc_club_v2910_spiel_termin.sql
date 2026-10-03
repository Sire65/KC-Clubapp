-- KC Club-App – Version 2.9.1
-- KC-CLUB-SPIEL-TERMIN (Wunsch Hansi): zu einer Partie einen Termin vereinbaren – nutzt die vorhandene Terminanfrage
--   (steht dadurch bei beiden im Kalender und im Kalender-Abo, Vortags-Erinnerung wie bisher). Neu: Verknüpfung mit der Partie
--   und eine Erinnerung kurz vor Beginn (30/60/120 Minuten) an beide, sobald zugesagt wurde.
-- Nur Spalten ergänzt. Rückweg: alter table kc_club_terminanfragen drop column spiel_id, drop column erinnerung_min, drop column kurz_erinnert_am;
alter table kc_club_terminanfragen add column if not exists spiel_id uuid references kc_club_spiele(id) on delete set null;
alter table kc_club_terminanfragen add column if not exists erinnerung_min integer not null default 0 check (erinnerung_min in (0, 30, 60, 120));
alter table kc_club_terminanfragen add column if not exists kurz_erinnert_am timestamptz;
create index if not exists kc_club_terminanfragen_spiel on kc_club_terminanfragen (spiel_id) where spiel_id is not null;
