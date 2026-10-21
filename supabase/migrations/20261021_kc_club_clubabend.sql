-- 2.569.0 KC-CLUB-CLUBABEND (Wunschliste #27, Hansi 21.10.2026): Kachel „🍽️ Clubabend“ am Abend selbst – Tagesordnung abhaken,
-- Anwesenheit (trägt die Clubleitung vor Ort ein, nicht jeder selbst), Album des Abends. Ein Eintrag je Treffen.
-- Rückweg: drop table public.kc_club_clubabend;
create table if not exists public.kc_club_clubabend (
  treffen_id uuid primary key references public.kc_club_treffen(id) on delete cascade,
  erledigt text[] not null default '{}',
  anwesend text[] not null default '{}',
  album_id uuid,
  geaendert_von text,
  geaendert_am timestamptz not null default now()
);
alter table public.kc_club_clubabend enable row level security;
revoke all on public.kc_club_clubabend from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_clubabend to service_role;
