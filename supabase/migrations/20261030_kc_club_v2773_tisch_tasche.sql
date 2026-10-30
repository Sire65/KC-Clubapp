-- KC-CLUB-TISCH-TASCHE (Server/App 2.773.0, 30.10.2026, Wunsch Hansi „vorher Sachen packen – PDF, Song, Foto –, damit man nicht lange suchen muss“;
-- Wahl: jeder seine eigene Tasche, die Leitung kann einzelne Teile „vorab für alle“ markieren). Spezifikation docs/RUNDER_TISCH.md, Abschnitt 18.
-- Ein Teil = eine schon hochgeladene Datei (kc_communication_attachments, Pfad club/<person>/…), privat bis zum Zeigen (dann kommt sie in den
-- Tisch-Chat). Aufräumen wie die Dateien im Tisch-Chat: 7 Tage nach dem Ende (Club-Server, tischWartung). Nur der Club-Server (service_role).
-- Rückweg: drop table public.kc_club_tisch_tasche;
--          delete from public.kc_db_mirror_table_rules where table_name = 'kc_club_tisch_tasche';
--          delete from public.kc_neon_resume_tables where table_name = 'kc_club_tisch_tasche';
create table if not exists public.kc_club_tisch_tasche (
  id uuid primary key default gen_random_uuid(),
  tisch_id uuid not null references public.kc_club_tisch(id) on delete cascade,
  person_id text not null,
  attachment_id uuid not null references public.kc_communication_attachments(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  mime text,
  art text not null check (art in ('pdf', 'foto', 'musik')),
  pos integer not null default 0,
  vorab boolean not null default false,
  gezeigt_am timestamptz,
  erstellt_am timestamptz not null default now(),
  unique (tisch_id, person_id, attachment_id)
);
create index if not exists kc_club_tisch_tasche_wer on public.kc_club_tisch_tasche (tisch_id, person_id, pos);
create index if not exists kc_club_tisch_tasche_anlage on public.kc_club_tisch_tasche (attachment_id);
alter table public.kc_club_tisch_tasche enable row level security;
revoke all on public.kc_club_tisch_tasche from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_tisch_tasche to service_role;
comment on table public.kc_club_tisch_tasche is 'KC-CLUB-TISCH-TASCHE: vorher gepackte Unterlagen/Musik je Person und Tisch (privat bis zum Zeigen, vorab = Leitung für alle) – nur Club-Server.';
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_tisch_tasche', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-TISCH-TASCHE: Tasche für den Runden Tisch')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_tisch_tasche') on conflict (table_name) do nothing;
