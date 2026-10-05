-- KC Club-App – Version 2.23.86
-- KC-CLUB-FREIGABE (Wunsch Hansi): neue Funktionen erst „nur Admin (Test)“, dann mit einem Tipp „für alle“ freigeben.
--   Welche Funktionen es gibt und ihr Standard steht im Server (FUNKTIONEN); hier nur die Entscheidung des Admins.
--   Zugriff nur über den Server (kc-club), RLS an, keine Policies. Jede Änderung im Protokoll.
-- Rückweg: drop table kc_club_funktion_freigabe;  (dann gelten wieder die Standards aus dem Server)
create table if not exists kc_club_funktion_freigabe (
  funktion text primary key check (funktion ~ '^[a-z_]{2,40}$'),
  fuer text not null check (fuer in ('alle', 'admin')),
  geaendert_am timestamptz not null default now(),
  von text references kc_core_people(person_id)
);
alter table kc_club_funktion_freigabe enable row level security;
revoke all on kc_club_funktion_freigabe from anon, authenticated;
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_funktion_freigabe', 'Club-App', 'normal', false, true, true, 'KC-CLUB-FREIGABE (2.23.86): Freigabe neuer Funktionen')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_funktion_freigabe') on conflict (table_name) do nothing;
