-- KC-CLUB-GK-GEMEINSAM (Wunsch Hansi 16.11.2026 „Baue noch die gemeinsame Karte“, Wunschliste #96 Stufe 2): gemeinsame Genesungskarte vom Club.
-- Clubleitung startet sie für ein Mitglied, alle anderen unterschreiben mit einem Tipp (nur der Vorname kommt auf die Karte), danach legt der Starter die
-- Karte als Bild in den Chat. Die beschenkte Person sieht vorher nichts. Kein Grund/keine Krankheit gespeichert – nur Motiv, Überschrift, Text, Absender.
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated (KC-SUPABASE-GRANTS). Gespiegelt und gesichert. Nur additiv.
-- Rückweg: drop table public.kc_club_gk_unterschrift; drop table public.kc_club_gk_gemeinsam;
--          delete from public.kc_db_mirror_table_rules where table_name in ('kc_club_gk_gemeinsam','kc_club_gk_unterschrift');
--          delete from public.kc_neon_resume_tables where table_name in ('kc_club_gk_gemeinsam','kc_club_gk_unterschrift');
create table if not exists public.kc_club_gk_gemeinsam (
  id uuid primary key default gen_random_uuid(),
  fuer_person_id text not null references public.kc_core_people(person_id),
  motiv text not null check (motiv ~ '^[a-z]{2,20}$'),
  titel smallint not null default 0 check (titel between 0 and 5),
  text text not null check (length(text) between 1 and 120),
  von text not null check (length(von) between 1 and 40),
  gestartet_von text not null references public.kc_core_people(person_id),
  gestartet_am timestamptz not null default now(),
  bis timestamptz not null,
  status text not null default 'offen' check (status in ('offen', 'gesendet', 'abgebrochen')),
  erledigt_am timestamptz
);
create unique index if not exists kc_club_gk_gemeinsam_eine_offene on public.kc_club_gk_gemeinsam (fuer_person_id) where status = 'offen';
create table if not exists public.kc_club_gk_unterschrift (
  karte_id uuid not null references public.kc_club_gk_gemeinsam(id) on delete cascade,
  person_id text not null references public.kc_core_people(person_id),
  am timestamptz not null default now(),
  primary key (karte_id, person_id)
);
alter table public.kc_club_gk_gemeinsam enable row level security;
alter table public.kc_club_gk_unterschrift enable row level security;
revoke all on public.kc_club_gk_gemeinsam from public, anon, authenticated;
revoke all on public.kc_club_gk_unterschrift from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_gk_gemeinsam to service_role;
grant select, insert, update, delete on public.kc_club_gk_unterschrift to service_role;
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_gk_gemeinsam', 'Club-App', 'normal', false, true, true, 'KC-CLUB-GK-GEMEINSAM: gemeinsame Genesungskarte (Motiv, Text, Absender – kein Grund)'),
  ('kc_club_gk_unterschrift', 'Club-App', 'normal', false, true, true, 'KC-CLUB-GK-GEMEINSAM: wer die gemeinsame Karte unterschrieben hat')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_gk_gemeinsam'), ('kc_club_gk_unterschrift') on conflict (table_name) do nothing;
