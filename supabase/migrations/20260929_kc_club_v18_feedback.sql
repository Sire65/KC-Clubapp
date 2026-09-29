-- KC Club-App – Version 0.18.0
-- KC-CLUB-FEEDBACK: Rückmeldungen der Mitglieder zur App (Fragebogen zum Antippen + Wünsche + Freitext).
-- Eine Antwort je Person und Fragebogen (kann geändert werden). Zugriff nur über die Edge Function (service_role).
create table if not exists kc_club_feedback (
  id uuid primary key default gen_random_uuid(),
  person_id text not null,
  fragebogen text not null,
  antworten jsonb not null default '{}'::jsonb,
  idee text,
  mitteilung text,
  anonym boolean not null default false,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  unique (person_id, fragebogen)
);
alter table kc_club_feedback enable row level security;
