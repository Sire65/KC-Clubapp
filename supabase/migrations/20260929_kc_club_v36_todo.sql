-- KC Club-App – Version 0.36.0
-- KC-CLUB-TODO: To-do-Liste unter Termine – Einträge nur für mich oder für alle, abhaken mit wer/wann.
create table if not exists kc_club_todo (
  id uuid primary key default gen_random_uuid(),
  person_id text not null,
  text text not null check (char_length(text) between 1 and 200),
  kategorie text not null default 'sonstiges',
  fuer text not null default 'ich' check (fuer in ('ich', 'alle')),
  faellig date,
  erstellt_am timestamptz not null default now(),
  erledigt_am timestamptz,
  erledigt_von text,
  entfernt_am timestamptz
);
create index if not exists kc_club_todo_aktiv on kc_club_todo (erstellt_am desc) where entfernt_am is null;
alter table kc_club_todo enable row level security;
