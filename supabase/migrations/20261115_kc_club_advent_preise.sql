-- KC-CLUB-ADVENT-PREISE (Wunschliste #89, Antworten Hansi 15.11.2026): kleine Preise im Adventskalender.
-- 6.12. Mini-Schoko-Nikolaus, 20.12. Kinderriegel (je einer pro Person). Wer das Türchen öffnet, tippt „🎁 Ja, den nehme ich“ –
-- dann steht er in Hansis Liste „Wer bekommt was“ (zum Austeilen beim Weihnachtsessen im Januar).
-- EINE Zeile je Person, Jahr und Tag (doppelt melden geht nicht). Nur der Club-Server (service_role); RLS an, keine Rechte für
-- anon/authenticated (KC-SUPABASE-GRANTS). Gespiegelt und gesichert. Nur additiv.
-- Rückweg: drop table public.kc_club_advent_preise; delete from public.kc_db_mirror_table_rules where table_name = 'kc_club_advent_preise';
--          delete from public.kc_neon_resume_tables where table_name = 'kc_club_advent_preise';
create table if not exists public.kc_club_advent_preise (
  person_id text not null references public.kc_core_people(person_id),
  jahr integer not null check (jahr between 2026 and 2100),
  tag integer not null check (tag between 1 and 24),
  preis text not null check (length(preis) between 1 and 40),
  gemeldet_am timestamptz not null default now(),
  primary key (person_id, jahr, tag)
);
create index if not exists kc_club_advent_preise_jahr on public.kc_club_advent_preise (jahr, tag);
alter table public.kc_club_advent_preise enable row level security;
revoke all on public.kc_club_advent_preise from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_advent_preise to service_role;
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_advent_preise', 'Club-App', 'normal', false, true, true, 'KC-CLUB-ADVENT-PREISE: Adventskalender – wer bekommt welchen Preis (Schoko-Nikolaus, Kinderriegel)')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_advent_preise') on conflict (table_name) do nothing;
