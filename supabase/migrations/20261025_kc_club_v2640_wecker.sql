-- 2.640.0 KC-CLUB-UHR-WECKER (Wunschliste #38, Wunsch Hansi „Wecker, Stoppuhr und Timer in der Uhr – ja mit Push“):
-- Wecker und Timer klingeln in der App; ist die App zu, schickt der Server zur Zeit einen Push. Hier steht nur die Zeit,
-- die Art und ein kurzer Text – sonst nichts. Nur der Server (service_role) liest und schreibt – RLS an, keine Richtlinien für Nutzer.
create table if not exists public.kc_club_wecker (
  id uuid primary key default gen_random_uuid(),
  person_id text not null,
  art text not null check (art in ('wecker','timer')),
  faellig_um timestamptz not null,
  text text not null default '' check (char_length(text) <= 120),
  status text not null default 'offen' check (status in ('offen','fertig','geloescht','verpasst','fehler')),
  gesendet_am timestamptz,
  erstellt_am timestamptz not null default now()
);
create index if not exists kc_club_wecker_faellig on public.kc_club_wecker (faellig_um) where status = 'offen';
create index if not exists kc_club_wecker_person on public.kc_club_wecker (person_id) where status = 'offen';
alter table public.kc_club_wecker enable row level security;
revoke all on public.kc_club_wecker from anon, authenticated;
grant select, insert, update, delete on public.kc_club_wecker to service_role;

-- Minuten-Zeitplan: ruft den Server jetzt auch, wenn ein Wecker/Timer fällig ist – sonst bleibt er still wie bisher
select cron.unschedule('kc-club-geplant-minute') where exists (select 1 from cron.job where jobname = 'kc-club-geplant-minute');
select cron.schedule('kc-club-geplant-minute', '* * * * *', $cron$
  select net.http_post(
    timeout_milliseconds := 30000,
    url => 'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-club',
    headers => '{"Content-Type":"application/json"}'::jsonb,
    body => jsonb_build_object('action', 'geplant_faellig', 'cronSecret', (select decrypted_secret from vault.decrypted_secrets where name = 'kc_club_cron_secret'))
  ) where exists (select 1 from public.kc_club_geplant where status = 'offen' and senden_um <= now())
       or exists (select 1 from public.kc_communication_requests where status = 'queued' and scheduled_for <= now())
       or exists (select 1 from public.kc_club_wecker where status = 'offen' and faellig_um <= now());
$cron$);
