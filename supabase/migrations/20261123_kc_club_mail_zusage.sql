-- KC-CLUB-MAIL-ZUSAGE (Wunsch Hansi 23.11.2026): Mitglieder, die die App nicht öffnen (z. B. App nur auf einem Tablet, das nicht genutzt wird),
-- sagen per E-Mail-Link (antwort.html?t=…) einem Treffen zu oder ab – ohne App und ohne Anmeldung.
-- kc_club_antwort_links: ein Link je Person und Treffen. Gespeichert wird NUR der SHA-256-Fingerabdruck (hex) des Klartext-Links, nie der Link selbst.
-- Gültig bis Treffen-Beginn + 2 Std.; Mehrfaches Ändern erlaubt. Die Antwort selbst steht wie immer in kc_club_teilnahme (hier nur die letzte zur Übersicht).
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated (KC-SUPABASE-GRANTS). Gespiegelt und gesichert (nur Fingerabdrücke). Nur additiv.
-- Rückweg: drop table public.kc_club_antwort_links;
--          delete from public.kc_db_mirror_table_rules where table_name = 'kc_club_antwort_links';
--          delete from public.kc_neon_resume_tables where table_name = 'kc_club_antwort_links';
create table if not exists public.kc_club_antwort_links (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  person_id text not null references public.kc_core_people(person_id),
  treffen_id uuid not null references public.kc_club_treffen(id) on delete cascade,
  erstellt_am timestamptz not null default now(),
  erstellt_von text,
  gueltig_bis timestamptz not null,
  zuletzt_benutzt_am timestamptz,
  antwort text check (antwort in ('ja', 'nein', 'vielleicht'))
);
create index if not exists kc_club_antwort_links_treffen on public.kc_club_antwort_links (treffen_id, person_id);
alter table public.kc_club_antwort_links enable row level security;
revoke all on public.kc_club_antwort_links from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_antwort_links to service_role;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_antwort_links', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-MAIL-ZUSAGE: Zusage-Links per E-Mail (nur Fingerabdrücke, kein Klartext)')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_antwort_links') on conflict (table_name) do nothing;
