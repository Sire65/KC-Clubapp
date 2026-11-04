-- KC-CLUB-OFFLINE-PUSH (Server 2.851.0, Wunsch Hansi 04.11.2026 „Push, wenn sich die Mitglieder wieder abgemeldet haben“; „sparsam“): der Minuten-Zeitplan
-- ruft den Club-Server bisher nur, wenn eine geplante Nachricht, die Warteschlange oder ein Wecker fällig ist. Jetzt zusätzlich jede 5. Minute, aber NUR,
-- wenn jemand seit 5½–25 Minuten kein Lebenszeichen gibt und für diese Sitzung noch keine Offline-Meldung ging (online_seit.wert.offline ≠ seit).
-- Sonst bleibt alles still: keine zusätzlichen Server-Aufrufe, nur diese kleine Prüfung in der Datenbank.
-- Rückweg: die Zeile „or (extract(minute …“ wieder weglassen (Stand 20261025_kc_club_v2640_wecker.sql).
select cron.unschedule('kc-club-geplant-minute') where exists (select 1 from cron.job where jobname = 'kc-club-geplant-minute');
select cron.schedule('kc-club-geplant-minute', '* * * * *', $cron$
  select net.http_post(
    timeout_milliseconds := 30000,
    url => 'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-club',
    headers => '{"Content-Type":"application/json"}'::jsonb,
    body => jsonb_build_object('action', 'geplant_faellig', 'cronSecret', (select decrypted_secret from vault.decrypted_secrets where name = 'kc_club_cron_secret'))
  ) where exists (select 1 from public.kc_club_geplant where status = 'offen' and senden_um <= now())
       or exists (select 1 from public.kc_communication_requests where status = 'queued' and scheduled_for <= now())
       or exists (select 1 from public.kc_club_wecker where status = 'offen' and faellig_um <= now())
       or (extract(minute from now())::int % 5 = 0 and exists (select 1 from public.kc_club_person_einstellung
             where schluessel = 'online_seit' and (wert->>'zuletzt')::timestamptz between now() - interval '25 minutes' and now() - interval '330 seconds'
               and coalesce(wert->>'offline', '') <> coalesce(wert->>'seit', '') and person_id not like 'KC-P-TEST%'));
$cron$);
