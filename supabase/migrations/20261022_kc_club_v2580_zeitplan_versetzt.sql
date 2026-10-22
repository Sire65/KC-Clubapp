-- KC-CLUB-ZEITPLAN-VERSETZT (2.580.0, 22.10.2026, Wunsch Hansi „ja“ zum Vorschlag nach dem langsamen Start um 06:00 Uhr):
-- Zur vollen Stunde liefen ~17 Zeitplaner-Aufgaben gleichzeitig an; ein App-Start um 06:00 brauchte am Server 8,4 s statt 0,6 s
-- (alle Teile 4–13× langsamer). Die schweren Aufgaben der Club-App laufen jetzt um einige Minuten versetzt – gleich oft wie bisher.
--   kc-club-wartung-15min           */15 → 4,19,34,49   (stündliche Teile laufen weiter bei Minute < 15, also um :04)
--   kc-club-zugangslinks-schwaerzen */15 → 6,21,36,51
--   kc-club-notpaket-15min          */15 → 9,24,39,54   (Paketbau braucht bis ~36 s)
--   kc-termine-wartung-10min        */10 → 1,11,21,31,41,51
-- Freie Minuten geprüft: Last-Wächter 3/18/33/48, Spiegel-Wächter 2/32, Quellen-Prüfung 7, Nachholen 25/55.
-- Aufgaben anderer Programme (System-Check, Communicator) bleiben unverändert.
-- Rückweg: dieselben Aufrufe mit den alten Zeiten ('*/15 * * * *' bzw. '*/10 * * * *').
select cron.alter_job((select jobid from cron.job where jobname = 'kc-club-wartung-15min'), schedule := '4,19,34,49 * * * *');
select cron.alter_job((select jobid from cron.job where jobname = 'kc-club-zugangslinks-schwaerzen'), schedule := '6,21,36,51 * * * *');
select cron.alter_job((select jobid from cron.job where jobname = 'kc-club-notpaket-15min'), schedule := '9,24,39,54 * * * *');
select cron.alter_job((select jobid from cron.job where jobname = 'kc-termine-wartung-10min'), schedule := '1,11,21,31,41,51 * * * *');
