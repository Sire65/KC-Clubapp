-- KC-CLUB-GEMEINSCHAFTSGERICHT (Wunschliste #94, Antworten Hansi 15.11.2026): „Viele Köche verderben den Brei – bei uns nicht.“
-- Hansi startet eine Runde ohne festen Termin (z. B. „im Februar“) mit Einsendezeitraum und 1 oder 2 Zutaten je Person. Alle (Mitglieder und
-- Aushilfen) werden beim App-Start gefragt, welche Zutat, welches Gewürz oder Kraut sie beisteuern. Mitglieder sehen nur ihre eigene Zutat,
-- Hansi (Admin) sieht alle laufend. Danach wird ein Rezept gewählt oder erstellt und als PDF auf dem Kopfbogen an alle geschickt
-- (Zutaten mit „(Name)“, wer sie gewählt hat).
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated (KC-SUPABASE-GRANTS). Gespiegelt und gesichert. Nur additiv.
-- Rückweg: drop table public.kc_club_gericht_zutat; drop table public.kc_club_gericht_runde;
--          delete from public.kc_db_mirror_table_rules where table_name in ('kc_club_gericht_runde', 'kc_club_gericht_zutat');
--          delete from public.kc_neon_resume_tables where table_name in ('kc_club_gericht_runde', 'kc_club_gericht_zutat');
create table if not exists public.kc_club_gericht_runde (
  id uuid primary key default gen_random_uuid(),
  titel text not null check (char_length(titel) between 2 and 80),
  von date not null,
  bis date not null,
  je_person smallint not null default 1 check (je_person between 1 and 2),
  status text not null default 'sammeln' check (status in ('sammeln', 'versendet', 'abgebrochen')),
  rezept_id uuid references public.kc_club_rezepte(id),
  pdf text,                                   -- Anhang (kc_communication_attachments) des versendeten Rezepts
  erstellt_von text references public.kc_core_people(person_id),
  erstellt_am timestamptz not null default now(),
  erinnert_am timestamptz,                    -- Erinnerung 2 Tage vor Ende (genau einmal)
  versendet_am timestamptz,
  check (bis >= von and bis - von <= 120)
);
create index if not exists kc_club_gericht_runde_status on public.kc_club_gericht_runde (status, bis);
create table if not exists public.kc_club_gericht_zutat (
  id uuid primary key default gen_random_uuid(),
  runde_id uuid not null references public.kc_club_gericht_runde(id) on delete cascade,
  person_id text not null references public.kc_core_people(person_id),
  nr smallint not null check (nr between 1 and 2),
  zutat text not null check (char_length(zutat) between 1 and 60),
  gruppe text check (char_length(coalesce(gruppe, '')) <= 40),
  eigen boolean not null default false,       -- frei eingegeben (nicht aus der Liste) → Hansi gibt frei
  freigabe text not null default 'frei' check (freigabe in ('frei', 'pruefen', 'abgelehnt')),
  grund text check (char_length(coalesce(grund, '')) <= 200),
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  unique (runde_id, person_id, nr)
);
create index if not exists kc_club_gericht_zutat_runde on public.kc_club_gericht_zutat (runde_id);
alter table public.kc_club_gericht_runde enable row level security;
alter table public.kc_club_gericht_zutat enable row level security;
revoke all on public.kc_club_gericht_runde from public, anon, authenticated;
revoke all on public.kc_club_gericht_zutat from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_gericht_runde to service_role;
grant select, insert, update, delete on public.kc_club_gericht_zutat to service_role;
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_gericht_runde', 'Club-App', 'normal', false, true, true, 'KC-CLUB-GEMEINSCHAFTSGERICHT: Runden (Titel, Einsendezeitraum, Rezept)'),
       ('kc_club_gericht_zutat', 'Club-App', 'normal', false, true, true, 'KC-CLUB-GEMEINSCHAFTSGERICHT: eingereichte Zutaten je Person')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_gericht_runde'), ('kc_club_gericht_zutat') on conflict (table_name) do nothing;
