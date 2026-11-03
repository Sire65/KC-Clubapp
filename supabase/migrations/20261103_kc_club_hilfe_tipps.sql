-- KC-CLUB-HILFE-TIPPS (App/Server 2.830.0, 03.11.2026, Wunschliste #71 Hansi „Bei Unterstützung Lösungen anbieten für eine Person, Gruppe oder alle –
-- aus dem Ordner Anleitungen, ein PDF, Foto oder Bildschirmfoto – mit oder ohne Rückmeldung; mit: das Mitglied sagt, ob der Tipp geholfen hat“).
-- Die Clubleitung schickt einen Tipp (Problem, Text, Anlagen); je Empfänger eine Zeile mit gelesen/Antwort. Vorlagen zum Wiederverwenden.
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated (KC-SUPABASE-GRANTS). Gespiegelt und gesichert. Nur additiv.
-- Rückweg: drop table public.kc_club_hilfe_tipp_empfang, public.kc_club_hilfe_tipp, public.kc_club_hilfe_vorlage;
--          delete from public.kc_db_mirror_table_rules where table_name like 'kc_club_hilfe_%';
--          delete from public.kc_neon_resume_tables where table_name like 'kc_club_hilfe_%';
create table if not exists public.kc_club_hilfe_tipp (
  id uuid primary key default gen_random_uuid(),
  von text not null references public.kc_core_people(person_id),
  problem text not null check (length(problem) between 1 and 120),
  text text not null check (length(text) between 1 and 1500),
  anlagen jsonb not null default '[]'::jsonb check (jsonb_typeof(anlagen) = 'array'),
  rueckmeldung boolean not null default false,
  anfrage_id uuid references public.kc_club_unterstuetzung(id) on delete set null,
  empfaenger integer not null default 0,
  erstellt_am timestamptz not null default now()
);
create index if not exists kc_club_hilfe_tipp_zeit on public.kc_club_hilfe_tipp (erstellt_am desc);
alter table public.kc_club_hilfe_tipp enable row level security;
revoke all on public.kc_club_hilfe_tipp from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_hilfe_tipp to service_role;

create table if not exists public.kc_club_hilfe_tipp_empfang (
  tipp_id uuid not null references public.kc_club_hilfe_tipp(id) on delete cascade,
  person_id text not null references public.kc_core_people(person_id),
  gelesen_am timestamptz,
  antwort text check (antwort in ('geholfen', 'nein', 'anderes', 'erledigt', 'keine')),
  antwort_text text check (length(antwort_text) <= 500),
  geantwortet_am timestamptz,
  erinnert_am timestamptz,
  primary key (tipp_id, person_id)
);
create index if not exists kc_club_hilfe_tipp_empfang_offen on public.kc_club_hilfe_tipp_empfang (person_id) where antwort is null;
alter table public.kc_club_hilfe_tipp_empfang enable row level security;
revoke all on public.kc_club_hilfe_tipp_empfang from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_hilfe_tipp_empfang to service_role;

create table if not exists public.kc_club_hilfe_vorlage (
  id uuid primary key default gen_random_uuid(),
  problem text not null check (length(problem) between 1 and 120),
  text text not null check (length(text) between 1 and 1500),
  anlagen jsonb not null default '[]'::jsonb check (jsonb_typeof(anlagen) = 'array'),
  von text not null references public.kc_core_people(person_id),
  benutzt integer not null default 1,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);
create unique index if not exists kc_club_hilfe_vorlage_problem on public.kc_club_hilfe_vorlage (lower(problem));
alter table public.kc_club_hilfe_vorlage enable row level security;
revoke all on public.kc_club_hilfe_vorlage from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_hilfe_vorlage to service_role;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_hilfe_tipp', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-HILFE-TIPPS (2.830.0): Hilfe-Tipps der Clubleitung'),
  ('kc_club_hilfe_tipp_empfang', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-HILFE-TIPPS (2.830.0): Empfänger und Rückmeldungen'),
  ('kc_club_hilfe_vorlage', 'Club-App', 'normal', false, true, true, 'KC-CLUB-HILFE-TIPPS (2.830.0): Tipp-Vorlagen')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_hilfe_tipp'), ('kc_club_hilfe_tipp_empfang'), ('kc_club_hilfe_vorlage') on conflict (table_name) do nothing;
