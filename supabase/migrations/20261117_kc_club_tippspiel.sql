-- KC-CLUB-TIPPSPIEL (Wunschliste #96, Antworten Hansi 17.11.2026: „Bundesliga, Mitglieder und Aushilfen, alle Spiele und Vereine“): Bundesliga-Tippspiel.
-- Spiele + Ergebnisse holt der Club-Server kostenlos von OpenLigaDB (Adapter, austauschbar); Tipps je Person und Spiel; Teilnahme freiwillig.
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated (KC-SUPABASE-GRANTS). Gespiegelt und gesichert. Nur additiv.
-- Rückweg: drop table public.kc_club_tipp; drop table public.kc_club_tipp_spiele; drop table public.kc_club_tipp_teilnehmer;
--          delete from public.kc_db_mirror_table_rules where table_name in ('kc_club_tipp','kc_club_tipp_spiele','kc_club_tipp_teilnehmer');
--          delete from public.kc_neon_resume_tables where table_name in ('kc_club_tipp','kc_club_tipp_spiele','kc_club_tipp_teilnehmer');
create table if not exists public.kc_club_tipp_spiele (
  spiel_id integer primary key,
  liga text not null default 'bl1' check (liga ~ '^[a-z0-9]{2,10}$'),
  saison integer not null check (saison between 2020 and 2100),
  spieltag integer not null check (spieltag between 1 and 60),
  anpfiff timestamptz not null,
  heim text not null, gast text not null, heim_kurz text, gast_kurz text, heim_bild text, gast_bild text,
  tore_heim integer check (tore_heim between 0 and 50), tore_gast integer check (tore_gast between 0 and 50),
  fertig boolean not null default false,
  aktualisiert_am timestamptz not null default now()
);
create index if not exists kc_club_tipp_spiele_tag on public.kc_club_tipp_spiele (liga, saison, spieltag);
create index if not exists kc_club_tipp_spiele_anpfiff on public.kc_club_tipp_spiele (anpfiff);
create table if not exists public.kc_club_tipp_teilnehmer (
  person_id text primary key references public.kc_core_people(person_id),
  dabei boolean not null default true,
  seit timestamptz not null default now()
);
create table if not exists public.kc_club_tipp (
  person_id text not null references public.kc_core_people(person_id),
  spiel_id integer not null references public.kc_club_tipp_spiele(spiel_id) on delete cascade,
  heim integer not null check (heim between 0 and 20), gast integer not null check (gast between 0 and 20),
  am timestamptz not null default now(),
  primary key (person_id, spiel_id)
);
create index if not exists kc_club_tipp_spiel on public.kc_club_tipp (spiel_id);
alter table public.kc_club_tipp_spiele enable row level security;
alter table public.kc_club_tipp_teilnehmer enable row level security;
alter table public.kc_club_tipp enable row level security;
revoke all on public.kc_club_tipp_spiele from public, anon, authenticated;
revoke all on public.kc_club_tipp_teilnehmer from public, anon, authenticated;
revoke all on public.kc_club_tipp from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_tipp_spiele to service_role;
grant select, insert, update, delete on public.kc_club_tipp_teilnehmer to service_role;
grant select, insert, update, delete on public.kc_club_tipp to service_role;
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_tipp_spiele', 'Club-App', 'normal', false, true, true, 'KC-CLUB-TIPPSPIEL: Bundesliga-Spiele und Ergebnisse (von OpenLigaDB)'),
  ('kc_club_tipp_teilnehmer', 'Club-App', 'normal', false, true, true, 'KC-CLUB-TIPPSPIEL: wer mittippt'),
  ('kc_club_tipp', 'Club-App', 'normal', false, true, true, 'KC-CLUB-TIPPSPIEL: Tipps je Person und Spiel')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_tipp_spiele'), ('kc_club_tipp_teilnehmer'), ('kc_club_tipp') on conflict (table_name) do nothing;
