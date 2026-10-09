-- KC Club-App – Version 2.150.0 (Wunsch Hansi 09.10.2026)
-- KC-CLUB-SCHILDER  Schilder-Druckerei im Büro: Hinweisschilder, Preislisten, Öffnungszeiten … gestalten, drucken, senden, ablegen.
--   kc_club_schilder: gespeicherte Schilder zum Wiederverwenden (z. B. nächstes Jahr wieder) – nur die Gestaltung als kurze Daten
--   (Titel, Text, Preiszeilen, Kennungen für Schrift/Rahmen/Farbe/Symbol). Das fertige PDF liegt wie gewohnt im Büro-Ordner.
--   Nur neue Tabelle, keine bestehenden Daten werden geändert. Zugriff nur über den Server (kc-club, nur Clubleitung), RLS an, keine Policies.
--   Löschen ist weich (entfernt_am) – Recovery: entfernt_am wieder auf null setzen.
-- Rückweg: drop table kc_club_schilder; Spiegel-Regel löschen.
create table if not exists kc_club_schilder (
  id uuid primary key default gen_random_uuid(),
  org_id text not null default 'KC_WERNE',
  titel text not null check (char_length(titel) between 1 and 80),
  anlass text not null default 'allgemein' check (anlass ~ '^[a-z0-9_-]{1,30}$'),
  daten jsonb not null check (jsonb_typeof(daten) = 'object' and pg_column_size(daten) < 20000),
  erstellt_von text not null references kc_core_people(person_id),
  erstellt_am timestamptz not null default now(),
  geaendert_von text references kc_core_people(person_id),
  geaendert_am timestamptz not null default now(),
  entfernt_am timestamptz
);
create index if not exists kc_club_schilder_anlass_idx on kc_club_schilder (anlass, titel) where entfernt_am is null;
alter table kc_club_schilder enable row level security;
revoke all on kc_club_schilder from anon, authenticated;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_schilder', 'Club-App', 'normal', false, true, true, 'KC-CLUB-SCHILDER (2.150.0): gespeicherte Schilder (Gestaltung, keine personenbezogenen Daten)')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_schilder')
on conflict (table_name) do nothing;
