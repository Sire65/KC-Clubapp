-- KC Club-App – Version 1.54.0 (Wunsch Hansi 02.10.2026)
-- KC-CLUB-NOTBETRIEB-STUFE2  Im Notbetrieb gehen auch: Nachricht in einem bestehenden Chat, Zu-/Absage, Status, Pinnwand-Zettel.
--   Der Ersatz-Server (Cloudflare) legt sie in einen Eingang; sobald der Club-Server wieder läuft, holt er den Eingang
--   (signiert) ab und trägt jeden Eintrag über seine normalen Funktionen nach. Diese Tabelle merkt sich jeden Eintrag genau
--   einmal (Schlüssel = Eingangs-Schlüssel des Ersatz-Servers) – so kommt nichts doppelt an – und das Ergebnis
--   (erledigt / abgelehnt mit Grund) für die Tagesinfo des Admins und die Rückmeldung an das Mitglied.
-- Rückweg: drop table kc_club_notbetrieb_eingang; alter table kc_club_notbetrieb drop column nachtrag_am, drop column nachtrag;
create table if not exists public.kc_club_notbetrieb_eingang (
  schluessel text primary key,
  not_id text not null,
  person_id text references public.kc_core_people(person_id),
  aktion text not null,
  daten jsonb not null default '{}'::jsonb,
  geschrieben_am timestamptz,
  status text not null default 'offen' check (status in ('offen', 'erledigt', 'abgelehnt')),
  ergebnis text,
  angenommen_am timestamptz not null default now(),
  nachgetragen_am timestamptz
);
create index if not exists kc_club_notbetrieb_eingang_person on public.kc_club_notbetrieb_eingang (person_id, not_id);
alter table public.kc_club_notbetrieb_eingang enable row level security;
revoke all on public.kc_club_notbetrieb_eingang from public, anon, authenticated;

alter table public.kc_club_notbetrieb add column if not exists nachtrag_am timestamptz, add column if not exists nachtrag jsonb;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_notbetrieb_eingang', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-NOTBETRIEB-STUFE2 (1.54.0): im Notbetrieb Geschriebenes + Ergebnis')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_notbetrieb_eingang')
on conflict (table_name) do nothing;
