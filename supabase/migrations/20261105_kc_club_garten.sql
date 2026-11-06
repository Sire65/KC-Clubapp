-- KC-CLUB-SAMEN „Mein Garten“ (Wunschliste #84, Konzept docs/KONZEPT_SAMEN_GARTEN.md, Antworten Hansi 05.11.2026):
-- EINE Zeile je Mitglied (Wunsch Hansi „sparsam mit Datenbank-Abfragen und Traffic“): Tage dabei, geöffnete Samentütchen, besondere Taten,
-- Pflanzen (jsonb, je Pflanze Art und Zeitpunkte – das Wachstum rechnet die App), Automatik, Club-Garten-Freigabe.
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated (KC-SUPABASE-GRANTS). Gespiegelt und gesichert. Nur additiv.
-- Rückweg: drop table public.kc_club_garten; delete from public.kc_db_mirror_table_rules where table_name = 'kc_club_garten';
--          delete from public.kc_neon_resume_tables where table_name = 'kc_club_garten';
create table if not exists public.kc_club_garten (
  person_id text primary key references public.kc_core_people(person_id),
  tage integer not null default 0 check (tage >= 0),
  letzter_tag date,
  geoeffnet integer not null default 0 check (geoeffnet >= 0),
  taten text[] not null default '{}',
  pflanzen jsonb not null default '[]'::jsonb check (jsonb_typeof(pflanzen) = 'array' and jsonb_array_length(pflanzen) <= 24),
  automatik boolean not null default false,
  club boolean not null default false,
  club_gefragt boolean not null default false,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);
create index if not exists kc_club_garten_club on public.kc_club_garten (club) where club;
alter table public.kc_club_garten enable row level security;
revoke all on public.kc_club_garten from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_garten to service_role;
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_garten', 'Club-App', 'normal', false, true, true, 'KC-CLUB-SAMEN: Mein Garten (Tage dabei, Pflanzen, Club-Garten-Freigabe)')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_garten') on conflict (table_name) do nothing;
