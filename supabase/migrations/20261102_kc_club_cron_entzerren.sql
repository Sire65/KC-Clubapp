-- KC-CLUB-CRON-ENTZERREN (Wunsch Hansi 02.11.2026 „Ja entzerren“): Zeitpläne nicht mehr alle in derselben Minute starten.
-- Anlass: kurze Aussetzer der Datenbank (rund 20 in 30 Tagen, je 1–2 Min.) fielen fast immer auf Minuten, in denen viele Zeitpläne
-- gleichzeitig starten (:00/:05/:15/:20/:25 …) – jeder Zeitplan öffnet beim Start eine eigene Verbindung. Bisher liefen sechs 5-Minuten-Aufgaben
-- gleichzeitig zur vollen 5er-Minute (mit den 10-/15-/30-Minuten-Aufgaben bis zu 11 auf einmal).
-- Neu verteilt auf die Minuten 0–4 jedes 5-Minuten-Takts (es läuft nichts seltener, nur versetzt):
--   Minute 0: kc-dp-nightly-push-v01936 (bleibt), kc-communication-maintenance, kc-system-check-auto-15m, kc-club-messung-30min
--   Minute 1: kc-club-selbstloeschen, kc-dp-wish-phase-v01952, kc-termine-wartung-10min
--   Minute 2: kc-live-operations-watch-minute, kicc-access-watch-minute, kc-db-mirror-watchdog
--   Minute 3: kc-club-tippen-aufraeumen, kc-wm-push-5min, kc-traffic-guard-15m
--   Minute 4: kc-club-wartung-15min, kc-club-notpaket-15min
-- Rückweg: die sechs Zeitpläne wieder auf '*/5 * * * *' setzen (gleiche Befehle mit '*/5 * * * *').

select cron.alter_job(j.jobid, schedule := v.plan)
  from cron.job j
  join (values ('kc-club-selbstloeschen', '1-59/5 * * * *'),
               ('kc-dp-wish-phase-v01952', '1-59/5 * * * *'),
               ('kc-live-operations-watch-minute', '2-59/5 * * * *'),
               ('kc-club-tippen-aufraeumen', '3-59/5 * * * *'),
               ('kc-wm-push-5min', '3-59/5 * * * *')) as v(name, plan) on v.name = j.jobname
 where j.schedule = '*/5 * * * *';
