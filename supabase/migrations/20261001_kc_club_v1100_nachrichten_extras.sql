-- KC Club-App – Version 1.10.0 (Wunsch Hansi 01.10.2026, WhatsApp-Funktionen „zwei Sterne“)
-- KC-CLUB-ANHEFTEN   Nachricht oben im Chat anheften (höchstens 3 je Unterhaltung, jeder Teilnehmer darf)
-- KC-CLUB-MERKEN     eigene Merkliste („⭐ gemerkt“) – nur für die Person selbst sichtbar
-- KC-CLUB-CHATUMFRAGE kurze Abstimmung als Nachricht (2–8 Antworten, einfach oder mehrfach); Stimmen je Person
-- KC-CLUB-KONTAKT    Mitglied als Kontaktkarte schicken – speichert nur die Person, KEINE Kontaktdaten; angezeigt wird
--                    über die vorhandene Mitglieder-Ansicht mit deren Freigaberegeln (kein zweiter Weg zu Telefon/Mail)
-- Alles hängt an kc_communication_messages (on delete cascade); die Kern-Tabelle selbst bleibt unverändert.
-- Zugriff nur über den Server (kc-club), RLS an, keine Policies. Spiegel/Sicherung wie die übrigen Club-Tabellen.
-- Rückweg: die fünf Tabellen droppen (Spiegel-Regeln löschen).

create table if not exists kc_club_angeheftet (
  message_id uuid primary key references kc_communication_messages(id) on delete cascade,
  thread_id uuid not null,
  von text not null references kc_core_people(person_id),
  am timestamptz not null default now()
);
create index if not exists kc_club_angeheftet_thread on kc_club_angeheftet (thread_id, am desc);

create table if not exists kc_club_gemerkt (
  person_id text not null references kc_core_people(person_id),
  message_id uuid not null references kc_communication_messages(id) on delete cascade,
  am timestamptz not null default now(),
  primary key (person_id, message_id)
);

create table if not exists kc_club_chat_umfrage (
  message_id uuid primary key references kc_communication_messages(id) on delete cascade,
  frage text not null check (char_length(frage) between 1 and 200),
  optionen jsonb not null check (jsonb_typeof(optionen) = 'array' and jsonb_array_length(optionen) between 2 and 8),
  mehrfach boolean not null default false,
  erstellt_von text not null references kc_core_people(person_id)
);

create table if not exists kc_club_chat_stimme (
  message_id uuid not null references kc_club_chat_umfrage(message_id) on delete cascade,
  person_id text not null references kc_core_people(person_id),
  option smallint not null check (option between 0 and 7),
  am timestamptz not null default now(),
  primary key (message_id, person_id, option)
);

create table if not exists kc_club_chat_kontakt (
  message_id uuid primary key references kc_communication_messages(id) on delete cascade,
  person_id text not null references kc_core_people(person_id)
);

alter table kc_club_angeheftet enable row level security;
alter table kc_club_gemerkt enable row level security;
alter table kc_club_chat_umfrage enable row level security;
alter table kc_club_chat_stimme enable row level security;
alter table kc_club_chat_kontakt enable row level security;
revoke all on kc_club_angeheftet, kc_club_gemerkt, kc_club_chat_umfrage, kc_club_chat_stimme, kc_club_chat_kontakt from anon, authenticated;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_angeheftet', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-ANHEFTEN (1.10.0)'),
  ('kc_club_gemerkt', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-MERKEN (1.10.0)'),
  ('kc_club_chat_umfrage', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-CHATUMFRAGE (1.10.0)'),
  ('kc_club_chat_stimme', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-CHATUMFRAGE (1.10.0): Stimmen'),
  ('kc_club_chat_kontakt', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-KONTAKT (1.10.0): nur Person, keine Kontaktdaten')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values
  ('kc_club_angeheftet'), ('kc_club_gemerkt'), ('kc_club_chat_umfrage'), ('kc_club_chat_stimme'), ('kc_club_chat_kontakt')
on conflict (table_name) do nothing;
