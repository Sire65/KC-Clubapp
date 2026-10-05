-- KC Club-App – Version 2.23.49
-- KC-CLUB-TWINKEY-FRAGEN (Wunsch Hansi): „Frag Twinkey“ – Fragen, die Twinkey noch nicht beantworten kann, gehen an den Admin.
--   Der Admin schreibt die Antwort und schickt sie der fragenden Person per 🔔 Push, ✉️ E-Mail und/oder 📱 in der Club-App.
--   Auf Wunsch (wissen = true) lernt Twinkey Frage + Antwort und beantwortet sie beim nächsten Mal selbst.
-- Nichts wird gelöscht: Verwerfen = status 'verworfen'. Zugriff nur über den Server (kc-club), RLS an, keine Policies.
-- Rückweg: drop table kc_club_twinkey_fragen; (Spiegel-/Resume-Regel löschen)
create table if not exists kc_club_twinkey_fragen (
  id uuid primary key default gen_random_uuid(),
  von text not null references kc_core_people(person_id),
  frage text not null check (char_length(frage) between 3 and 300),
  antwort text check (antwort is null or char_length(antwort) <= 2000),
  status text not null default 'offen' check (status in ('offen', 'beantwortet', 'verworfen')),
  kanaele text[] check (kanaele is null or kanaele <@ array['push', 'email', 'app']::text[]),
  wissen boolean not null default false,
  gelesen boolean not null default false,
  beantwortet_von text references kc_core_people(person_id),
  erstellt_am timestamptz not null default now(),
  beantwortet_am timestamptz,
  check (status <> 'beantwortet' or antwort is not null)
);
create index if not exists kc_club_twinkey_fragen_status on kc_club_twinkey_fragen (status, erstellt_am);
create index if not exists kc_club_twinkey_fragen_von on kc_club_twinkey_fragen (von, erstellt_am);
alter table kc_club_twinkey_fragen enable row level security;
revoke all on kc_club_twinkey_fragen from anon, authenticated;
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_twinkey_fragen', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-TWINKEY-FRAGEN (2.23.49): Fragen an Twinkey + Antworten')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_twinkey_fragen') on conflict (table_name) do nothing;
