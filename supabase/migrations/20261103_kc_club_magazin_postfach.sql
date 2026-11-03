-- KC-CLUB-MAGAZIN-POSTFACH (03.11.2026, Wunsch Hansi „ein eigenes Postfach, z. B. Redaktion, um dort Beiträge wie Fotos, Rezepte, Texte, Küchenwitz des Monats,
-- Porträt ‚X stellt sich vor‘ usw. einzusenden“): Mitglieder senden Beiträge für das Club-Magazin „Club-Küche“ ein; die Redaktion (bis zur Wahl der Admin,
-- später Amt „Redaktion“) sieht sie im Postfach und vermerkt angenommen / für Ausgabe Nr. / abgelehnt. Anlagen liegen wie gewohnt im Speicher (Anlagen-IDs).
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated (KC-SUPABASE-GRANTS). Gespiegelt und gesichert. Nur additiv.
-- Rückweg: drop table public.kc_club_magazin_beitrag; delete from public.kc_db_mirror_table_rules where table_name = 'kc_club_magazin_beitrag';
--          delete from public.kc_neon_resume_tables where table_name = 'kc_club_magazin_beitrag';
create table if not exists public.kc_club_magazin_beitrag (
  id uuid primary key default gen_random_uuid(),
  von text not null references public.kc_core_people(person_id),
  art text not null check (art ~ '^[a-z_]{2,20}$'),
  titel text not null check (length(titel) between 1 and 120),
  text text check (length(text) <= 4000),
  anlagen jsonb not null default '[]'::jsonb check (jsonb_typeof(anlagen) = 'array'),
  zustimmung boolean not null default false,
  status text not null default 'neu' check (status in ('neu', 'angenommen', 'abgelehnt', 'erschienen')),
  ausgabe integer check (ausgabe between 1 and 999),
  notiz text check (length(notiz) <= 500),
  bearbeitet_von text,
  bearbeitet_am timestamptz,
  erstellt_am timestamptz not null default now()
);
create index if not exists kc_club_magazin_beitrag_status on public.kc_club_magazin_beitrag (status, erstellt_am desc);
create index if not exists kc_club_magazin_beitrag_von on public.kc_club_magazin_beitrag (von, erstellt_am desc);
alter table public.kc_club_magazin_beitrag enable row level security;
revoke all on public.kc_club_magazin_beitrag from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_magazin_beitrag to service_role;
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_magazin_beitrag', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-MAGAZIN-POSTFACH: eingesandte Beiträge für das Club-Magazin')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_magazin_beitrag') on conflict (table_name) do nothing;
