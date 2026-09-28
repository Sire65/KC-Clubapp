-- KC Club-App – Version 0.9.0
-- Feature KC-CLUB-PROTOKOLLE: Sitzungsprotokolle zu Club-Treffen.
--   Vorlage wird automatisch befüllt (Datum, Ort, anwesend/entschuldigt aus Zu-/Absagen, Tagesordnung aus Themen,
--   Beschlüsse aus Abstimmungen). Das eigentliche Protokoll wird als Foto (Kamera/Galerie) oder Datei (Word/PDF)
--   angehängt. Veröffentlichen → 7 Tage Einspruch → genehmigt. Korrektur = neue Fassung (alte bleibt erhalten).
--   Schreiben/Lesen: alle Mitglieder mit protokolle_lesen (Aushilfen nicht). Lesebestätigung.
-- Feature KC-CLUB-AUFGABEN: Aufgaben „wer macht was bis wann“ (meist aus dem Protokoll), Erinnerung am Vortag.
-- Hinweis: kc_club_protokoll ist das technische Änderungsprotokoll – die Sitzungsprotokolle heißen kc_club_sitzungsprotokolle.

-- Leserecht über die Rollen-Registry (Standard: ja; Aushilfen: nein)
alter table kc_club_rollen add column if not exists protokolle_lesen boolean not null default true;
update kc_club_rollen set protokolle_lesen = false where 'Aushilfe' = any(aemter);

create table if not exists kc_club_sitzungsprotokolle (
  id uuid primary key default gen_random_uuid(),
  treffen_id uuid references kc_club_treffen(id) on delete set null,
  titel text not null,
  datum date not null,
  ort text,
  anwesend text[] not null default '{}',        -- person_ids
  entschuldigt text[] not null default '{}',    -- person_ids
  gaeste text,
  tagesordnung text[] not null default '{}',
  beschluesse text[] not null default '{}',
  kurzfassung text,
  status text not null default 'entwurf' check (status in ('entwurf','veroeffentlicht')),
  version int not null default 1,
  verfasser text not null references kc_core_people(person_id),
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  veroeffentlicht_am timestamptz,
  einspruch_bis timestamptz
);
create unique index if not exists kc_club_sitzungsprotokolle_treffen on kc_club_sitzungsprotokolle (treffen_id) where treffen_id is not null;

create table if not exists kc_club_sitzungsprotokoll_anlagen (
  protokoll_id uuid not null references kc_club_sitzungsprotokolle(id) on delete cascade,
  attachment_id uuid not null references kc_communication_attachments(id) on delete cascade,
  reihenfolge int not null default 0,
  primary key (protokoll_id, attachment_id)
);

-- alte Fassungen (bei Korrektur nach Veröffentlichung)
create table if not exists kc_club_sitzungsprotokoll_fassungen (
  protokoll_id uuid not null references kc_club_sitzungsprotokolle(id) on delete cascade,
  version int not null,
  inhalt jsonb not null,
  gesichert_am timestamptz not null default now(),
  primary key (protokoll_id, version)
);

create table if not exists kc_club_sitzungsprotokoll_gelesen (
  protokoll_id uuid not null references kc_club_sitzungsprotokolle(id) on delete cascade,
  person_id text not null references kc_core_people(person_id),
  version int not null,
  gelesen_am timestamptz not null default now(),
  primary key (protokoll_id, person_id)
);

create table if not exists kc_club_sitzungsprotokoll_einwaende (
  id uuid primary key default gen_random_uuid(),
  protokoll_id uuid not null references kc_club_sitzungsprotokolle(id) on delete cascade,
  person_id text not null references kc_core_people(person_id),
  text text not null,
  erstellt_am timestamptz not null default now(),
  erledigt_am timestamptz,
  erledigt_von text
);

create table if not exists kc_club_aufgaben (
  id uuid primary key default gen_random_uuid(),
  protokoll_id uuid references kc_club_sitzungsprotokolle(id) on delete cascade,
  person_id text not null references kc_core_people(person_id),
  text text not null,
  faellig date,
  erstellt_von text not null,
  erstellt_am timestamptz not null default now(),
  erledigt_am timestamptz,
  erinnert_am timestamptz
);
create index if not exists kc_club_aufgaben_person on kc_club_aufgaben (person_id) where erledigt_am is null;

alter table kc_club_sitzungsprotokolle enable row level security;
alter table kc_club_sitzungsprotokoll_anlagen enable row level security;
alter table kc_club_sitzungsprotokoll_fassungen enable row level security;
alter table kc_club_sitzungsprotokoll_gelesen enable row level security;
alter table kc_club_sitzungsprotokoll_einwaende enable row level security;
alter table kc_club_aufgaben enable row level security;

-- Benachrichtigungen laufen im Bereich „termine“ (Treffen, Protokolle & Aufgaben)
insert into kc_communication_event_rules (source_program, event_key, display_name, channels, channel_mode, template_id, quiet_hours_mode, recipient_rule)
select v.a, v.b, v.c, v.d, v.e, 'kc_club_v1', 'ignore', '{"type":"event"}'::jsonb from (values
  ('kc-club','club_protokoll','Club-App – Protokoll (Push, sonst Mail)', array['push','email'], 'fallback'),
  ('kc-club','club_protokoll_push','Club-App – Protokoll (Push, sonst Mail)', array['push','email'], 'fallback'),
  ('kc-club','club_protokoll_beide','Club-App – Protokoll (Push und Mail)', array['push','email'], 'all'),
  ('kc-club','club_protokoll_mail','Club-App – Protokoll (nur Mail)', array['email'], 'fallback'),
  ('kc-club','club_aufgabe','Club-App – Aufgabe (Push, sonst Mail)', array['push','email'], 'fallback'),
  ('kc-club','club_aufgabe_push','Club-App – Aufgabe (Push, sonst Mail)', array['push','email'], 'fallback'),
  ('kc-club','club_aufgabe_beide','Club-App – Aufgabe (Push und Mail)', array['push','email'], 'all'),
  ('kc-club','club_aufgabe_mail','Club-App – Aufgabe (nur Mail)', array['email'], 'fallback')
) v(a,b,c,d,e)
where not exists (select 1 from kc_communication_event_rules r where r.source_program = v.a and r.event_key = v.b);
