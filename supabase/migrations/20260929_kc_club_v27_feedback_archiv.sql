-- KC Club-App – Version 0.27.1
-- KC-CLUB-FEEDBACK-NEU: „Neues Feedback starten“ (eigene Antworten) und „Neue Runde für alle“ (Admin) löschen die aktiven
-- Antworten – vorher wird eine Kopie hier abgelegt (Recovery-Punkt, nur über die Edge Function erreichbar).
create table if not exists kc_club_feedback_archiv (
  archiv_id uuid primary key default gen_random_uuid(),
  id uuid,
  person_id text not null,
  fragebogen text not null,
  antworten jsonb not null default '{}'::jsonb,
  idee text,
  mitteilung text,
  anonym boolean not null default false,
  erstellt_am timestamptz,
  geaendert_am timestamptz,
  archiviert_am timestamptz not null default now(),
  archiviert_von text not null,
  grund text not null check (grund in ('neu_ausfuellen', 'neue_runde'))
);
alter table kc_club_feedback_archiv enable row level security;
