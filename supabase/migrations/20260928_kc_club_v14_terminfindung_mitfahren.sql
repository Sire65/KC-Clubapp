-- KC Club-App – Version 0.14.0
-- KC-CLUB-TERMINFINDUNG: „Welcher Tag passt?“ – mehrere Terminvorschläge, jede/r kreuzt ja / vielleicht / nein an;
--   Organisation legt danach den Termin fest (→ normales Treffen mit Einladung).
-- KC-CLUB-NACHFASSEN: einmalige Erinnerung 3 Tage vor dem Treffen an alle ohne Zu-/Absage.
-- KC-CLUB-MITFAHREN: Mitfahrgelegenheiten zu Treffen/Veranstaltungen und Aktionen (Aktionen-ID aus dem KC Manager).
-- KC-CLUB-NOTFALL: Notfallkontakt je Mitglied (sichtbar: man selbst und die Organisation).
-- KC-CLUB-KALENDERABO: persönlicher Kalender-Link (nur Hash gespeichert) für den Handy-Kalender.

create table if not exists kc_club_terminumfragen (
  id uuid primary key default gen_random_uuid(),
  titel text not null,
  beschreibung text,
  ort text,
  art text not null default 'treffen' check (art in ('treffen','veranstaltung')),
  status text not null default 'offen' check (status in ('offen','festgelegt','beendet')),
  frist timestamptz,
  festgelegt_option uuid,
  festgelegt_treffen_id uuid references kc_club_treffen(id) on delete set null,
  erstellt_von text not null references kc_core_people(person_id),
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);
create table if not exists kc_club_terminumfrage_optionen (
  id uuid primary key default gen_random_uuid(),
  umfrage_id uuid not null references kc_club_terminumfragen(id) on delete cascade,
  beginn timestamptz not null,
  reihenfolge int not null default 0
);
create table if not exists kc_club_terminumfrage_antworten (
  option_id uuid not null references kc_club_terminumfrage_optionen(id) on delete cascade,
  person_id text not null references kc_core_people(person_id),
  antwort text not null check (antwort in ('ja','vielleicht','nein')),
  geaendert_am timestamptz not null default now(),
  primary key (option_id, person_id)
);

alter table kc_club_treffen add column if not exists nachfass_gesendet_am timestamptz;

create table if not exists kc_club_mitfahrt (
  id uuid primary key default gen_random_uuid(),
  bezug_art text not null check (bezug_art in ('treffen','aktion')),
  bezug_id text not null,
  fahrer text not null references kc_core_people(person_id),
  plaetze int not null check (plaetze between 1 and 8),
  treffpunkt text,
  notiz text,
  erstellt_am timestamptz not null default now()
);
create index if not exists kc_club_mitfahrt_bezug on kc_club_mitfahrt (bezug_art, bezug_id);
create table if not exists kc_club_mitfahrt_platz (
  mitfahrt_id uuid not null references kc_club_mitfahrt(id) on delete cascade,
  person_id text not null references kc_core_people(person_id),
  erstellt_am timestamptz not null default now(),
  primary key (mitfahrt_id, person_id)
);

create table if not exists kc_club_notfall (
  person_id text primary key references kc_core_people(person_id),
  name text,
  telefon text,
  beziehung text,
  geaendert_am timestamptz not null default now()
);

create table if not exists kc_club_kalender_abo (
  person_id text primary key references kc_core_people(person_id),
  token_hash text not null unique,
  erstellt_am timestamptz not null default now(),
  zuletzt_abgerufen timestamptz
);

alter table kc_club_terminumfragen enable row level security;
alter table kc_club_terminumfrage_optionen enable row level security;
alter table kc_club_terminumfrage_antworten enable row level security;
alter table kc_club_mitfahrt enable row level security;
alter table kc_club_mitfahrt_platz enable row level security;
alter table kc_club_notfall enable row level security;
alter table kc_club_kalender_abo enable row level security;
