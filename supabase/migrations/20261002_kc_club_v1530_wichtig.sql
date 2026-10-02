-- KC Club-App – Version 1.53.0 (Wunsch Hansi 02.10.2026)
-- KC-CLUB-WICHTIG  Nachricht mit „Wichtigkeit hoch“ (❗ beim Senden). Die Nachricht wird im Chat farbig umrandet und
--                  mit „❗ Wichtig“ markiert; Push/Mail tragen ❗ im Titel; in der Chat-Liste fällt der Chat auf.
-- Hängt wie Kontakt/Abstimmung an kc_communication_messages (on delete cascade); die Kern-Tabelle bleibt unverändert.
-- Zugriff nur über den Server (kc-club), RLS an, keine Policies. Spiegel/Sicherung wie die übrigen Club-Tabellen.
-- Rückweg: drop table kc_club_nachricht_wichtig; Spiegel-Regel löschen.
create table if not exists kc_club_nachricht_wichtig (
  message_id uuid primary key references kc_communication_messages(id) on delete cascade,
  person_id text not null references kc_core_people(person_id),
  am timestamptz not null default now()
);
alter table kc_club_nachricht_wichtig enable row level security;
revoke all on kc_club_nachricht_wichtig from anon, authenticated;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_nachricht_wichtig', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-WICHTIG (1.53.0): nur Kennzeichen, kein Text')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_nachricht_wichtig')
on conflict (table_name) do nothing;
