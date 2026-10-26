-- KC-CLUB-TEMPO-HINTERGRUND (26.10.2026, Wunsch Hansi „Bau 1 bis 4 ein“, Punkt 3 „Hintergrundlast senken“): weniger Dauerlast auf der Datenbank.
-- Keine Funktion fällt weg. Rückweg je Abschnitt unten.

-- 1) Zugriffs-Wächter (neue Geräte / neue Konten bei der Supabase-Anmeldung): jede Minute → alle 5 Minuten.
--    Er arbeitet ab dem letzten gesehenen Zeitpunkt weiter (last_session_at) – es geht nichts verloren, ein Alarm kommt höchstens 5 Min. später.
--    Die Häufungs-Warnung zählt ohnehin die letzte Stunde. Rückweg: select cron.alter_job(60, schedule => '* * * * *');
select cron.alter_job(60, schedule => '2-59/5 * * * *') where exists (select 1 from cron.job where jobid = 60 and jobname = 'kicc-access-watch-minute');

-- 2) Persönliche Links in der Versandliste schwärzen (alle 15 Min.): nur noch die Aufträge der letzten 3 Tage durchsuchen statt der ganzen Liste.
--    Geschwärzt wird spätestens nach 2 Tagen (wie bisher) – ältere Aufträge sind also schon erledigt (geprüft 26.10.: 0 offene älter als 7 Tage).
--    Rückweg: Funktion ohne „created_at > now() - interval '3 days' and“ wieder eintragen.
create or replace function public.kc_club_zugangslinks_schwaerzen()
 returns integer
 language plpgsql
 security definer
 set search_path to 'pg_catalog', 'public'
as $function$
declare n integer;
begin
  update public.kc_communication_requests
     set variables = regexp_replace(variables::text, '\?k=[A-Za-z0-9_-]{8,}', '?k=[entfernt]', 'g')::jsonb
   where created_at > now() - interval '3 days' -- KC-CLUB-TEMPO-HINTERGRUND: Index auf created_at statt Vollsuche
     and variables::text ~ '\?k=[A-Za-z0-9_-]{8,}'
     and (status in ('sent','delivered','displayed','opened','acknowledged','failed','dead_lettered','error','cancelled','skipped') or created_at < now() - interval '2 days');
  get diagnostics n = row_count;
  return n;
end $function$;
