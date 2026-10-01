-- KC Club-App – Version 1.9.0
-- KC-CLUB-BEARBEITEN (Wunsch Hansi 01.10.2026, wie WhatsApp): eigene Nachricht bis 15 Minuten nach dem Senden ändern.
-- Der neue Text steht in kc_communication_messages.body (gemeinsame Kern-Tabelle bleibt unverändert, keine neue Spalte);
-- das Kennzeichen „bearbeitet“ liegt hier in einer eigenen Club-Tabelle. Alter Text wird nicht aufbewahrt (wie WhatsApp).
-- Zugriff nur über den Server (kc-club), RLS an, keine Policies.
-- Rückweg: drop table kc_club_nachricht_bearbeitet; (Spiegel-Regel löschen)

create table if not exists kc_club_nachricht_bearbeitet (
  message_id uuid primary key references kc_communication_messages(id) on delete cascade,
  bearbeitet_am timestamptz not null default now()
);
alter table kc_club_nachricht_bearbeitet enable row level security;
revoke all on kc_club_nachricht_bearbeitet from anon, authenticated;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_nachricht_bearbeitet', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-BEARBEITEN (1.9.0): Kennzeichen „Nachricht bearbeitet“')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_nachricht_bearbeitet') on conflict (table_name) do nothing;
