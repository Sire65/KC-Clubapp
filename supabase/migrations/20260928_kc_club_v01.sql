-- KC Club-App (Köcheclub Werne) – Version 0.1.0
-- Feature KC-CLUB-ZUGANG, KC-CLUB-TREFFEN, KC-CLUB-NACHRICHTEN, KC-CLUB-ANLAGEN
-- Nutzt vorhandene Kerne: kc_core_people (Mitglieder), kc_communication_threads/_thread_participants/_messages
-- (Unterhaltungen), kc_communication_attachments + Bucket kc-communication-attachments (Anlagen),
-- kc_member_push_subscriptions (Push ohne Login), KC Communicator Router (Versand Push/Mail).
-- Alle neuen Tabellen: RLS an, keine Policies → nur die Edge Function kc-club (Service-Rolle) greift zu.

-- Persönlicher Zugang (Link mit Token, nur SHA-256 gespeichert)
create table if not exists kc_club_zugang (
  person_id text primary key references kc_core_people(person_id),
  token_hash text not null unique,
  aktiv boolean not null default true,
  erstellt_am timestamptz not null default now(),
  erstellt_von text,
  zuletzt_gesehen timestamptz,
  app_version text
);

-- Rollen und Ämter im Verein (Registry statt fest im Code)
create table if not exists kc_club_rollen (
  person_id text primary key references kc_core_people(person_id),
  ist_admin boolean not null default false,
  ist_vorstand boolean not null default false,
  aemter text[] not null default '{}',
  geaendert_am timestamptz not null default now()
);

-- Köcheclub-Treffen
create table if not exists kc_club_treffen (
  id uuid primary key default gen_random_uuid(),
  titel text not null,
  beginn timestamptz not null,
  ende timestamptz,
  ort text,
  gastgeber_person_id text references kc_core_people(person_id),
  beschreibung text,
  status text not null default 'geplant' check (status in ('geplant','abgesagt')),
  erinnerung_gesendet_am timestamptz,
  erstellt_von text not null,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);
create index if not exists kc_club_treffen_beginn on kc_club_treffen (beginn);

create table if not exists kc_club_teilnahme (
  treffen_id uuid not null references kc_club_treffen(id) on delete cascade,
  person_id text not null references kc_core_people(person_id),
  antwort text not null check (antwort in ('ja','nein','vielleicht')),
  notiz text,
  geaendert_am timestamptz not null default now(),
  primary key (treffen_id, person_id)
);

-- Anlagen zu Nachrichten (Kern-Erweiterung: Nachricht ↔ Anlage)
create table if not exists kc_communication_message_attachments (
  message_id uuid not null references kc_communication_messages(id) on delete cascade,
  attachment_id uuid not null references kc_communication_attachments(id) on delete cascade,
  hochgeladen_von_person_id text,
  primary key (message_id, attachment_id)
);

-- Protokoll (wer hat was getan)
create table if not exists kc_club_protokoll (
  id bigserial primary key,
  zeit timestamptz not null default now(),
  person_id text,
  aktion text not null,
  details jsonb not null default '{}'
);

alter table kc_club_zugang enable row level security;
alter table kc_club_rollen enable row level security;
alter table kc_club_treffen enable row level security;
alter table kc_club_teilnahme enable row level security;
alter table kc_communication_message_attachments enable row level security;
alter table kc_club_protokoll enable row level security;

-- Hansi: Admin + Vorstand
insert into kc_club_rollen (person_id, ist_admin, ist_vorstand) values ('KC-P-002', true, true)
on conflict (person_id) do nothing;

-- KC Communicator: Quellprogramm, Vorlage und Ereignisregeln
insert into kc_communication_programs (id, display_name, status, allowed_channels, permissions)
values ('kc-club', 'KC Club-App', 'active', array['push','email'], '{"canSend":true,"serverOnly":true}')
on conflict (id) do nothing;

insert into kc_communication_templates (id, display_name, channel_variants)
values ('kc_club_v1', 'KC Club-App (Text kommt aus kc-club)',
  '{"push":{"title":"{{titel}}","body":"{{kurz}}"},"email":{"subject":"{{betreff}}","text":"{{text}}"}}')
on conflict (id) do nothing;

insert into kc_communication_event_rules (source_program, event_key, display_name, channels, channel_mode, template_id, quiet_hours_mode, recipient_rule)
select * from (values
  ('kc-club','club_nachricht','Club-App – neue Nachricht', array['push','email'], 'fallback', 'kc_club_v1', 'ignore', '{"type":"event"}'::jsonb),
  ('kc-club','club_treffen','Club-App – Einladung/Änderung Treffen', array['push','email'], 'all', 'kc_club_v1', 'ignore', '{"type":"event"}'::jsonb),
  ('kc-club','club_erinnerung','Club-App – Erinnerung Treffen', array['push','email'], 'fallback', 'kc_club_v1', 'ignore', '{"type":"event"}'::jsonb)
) v(a,b,c,d,e,f,g,h)
where not exists (select 1 from kc_communication_event_rules r where r.source_program=v.a and r.event_key=v.b);

-- Eigener Status (Feature KC-CLUB-STATUS): verfügbar, beschäftigt, Urlaub, krank, nicht erreichbar – optional mit Hinweis und „bis“
create table if not exists kc_club_status (
  person_id text primary key references kc_core_people(person_id),
  status text not null default 'verfuegbar' check (status in ('verfuegbar','beschaeftigt','urlaub','krank','abwesend')),
  hinweis text,
  bis date,
  geaendert_am timestamptz not null default now()
);
alter table kc_club_status enable row level security;
