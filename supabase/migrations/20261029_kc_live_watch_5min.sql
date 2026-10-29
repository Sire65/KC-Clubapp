-- KC-LIVE-WATCH-5MIN (Wahl Hansi 29.10.2026 „alle 5 Min.“): Live-Überwachung von KC System Check (kc-live-operations-watch) läuft alle
-- 5 statt alle 2 Minuten. Anlass: Supabase-Protokollmenge (Log Ingestion) hochgerechnet rund das Vierfache des kostenlosen Rahmens; jeder Lauf
-- macht ca. 20 Datenbank-Anfragen (Ziele, Zustände, Lebenszeichen lesen, jeden Zustand schreiben) → ca. 8.600 Anfragen/Tag weniger.
-- Folge (mit Hansi abgestimmt): Ein Alarm braucht zwei rote Läufe hintereinander – er kommt jetzt spätestens nach ca. 10 statt ca. 4 Minuten.
-- Nur der Zeitplan ändert sich; Befehl, Schlüssel und Ziel bleiben, wie sie sind.
-- Rückweg: select cron.alter_job(jobid, schedule := '*/2 * * * *') from cron.job where jobname = 'kc-live-operations-watch-minute';
do $$
declare v_id bigint;
begin
  select jobid into v_id from cron.job where jobname = 'kc-live-operations-watch-minute';
  if v_id is null then raise exception 'Zeitplan kc-live-operations-watch-minute fehlt'; end if;
  perform cron.alter_job(v_id, schedule := '*/5 * * * *');
end $$;
