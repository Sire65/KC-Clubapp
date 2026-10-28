-- 2.730.0 KC-CLUB-REZEPT-WEIHNACHT (Wunschliste #45, Wunsch Hansi „vorsichtig mit Weihnachtsbäckerei anfangen: im Info-Laufband antippen,
-- Rezepte mit leckerem Foto als Kacheln, darunter Zutaten, Herstellung und Sternebewertung; Aufruf ‚Hast du auch ein leckeres Rezept? Her damit!‘“):
-- 1. Rezepte bekommen ein Thema (zuerst nur „weihnachtsbaeckerei“) – setzen darf es nur der Admin (prüft der Club-Server).
-- 2. Je Mitglied und Rezept eine Bewertung: 1–5 Sterne (freiwillig) und „Hab ich nachgebacken“. Ändern jederzeit, eine Zeile je Mitglied.
-- Nur der Club-Server (service_role) liest/schreibt – RLS an, keine Richtlinien für Nutzer (wie kc_club_rezepte).
-- Rückweg: alter table public.kc_club_rezepte drop column thema; drop table public.kc_club_rezept_bewertung;
--          delete from public.kc_db_mirror_table_rules where table_name = 'kc_club_rezept_bewertung';
--          delete from public.kc_neon_resume_tables where table_name = 'kc_club_rezept_bewertung';
alter table public.kc_club_rezepte add column if not exists thema text check (thema is null or thema in ('weihnachtsbaeckerei'));
create index if not exists kc_club_rezepte_thema on public.kc_club_rezepte (thema) where geloescht_am is null and thema is not null;

create table if not exists public.kc_club_rezept_bewertung (
  rezept_id uuid not null references public.kc_club_rezepte(id),
  person_id text not null references public.kc_core_people(person_id),
  sterne smallint check (sterne is null or sterne between 1 and 5),
  nachgebacken boolean not null default false,
  geaendert_am timestamptz not null default now(),
  primary key (rezept_id, person_id)
);
alter table public.kc_club_rezept_bewertung enable row level security;
revoke all on public.kc_club_rezept_bewertung from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_rezept_bewertung to service_role;
comment on table public.kc_club_rezept_bewertung is 'KC-CLUB-REZEPT-WEIHNACHT: Sterne (1–5) und „nachgebacken“ je Mitglied und Rezept – nur Club-Server.';

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_rezept_bewertung', 'Club-App', 'normal', false, true, true, 'KC-CLUB-REZEPT-WEIHNACHT (2.730.0): Sterne und „nachgebacken“ je Rezept')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_rezept_bewertung') on conflict (table_name) do nothing;
