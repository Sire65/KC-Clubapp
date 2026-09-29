-- KC Club-App – Version 0.23.0
-- KC-CLUB-GRUPPEN: benannte Gruppen-Chats (z. B. Vorstand, Küche). Die Unterhaltung selbst liegt im Kommunikations-Kern
-- (kc_communication_threads/_thread_participants/_messages) – hier nur Name, Symbol und wer sie angelegt hat.
create table if not exists kc_club_gruppen (
  thread_id uuid primary key references kc_communication_threads(id) on delete cascade,
  name text not null,
  symbol text not null default '👥',
  erstellt_von text not null,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);
alter table kc_club_gruppen enable row level security;
