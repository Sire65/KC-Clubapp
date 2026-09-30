-- KC Club-App – Version 1.0.0
-- KC-CLUB-PRIVATTERMIN (Wunsch Hansi: „im Kalender auch Privateintrag – Neu und dann Häkchen privat“):
--   persönliche Kalendereinträge, die NUR die Person selbst sieht (App, Kalender, „Demnächst“, eigenes Kalender-Abo).
--   Optional Erinnerung (Minuten vorher) per Push/Mail nach den eigenen Einstellungen.
-- Eigene Tabelle (nicht kc_club_treffen): Treffen sind für alle sichtbar.
-- Zugriff nur über die Edge Function kc-club (RLS an, keine Policies). Rückweg: drop table kc_club_privattermine;
create table if not exists kc_club_privattermine (
  id uuid primary key default gen_random_uuid(),
  person_id text not null references kc_core_people(person_id),
  titel text not null,
  beginn timestamptz not null,
  ende timestamptz,
  ganztaegig boolean not null default false,
  ort text,
  notiz text,
  erinnerung_min integer not null default 0 check (erinnerung_min between 0 and 10080),
  erinnert_am timestamptz,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);
create index if not exists kc_club_privattermine_person_beginn on kc_club_privattermine (person_id, beginn);
create index if not exists kc_club_privattermine_erinnerung on kc_club_privattermine (beginn) where erinnerung_min > 0 and erinnert_am is null;
alter table kc_club_privattermine enable row level security;
