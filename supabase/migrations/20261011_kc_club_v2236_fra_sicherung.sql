-- Club-App 2.236.0 – KC-CLUB-FRA-SICHERUNG (Wunsch Hansi 11.10.2026): tägliche Komplett-Sicherung der Supabase-Datenbank
-- als Dateien in den Neon-Dateispeicher Frankfurt (Projekt „KC Archiv Kopie“, Fach „kc-archiv“, Ordner datenbank/<Tag>/).
-- Jede Tabelle (große in Blöcken) → gepacktes JSON + Prüfsumme; danach Rücklese-Test; 14 Tagesstände, ältere werden gelöscht.
-- Der Server (kc-club, Aktion „fra_sicherung“) arbeitet in kleinen Schritten; der Zeitplaner ruft ihn nachts alle 2 Min.
-- Nur über die Edge Function (service_role / direkter Datenbank-Weg) – RLS an, keine Policies.
create table if not exists public.kc_club_fra_sicherung (
  lauf text not null,                -- Berliner Tag, z. B. 2026-10-12
  tabelle text not null,
  teil integer not null default 0,
  block_von bigint,                  -- null = ganze Tabelle
  block_bis bigint,                  -- null = bis zum Ende
  status text not null default 'offen' check (status in ('offen', 'laeuft', 'ok', 'geprueft', 'fehler')),
  versuche integer not null default 0,
  zeilen bigint,
  bytes bigint,                      -- gepackt
  roh_bytes bigint,
  sha256 text,
  schluessel text,
  fehler text,
  zeit timestamptz not null default now(),
  primary key (lauf, tabelle, teil)
);
alter table public.kc_club_fra_sicherung enable row level security;
revoke all on public.kc_club_fra_sicherung from anon, authenticated;

create table if not exists public.kc_club_fra_sicherung_stand (
  id smallint primary key default 1 check (id = 1),
  lauf text,
  zeit timestamptz not null default now(),
  status text not null check (status in ('laeuft', 'ok', 'warnung', 'fehler')),
  text text,
  metrics jsonb not null default '{}'::jsonb
);
alter table public.kc_club_fra_sicherung_stand enable row level security;
revoke all on public.kc_club_fra_sicherung_stand from anon, authenticated;

insert into public.kc_db_mirror_table_rules(table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note, updated_at)
values
  ('kc_club_fra_sicherung', 'Club-App', 'normal', false, false, false, 'KC-CLUB-FRA-SICHERUNG: Verzeichnis der Frankfurt-Sicherung, nicht spiegeln', now()),
  ('kc_club_fra_sicherung_stand', 'Club-App', 'normal', false, false, false, 'KC-CLUB-FRA-SICHERUNG: letzter Lauf, nicht spiegeln', now())
on conflict (table_name) do nothing;

-- Zeitplaner: nachts 01:00–03:58 UTC (03:00–05:58 Uhr Sommerzeit, 02:00–04:58 Uhr Winterzeit) alle 2 Minuten ein Schritt
select cron.schedule('kc-club-fra-sicherung', '*/2 1-3 * * *', $$
  select net.http_post(
    url => 'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-club',
    headers => '{"Content-Type":"application/json"}'::jsonb,
    body => jsonb_build_object('action', 'fra_sicherung',
      'cronSecret', (select decrypted_secret from vault.decrypted_secrets where name = 'kc_club_cron_secret')),
    timeout_milliseconds => 60000
  );
$$);
