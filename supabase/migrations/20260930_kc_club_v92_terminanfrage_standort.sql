-- KC Club-App – Version 0.92.0
-- KC-CLUB-TERMINANFRAGE: Jedes Mitglied fragt einzelne Mitglieder, mehrere oder eine Gruppe persönlich an –
--   Anlass, Datum/Uhrzeit, Ort, Notiz; Empfänger antworten ja / vielleicht / nein (änderbar, mit kurzer Notiz).
--   Eigene Tabellen statt kc_club_treffen: Treffen sind für ALLE sichtbar (Liste, Kalender-Abo, „Demnächst“) –
--   eine private Anfrage darf dort nie auftauchen. Sichtbar nur für Absender und Empfänger (Prüfung im Server).
-- KC-CLUB-STANDORT: Standort live teilen (15 Min, 1 Std, bis ich beende – höchstens 8 Std) an gewählte Mitglieder.
--   „Einmal senden“ braucht keine Tabelle (geht als normale Nachricht mit Kartenlink).
--   Zeilen werden nach Ablauf von der Wartung gelöscht; Koordinaten nie länger als nötig gespeichert.
-- Zugriff nur über die Edge Function kc-club (RLS an, keine Policies) – wie alle kc_club_*-Tabellen.
-- Rückweg: drop table kc_club_standort_live; drop table kc_club_terminanfrage_empfaenger; drop table kc_club_terminanfragen;

create table if not exists kc_club_terminanfragen (
  id uuid primary key default gen_random_uuid(),
  erstellt_von text not null references kc_core_people(person_id),
  anlass text not null,
  beginn timestamptz not null,
  ende timestamptz,
  ort text,
  notiz text,
  frist timestamptz,
  status text not null default 'offen' check (status in ('offen','abgesagt')),
  erinnerung_gesendet_am timestamptz,
  nachfass_gesendet_am timestamptz,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);
create index if not exists kc_club_terminanfragen_beginn on kc_club_terminanfragen (beginn);
create index if not exists kc_club_terminanfragen_von on kc_club_terminanfragen (erstellt_von);

create table if not exists kc_club_terminanfrage_empfaenger (
  anfrage_id uuid not null references kc_club_terminanfragen(id) on delete cascade,
  person_id text not null references kc_core_people(person_id),
  antwort text check (antwort in ('ja','vielleicht','nein')),
  notiz text,
  geantwortet_am timestamptz,
  primary key (anfrage_id, person_id)
);
create index if not exists kc_club_terminanfrage_empfaenger_person on kc_club_terminanfrage_empfaenger (person_id);

create table if not exists kc_club_standort_live (
  id uuid primary key default gen_random_uuid(),
  person_id text not null references kc_core_people(person_id),
  empfaenger text[] not null,
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  genauigkeit real,
  aktualisiert_am timestamptz not null default now(),
  bis timestamptz not null,
  beendet_am timestamptz,
  erstellt_am timestamptz not null default now()
);
create index if not exists kc_club_standort_live_bis on kc_club_standort_live (bis);
create index if not exists kc_club_standort_live_empf on kc_club_standort_live using gin (empfaenger);

alter table kc_club_terminanfragen enable row level security;
alter table kc_club_terminanfrage_empfaenger enable row level security;
alter table kc_club_standort_live enable row level security;
