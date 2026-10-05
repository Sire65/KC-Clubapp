-- KC Club-App – Version 2.23.83
-- KC-CLUB-REZEPTBUCH (Wunsch Hansi): gemeinsames Club-Rezeptbuch – Titel, Kategorie, Portionen, Zutaten (Menge/Einheit/Name), Zubereitung,
--   Dauer, ein Foto (eigene hochgeladene Anlage), Stichworte. Alle Mitglieder sehen alle Rezepte; ändern/löschen nur, wer es eingestellt hat
--   (und der Admin). Nichts wird gelöscht: Löschen = geloescht_am. Zugriff nur über den Server (kc-club), RLS an, keine Policies.
-- Rückweg: drop table kc_club_rezepte; (Spiegel-/Resume-Regel löschen)
create table if not exists kc_club_rezepte (
  id uuid primary key default gen_random_uuid(),
  von text not null references kc_core_people(person_id),
  titel text not null check (char_length(titel) between 2 and 100),
  kategorie text not null default 'hauptgericht' check (kategorie in ('vorspeise', 'suppe', 'hauptgericht', 'beilage', 'dessert', 'gebaeck', 'getraenk', 'sonstiges')),
  portionen integer not null default 4 check (portionen between 1 and 500),
  zutaten jsonb not null default '[]'::jsonb check (jsonb_typeof(zutaten) = 'array'),
  zubereitung text check (zubereitung is null or char_length(zubereitung) <= 6000),
  dauer integer check (dauer is null or dauer between 1 and 2880),
  foto text,
  stichworte text check (stichworte is null or char_length(stichworte) <= 200),
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  geloescht_am timestamptz,
  geloescht_von text references kc_core_people(person_id)
);
create index if not exists kc_club_rezepte_aktiv on kc_club_rezepte (kategorie, titel) where geloescht_am is null;
alter table kc_club_rezepte enable row level security;
revoke all on kc_club_rezepte from anon, authenticated;
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_rezepte', 'Club-App', 'normal', false, true, true, 'KC-CLUB-REZEPTBUCH (2.23.83): Club-Rezepte')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_rezepte') on conflict (table_name) do nothing;
