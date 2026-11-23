-- KC-CLUB-MITFAHRT-GAST (Wunsch Hansi 23.11.2026): „＋ Gast mitnehmen“ – ein Mitglied nimmt in seiner Mitfahrt eine Begleitperson ohne App mit.
-- Eine Zeile je Gast: belegt einen Platz in der Fahrt (kc_club_mitfahrt), hängt am Mitglied (eingetragen_von), angezeigt als „Ruth (Gast von Karla)“.
-- Höchstens 2 Gäste je Mitglied und Fahrt (prüft der Club-Server). Fällt die Fahrt weg, gehen die Gäste mit (on delete cascade).
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated (KC-SUPABASE-GRANTS). Gespiegelt und gesichert. Nur additiv.
-- Rückweg: drop table public.kc_club_mitfahrt_gast;
--          delete from public.kc_db_mirror_table_rules where table_name = 'kc_club_mitfahrt_gast';
--          delete from public.kc_neon_resume_tables where table_name = 'kc_club_mitfahrt_gast';
create table if not exists public.kc_club_mitfahrt_gast (
  id uuid primary key default gen_random_uuid(),
  mitfahrt_id uuid not null references public.kc_club_mitfahrt(id) on delete cascade,
  eingetragen_von text not null references public.kc_core_people(person_id),
  name text not null check (length(name) between 1 and 40),
  am timestamptz not null default now()
);
create index if not exists kc_club_mitfahrt_gast_mitfahrt on public.kc_club_mitfahrt_gast (mitfahrt_id);
create index if not exists kc_club_mitfahrt_gast_person on public.kc_club_mitfahrt_gast (eingetragen_von);
alter table public.kc_club_mitfahrt_gast enable row level security;
revoke all on public.kc_club_mitfahrt_gast from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_mitfahrt_gast to service_role;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_mitfahrt_gast', 'Club-App', 'normal', false, true, true, 'KC-CLUB-MITFAHRT-GAST: Begleitpersonen ohne App in einer Mitfahrt')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_mitfahrt_gast') on conflict (table_name) do nothing;
