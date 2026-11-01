-- KC-CLUB-STROM-MESSUNG (Server/App 2.799.0, 01.11.2026, Wunsch #55 Hansi „Stromverbrauch senken und im Adminbereich zeigen – alles bauen, aber sparsam“):
-- Android-Geräte melden einmal am Tag je Bereich (Startseite, Nachrichten, Runder Tisch …), wie viele Minuten die App sichtbar war und wie viel Akku
-- (in Prozentpunkten) dabei verbraucht wurde – nur Zahlen, keine Inhalte. Der Admin sieht die Summe der letzten 7 Tage (ohne Namen).
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated (KC-SUPABASE-GRANTS). Messwerte werden nicht gespiegelt
-- (wie kc_club_messwerte); der Club-Server löscht Zeilen älter als 30 Tage beim Melden.
-- Rückweg: drop table public.kc_club_strom; delete from public.kc_db_mirror_table_rules where table_name = 'kc_club_strom';
create table if not exists public.kc_club_strom (
  tag date not null,
  person_id text not null,
  bereich text not null check (bereich ~ '^[a-z_]{1,30}$'),
  minuten numeric(7,1) not null check (minuten >= 0 and minuten <= 1440),
  prozent numeric(6,1) not null check (prozent >= 0 and prozent <= 500),
  gemeldet_am timestamptz not null default now(),
  primary key (tag, person_id, bereich)
);
create index if not exists kc_club_strom_tag on public.kc_club_strom (tag);
alter table public.kc_club_strom enable row level security;
revoke all on public.kc_club_strom from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_strom to service_role;
comment on table public.kc_club_strom is 'KC-CLUB-STROM-MESSUNG: Akku-Verbrauch je Bereich und Tag (nur Android, nur Zahlen). Nur Club-Server.';
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_strom', 'Club-App', 'normal', false, false, false, 'KC-CLUB-STROM-MESSUNG: Akku-Messwerte je Bereich – nicht gespiegelt, wie kc_club_messwerte')
on conflict (table_name) do nothing;
