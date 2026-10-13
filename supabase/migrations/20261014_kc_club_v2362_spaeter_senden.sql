-- KC-CLUB-SPAETER-SENDEN (2.362.0, Wunsch Hansi): Nachrichten zeitversetzt senden, auch mit Wiederholung (z. B. jeden Montag 8 Uhr).
-- Nur der Server (service_role) liest und schreibt – RLS an, keine Richtlinien für Nutzer.
create table if not exists public.kc_club_geplant (
  id uuid primary key default gen_random_uuid(),
  person_id text not null,
  thread_id uuid not null references public.kc_communication_threads(id) on delete cascade,
  text text not null check (char_length(text) between 1 and 4000),
  wichtig boolean not null default false,
  wege text[] not null default array['push'],
  erste_um timestamptz not null,
  senden_um timestamptz not null,
  wiederholung text not null default 'einmal' check (wiederholung in ('einmal','taeglich','werktags','woechentlich','monatlich')),
  status text not null default 'offen' check (status in ('offen','fertig','geloescht','fehler')),
  anzahl integer not null default 0,
  letzter_fehler text,
  gesendet_am timestamptz,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now()
);
create index if not exists kc_club_geplant_faellig on public.kc_club_geplant (senden_um) where status = 'offen';
create index if not exists kc_club_geplant_person on public.kc_club_geplant (person_id, thread_id) where status = 'offen';
alter table public.kc_club_geplant enable row level security;
revoke all on public.kc_club_geplant from anon, authenticated;
grant select, insert, update, delete on public.kc_club_geplant to service_role;

-- Zeitplaner: jede Minute nachsehen – den Server nur rufen, wenn wirklich etwas fällig ist (keine Last, solange nichts geplant ist)
select cron.unschedule('kc-club-geplant-minute') where exists (select 1 from cron.job where jobname = 'kc-club-geplant-minute');
select cron.schedule('kc-club-geplant-minute', '* * * * *', $cron$
  select net.http_post(
    timeout_milliseconds := 30000,
    url => 'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-club',
    headers => '{"Content-Type":"application/json"}'::jsonb,
    body => jsonb_build_object('action', 'geplant_faellig', 'cronSecret', (select decrypted_secret from vault.decrypted_secrets where name = 'kc_club_cron_secret'))
  ) where exists (select 1 from public.kc_club_geplant where status = 'offen' and senden_um <= now());
$cron$);
