-- KC-CLUB-DIENST-TAUSCH (Server/App 2.601.0, 22.10.2026, Wunsch Hansi „Dienst-Tausch-Börse hört sich gut an“):
-- Tauschbörse für geplante Dienste. Eine Zeile je Angebot: Mitglied bietet seinen Dienst an → ein anderes übernimmt → Planer bestätigt.
-- Der veröffentlichte Dienstplan (kc_dp_plan_published) wird NICHT geändert – bis DP3 die Übergabe übernimmt (Codex-Auftrag),
-- rechnet die Club-App bestätigte Übergaben selbst ein. Probe-Angebote (probe = true) legt nur der Admin zum Testen an.
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated (KC-SUPABASE-GRANTS).
-- Rückweg: drop table public.kc_club_dienst_tausch;
--          delete from public.kc_db_mirror_table_rules where table_name = 'kc_club_dienst_tausch';
--          delete from public.kc_neon_resume_tables where table_name = 'kc_club_dienst_tausch';
create table if not exists public.kc_club_dienst_tausch (
  id uuid primary key default gen_random_uuid(),
  org_id text not null default 'KC_WERNE',
  event_id text,
  dienst_ref text not null,               -- kc_dp_plan_published.source_shift_id (Probe: 'probe:…')
  work_date date not null,
  start_zeit timestamptz not null,
  ende_zeit timestamptz not null,
  bereich text, zone text, pause_min integer check (pause_min between 0 and 240),
  von_person text not null,
  nachricht text check (char_length(coalesce(nachricht, '')) <= 300),
  status text not null default 'offen' check (status in ('offen', 'uebernommen', 'bestaetigt', 'abgelehnt', 'zurueckgezogen')),
  an_person text,
  an_am timestamptz,
  entschieden_von text, entschieden_am timestamptz,
  grund text check (char_length(coalesce(grund, '')) <= 200),
  probe boolean not null default false,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  check (ende_zeit > start_zeit)
);
create unique index if not exists kc_club_dienst_tausch_aktiv on public.kc_club_dienst_tausch (dienst_ref, von_person) where status in ('offen', 'uebernommen');
create index if not exists kc_club_dienst_tausch_start on public.kc_club_dienst_tausch (org_id, start_zeit);
create index if not exists kc_club_dienst_tausch_an on public.kc_club_dienst_tausch (an_person) where an_person is not null;
alter table public.kc_club_dienst_tausch enable row level security;
revoke all on public.kc_club_dienst_tausch from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_dienst_tausch to service_role;
comment on table public.kc_club_dienst_tausch is 'KC-CLUB-DIENST-TAUSCH: Tauschbörse für geplante Dienste (anbieten → übernehmen → Planer bestätigt) – nur Club-Server.';

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_dienst_tausch', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-DIENST-TAUSCH: Tauschbörse für Dienste')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_dienst_tausch') on conflict (table_name) do nothing;
