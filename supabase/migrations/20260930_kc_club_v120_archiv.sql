-- KC Club-App – Version 1.2.0
-- KC-CLUB-ARCHIV: Vereinsunterlagen als Aktenordner mit Registern und Jahreszahl (Wunsch Hansi 30.09.2026).
--   Ordner: Art (Auswahl) + Jahr + Titel + Farbe + Register (Reiter), sichtbar für alle Mitglieder oder „nur Vorstand“
--   (Clubsprecher, Kassenwart, Admin). Anlegen, Hochladen, Ändern, Löschen: Clubsprecher und Admin (Prüfung im Server).
--   Dokumente: Datei im vorhandenen Anlagen-Kern (kc_communication_attachments + Bucket), hier nur die Einordnung.
--   Löschen = Papierkorb (30 Tage, dann entfernt die Wartung Datei und Zeile endgültig).
--   Der automatische Teil (vergangene Treffen, Protokolle, Abstimmungen, Aktionen …) braucht keine Tabelle –
--   er wird beim Öffnen aus den vorhandenen Daten gelesen (nichts doppelt gespeichert).
-- Zugriff nur über die Edge Function kc-club (RLS an, keine Policies) – wie alle kc_club_*-Tabellen.
-- Rückweg: drop table kc_club_archiv_dokumente; drop table kc_club_archiv_ordner;

create table if not exists kc_club_archiv_ordner (
  id uuid primary key default gen_random_uuid(),
  art text not null check (art in ('satzung','versammlung','vertraege','finanzen','presse','chronik','sonstiges')),
  jahr smallint not null check (jahr between 1950 and 2100),
  titel text not null,
  farbe smallint not null default 1 check (farbe between 1 and 8),
  register text[] not null default '{}',
  nur_vorstand boolean not null default false,
  erstellt_von text not null references kc_core_people(person_id),
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  geloescht_am timestamptz,
  geloescht_von text references kc_core_people(person_id)
);
create index if not exists kc_club_archiv_ordner_jahr on kc_club_archiv_ordner (jahr desc);

create table if not exists kc_club_archiv_dokumente (
  id uuid primary key default gen_random_uuid(),
  ordner_id uuid not null references kc_club_archiv_ordner(id) on delete cascade,
  register text,
  titel text not null,
  datum date,
  stichworte text[] not null default '{}',
  attachment_id uuid not null references kc_communication_attachments(id),
  datei_name text,
  mime text,
  groesse bigint,
  hochgeladen_von text not null references kc_core_people(person_id),
  hochgeladen_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  geloescht_am timestamptz,
  geloescht_von text references kc_core_people(person_id)
);
create index if not exists kc_club_archiv_dokumente_ordner on kc_club_archiv_dokumente (ordner_id);
create index if not exists kc_club_archiv_dokumente_att on kc_club_archiv_dokumente (attachment_id);

alter table kc_club_archiv_ordner enable row level security;
alter table kc_club_archiv_dokumente enable row level security;
