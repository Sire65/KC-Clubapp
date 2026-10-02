-- KC Club-App – 1.52.0 Nachtrag (02.10.2026)
-- KC-CLUB-NOTBETRIEB  Erster echter Paketbau dauerte ca. 36 s (17 Mitglieder). Der Zeitplaner wartet deshalb 120 s statt 60 s.
-- Rückweg: denselben Aufruf mit timeout_milliseconds => 60000 einspielen.
select cron.schedule('kc-club-notpaket-15min', '*/15 * * * *', $cron$
  select net.http_post(
    url => 'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-club',
    headers => '{"Content-Type":"application/json"}'::jsonb,
    body => jsonb_build_object('action', 'notpaket',
      'cronSecret', (select decrypted_secret from vault.decrypted_secrets where name = 'kc_club_cron_secret')),
    timeout_milliseconds => 120000
  );
$cron$);
