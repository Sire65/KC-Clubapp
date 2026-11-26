-- KICC-F-114 / KC-CLUB-FAHRTKOSTEN-SAMMEL (Hansi 25./26.11.2026): Fahrtprofil je Mitglied und Sammel-Abrechnung je Veranstaltung.
-- Entscheidungen: Fahrt zum Budendienst wird erstattet · Abrechnung einmal nach der Veranstaltung · Kassenwart gibt alle auf einmal frei ·
-- jeder entscheidet selbst (keine Mindestentfernung) · Clubleitung sieht eine Liste · gilt für alle Veranstaltungen.
-- Konzept: KC-Infrastructure-Control-Center docs/KONZEPT-CLUB-FAHRTKOSTEN-SAMMEL.md
-- 1. kc_club_fahrtprofil: „🚶 keine Fahrtkosten“ (Vorgabe, auch ohne Zeile) oder „🚗 eigenes Auto, km hin und zurück“ – nur km, keine Adresse.
-- 2. kc_club_fahrt_erinnerung: einmalige Erinnerung „Abrechnung bereit“ je Person und Veranstaltung (nie doppelt).
-- 3. kc_club_erstattung.sammel: Veranstaltung der Sammel-Abrechnung (null = normaler Antrag).
-- Nur Club-Server (service_role). Rein additiv. Rückweg: drop table public.kc_club_fahrt_erinnerung; drop table public.kc_club_fahrtprofil;
--   drop index public.kc_club_erstattung_sammel_einmal;
--   alter table public.kc_club_erstattung drop column sammel;

create table if not exists public.kc_club_fahrtprofil (
  person_id text primary key check (char_length(person_id) between 1 and 80),
  art text not null default 'keine' check (art in ('keine', 'auto')),
  km numeric(5,1) check (km is null or (km > 0 and km <= 500)),
  geaendert_am timestamptz not null default now(),
  check (art = 'keine' or km is not null)
);
alter table public.kc_club_fahrtprofil enable row level security;
revoke all on public.kc_club_fahrtprofil from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_fahrtprofil to service_role;
comment on table public.kc_club_fahrtprofil is 'KICC-F-114: Fahrtprofil je Mitglied (keine Fahrtkosten | eigenes Auto mit km hin+zurück). Nur kc-club (service_role).';

create table if not exists public.kc_club_fahrt_erinnerung (
  person_id text not null,
  event_id text not null,
  erinnert_am timestamptz not null default now(),
  primary key (person_id, event_id)
);
alter table public.kc_club_fahrt_erinnerung enable row level security;
revoke all on public.kc_club_fahrt_erinnerung from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_fahrt_erinnerung to service_role;

alter table public.kc_club_erstattung add column if not exists sammel text check (sammel is null or char_length(sammel) between 1 and 80);
create index if not exists kc_club_erstattung_sammel on public.kc_club_erstattung (sammel, status) where sammel is not null;
-- je Person und Veranstaltung höchstens eine laufende Sammel-Abrechnung (doppeltes Tippen → zweiter Antrag wird abgewiesen; nach Ablehnung neu möglich)
create unique index if not exists kc_club_erstattung_sammel_einmal on public.kc_club_erstattung (person_id, sammel) where sammel is not null and status <> 'abgelehnt';

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_fahrtprofil', 'Club-App', 'sensitive', false, true, true, 'KICC-F-114: Fahrtprofil je Mitglied (nur km, keine Adresse)')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_fahrtprofil') on conflict (table_name) do nothing;
