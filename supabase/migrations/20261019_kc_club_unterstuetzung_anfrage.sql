-- KC-CLUB-UNTERSTUETZUNG-ANFRAGE (2.492.0, Wunsch Hansi): „Unterstützung bei der Club-App? Anfrage senden“ – kurzer Fragebogen (wenige Punkte
-- in Bereichen), der Admin nimmt Kontakt auf. Eine offene Anfrage je Person (neue Angaben ergänzen sie). Nur additiv.
create table if not exists public.kc_club_unterstuetzung (
  id uuid primary key default gen_random_uuid(),
  person_id text not null references public.kc_core_people(person_id),
  punkte text[] not null default '{}',
  text text check (length(text) <= 500),
  kontakt text[] not null default '{}',
  status text not null default 'offen' check (status in ('offen', 'in_arbeit', 'erledigt')),
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  bearbeitet_von text,
  bearbeitet_am timestamptz
);
create index if not exists kc_club_unterstuetzung_person on public.kc_club_unterstuetzung (person_id, status);
create index if not exists kc_club_unterstuetzung_status on public.kc_club_unterstuetzung (status, erstellt_am desc);
alter table public.kc_club_unterstuetzung enable row level security;
revoke all on public.kc_club_unterstuetzung from anon, authenticated;
grant select, insert, update on public.kc_club_unterstuetzung to service_role;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_unterstuetzung', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-UNTERSTUETZUNG-ANFRAGE (2.492.0): Unterstützungs-Anfragen an den Admin')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_unterstuetzung') on conflict (table_name) do nothing;
