-- 2.156.0: Wiederherstellung „Kurz erklärt – gesehen“ für KC-P-002 nach Start-Fehler in 2.155.0.
-- Quelle: Neon-Spiegel (Stand 08.10.). Nur dieser eine Einstellungs-Eintrag, nur ergänzend (vorhandene Einträge bleiben).
-- Rückweg (Stand vorher): {"an": true, "gesehen": {"start": "2026-10-09T16:18:03.263Z"}}
update kc_club_person_einstellung
   set wert = jsonb_set(wert, '{gesehen}',
         '{"start":"2026-10-07T18:53:15.623Z","spiele":"2026-10-08T15:58:30.433Z","b-admin":"2026-10-07T19:25:28.001Z","pinnwand":"2026-10-07T19:02:41.395Z","mitglieder":"2026-10-08T03:49:04.980Z","nachrichten":"2026-10-07T19:18:50.534Z","hilfezentrum":"2026-10-07T19:25:03.374Z"}'::jsonb
         || coalesce(wert->'gesehen', '{}'::jsonb)),
       geaendert_am = now()
 where person_id = 'KC-P-002' and schluessel = 'einweisung';
