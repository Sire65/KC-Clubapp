-- KC Club-App – Version 0.37.0
-- KC-CLUB-TODO: „Wer soll es machen?“ – zuständiges Mitglied je Eintrag (bekommt Bescheid, sieht und darf abhaken).
alter table kc_club_todo add column if not exists zustaendig text;
create index if not exists kc_club_todo_zustaendig on kc_club_todo (zustaendig) where entfernt_am is null;
