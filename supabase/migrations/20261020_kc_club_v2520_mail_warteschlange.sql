-- 2.520.0 KC-COMM-WARTEN (20.10.2026, Wunsch Hansi „wenn es mehr als 5 Mails sind, Zeitverzögerung einhalten, damit web.de nicht zumacht“;
-- Wahl Hansi: warten, nach 15 Minuten übernimmt Brevo). Der Communicator gibt Mails über der web.de-Grenze einen Warteplatz
-- (kc_communication_requests: status 'queued' + scheduled_for). Der vorhandene Minuten-Zeitplan der geplanten Nachrichten ruft den Server
-- jetzt auch, wenn nur wartende Mails fällig sind – sonst bleibt er still (keine zusätzliche Last, solange nichts wartet).
select cron.unschedule('kc-club-geplant-minute') where exists (select 1 from cron.job where jobname = 'kc-club-geplant-minute');
select cron.schedule('kc-club-geplant-minute', '* * * * *', $cron$
  select net.http_post(
    timeout_milliseconds := 30000,
    url => 'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-club',
    headers => '{"Content-Type":"application/json"}'::jsonb,
    body => jsonb_build_object('action', 'geplant_faellig', 'cronSecret', (select decrypted_secret from vault.decrypted_secrets where name = 'kc_club_cron_secret'))
  ) where exists (select 1 from public.kc_club_geplant where status = 'offen' and senden_um <= now())
       or exists (select 1 from public.kc_communication_requests where status = 'queued' and scheduled_for <= now());
$cron$);
