-- KC Club-App – Version 2.23.77
-- KC-CLUB-PERSON-SPERRE (Wunsch Hansi): Der Admin kann eine oder mehrere Personen vorübergehend sperren. Gesperrte sehen beim Öffnen
--   ein Fenster: 🔵 „Wartungsarbeiten“ (art 'wartung') oder ⚪ „Server zurzeit nicht erreichbar“ (art 'stoerung').
--   stumm = true: zusätzlich keine Benachrichtigungen (Push, E-Mail) aus der Club-App an diese Person.
--   Admins können nicht gesperrt werden. Nichts wird gelöscht: Aufheben = aktiv false (+ Zeitpunkt), jede Änderung im Protokoll.
--   Zugriff nur über den Server (kc-club), RLS an, keine Policies.
-- Rückweg: drop table kc_club_person_sperre; (Spiegel-/Resume-Regel löschen)
create table if not exists kc_club_person_sperre (
  person_id text primary key references kc_core_people(person_id),
  aktiv boolean not null default true,
  art text not null default 'wartung' check (art in ('wartung', 'stoerung')),
  stumm boolean not null default false,
  seit timestamptz not null default now(),
  von text references kc_core_people(person_id),
  aufgehoben_am timestamptz
);
create index if not exists kc_club_person_sperre_aktiv on kc_club_person_sperre (aktiv) where aktiv;
alter table kc_club_person_sperre enable row level security;
revoke all on kc_club_person_sperre from anon, authenticated;
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_person_sperre', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-PERSON-SPERRE (2.23.77): vorübergehend gesperrte Personen')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_person_sperre') on conflict (table_name) do nothing;
