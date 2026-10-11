-- Club-App 2.232.0 – KC-CLUB-ARCHIV-KOPIE: zweite Kopie der Archiv-Dateien im Neon-Dateispeicher Frankfurt
-- (Projekt „KC Archiv Kopie“ dry-waterfall-32306741, Fach „kc-archiv“, privat; Zugang nur im Vault „kc_club_archiv_kopie“).
-- Der Server (kc-club, Aktion „wartung“) kopiert nachts neue/geänderte Archiv-Dokumente; gelöschte fallen 30 Tage nach dem Löschen weg.
-- Nur über die Edge Function (service_role) – RLS an, keine Policies. Eigene Tabellen, damit der KC-Spiegel unberührt bleibt.
create table if not exists public.kc_club_archiv_kopie (
  dokument_id uuid primary key,
  attachment_id uuid not null,
  schluessel text not null,
  groesse bigint,
  sha256 text,
  kopiert_am timestamptz not null default now()
);
alter table public.kc_club_archiv_kopie enable row level security;
revoke all on public.kc_club_archiv_kopie from anon, authenticated;

-- letzter Lauf (genau eine Zeile) – liest die Admin-Zentrale; alt/fehlend wird grau angezeigt, nie als OK
create table if not exists public.kc_club_archiv_kopie_stand (
  id smallint primary key default 1 check (id = 1),
  zeit timestamptz not null default now(),
  status text not null check (status in ('ok', 'warnung', 'fehler')),
  text text,
  metrics jsonb not null default '{}'::jsonb
);
alter table public.kc_club_archiv_kopie_stand enable row level security;
revoke all on public.kc_club_archiv_kopie_stand from anon, authenticated;

-- Spiegel-Regeln: Verzeichnis der Kopie selbst nicht spiegeln (es beschreibt nur die Kopie) → Abdeckung bleibt vollständig
insert into public.kc_db_mirror_table_rules(table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note, updated_at)
values
  ('kc_club_archiv_kopie', 'Club-App', 'personal', false, false, false, 'KC-CLUB-ARCHIV-KOPIE: Verzeichnis der Archiv-Kopie in Neon Frankfurt, nicht spiegeln', now()),
  ('kc_club_archiv_kopie_stand', 'Club-App', 'personal', false, false, false, 'KC-CLUB-ARCHIV-KOPIE: letzter Kopierlauf, nicht spiegeln', now())
on conflict (table_name) do nothing;
