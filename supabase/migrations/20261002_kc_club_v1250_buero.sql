-- KC Club-App – Version 1.25.0 (Wunsch Hansi 02.10.2026, Freigabe „1 ganze Clubleitung, 2 passt, 3 so bauen“)
-- KC-CLUB-BUERO: Büro für die Clubleitung (Clubsprecher, Kassenwart, Admin). Vorbereitung einer Sitzung je Treffen:
-- Anwesenheits-Häkchen, Anmerkung zum letzten Protokoll, Tagesordnung (feste Punkte + Vorschläge, Reihenfolge),
-- Schreiblinien je Punkt; dazu, wann Einladung/Erinnerung verschickt wurden. Daraus entsteht der Protokoll-Entwurf.
-- Zugriff nur über den Server (kc-club), RLS an, keine Policies. Spiegel/Sicherung wie die übrigen Club-Tabellen.
-- Rückweg: drop table kc_club_buero_sitzung; (Spiegel-Regel löschen) – Protokoll-Entwürfe bleiben unberührt.

create table if not exists kc_club_buero_sitzung (
  treffen_id uuid primary key references kc_club_treffen(id) on delete cascade,
  anwesend text[] not null default '{}',
  anmerkung text check (anmerkung is null or char_length(anmerkung) <= 1000),
  -- [{t: Text, art: 'fest'|'vorschlag'|'eigen', id?: vorschlag_id}]
  tagesordnung jsonb not null default '[]' check (jsonb_typeof(tagesordnung) = 'array' and jsonb_array_length(tagesordnung) <= 40),
  zeilen smallint not null default 5 check (zeilen between 0 and 20),
  einladung_am timestamptz,
  erinnerung_am timestamptz,
  geaendert_von text references kc_core_people(person_id),
  geaendert_am timestamptz not null default now()
);
alter table kc_club_buero_sitzung enable row level security;
revoke all on kc_club_buero_sitzung from anon, authenticated;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_buero_sitzung', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-BUERO (1.25.0): Sitzungsvorbereitung der Clubleitung')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_buero_sitzung') on conflict (table_name) do nothing;
