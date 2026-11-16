-- KC-CLUB-PULS (Wunsch Hansi 16.11.2026: „In der Musik gibt es so Anzeigen aus LED, die ausschlagen, je lauter die Musik ist – grün, gelb, rot …
-- in die Kopfzeile beim Admin … den Datenverkehr anzeigen“; Antworten: „Statusleisten senkrecht, nur Club-App messen, ja abschaltbar unter Zahnrad bei Admin“).
-- Zählerstände der Club-App aus pg_stat_statements (zählt die Datenbank ohnehin mit – es wird NICHTS zusätzlich gespeichert): nur Abfragen des
-- Club-Servers (Rolle service_role) auf Club-Tabellen (kc_club_*, kc_communication_*, kc_core_people), getrennt in Lesen und Schreiben;
-- dazu wie viele gerade in der App sind. Keine Inhalte, keine Namen – nur Summen. Die App rechnet aus zwei Ständen „pro Sekunde“.
-- security definer, damit pg_stat_statements gelesen werden darf; aufrufen darf NUR der Club-Server (service_role) – kein Prüfregister nötig.
-- Rückweg: drop function public.kc_club_puls();
create or replace function public.kc_club_puls()
returns jsonb language sql stable security definer set search_path to 'pg_catalog', 'public', 'extensions' as $$
  with s as (
    select st.calls, (st.query ~* '\m(insert\s+into|update\s|delete\s+from)') as schreiben
      from extensions.pg_stat_statements st join pg_catalog.pg_roles r on r.oid = st.userid
     where r.rolname = 'service_role' and st.query ~* '(kc_club_|kc_communication_|kc_core_people)'
       and st.query !~* 'kc_club_puls')                       -- die Anzeige selbst zählt nicht mit
  select jsonb_build_object(
    't', round(extract(epoch from clock_timestamp()) * 1000),
    'lesen', coalesce((select sum(calls) from s where not schreiben), 0),
    'schreiben', coalesce((select sum(calls) from s where schreiben), 0),
    'online', (select count(*) from public.kc_club_zugang where zuletzt_gesehen > now() - interval '3 minutes'));
$$;
revoke all on function public.kc_club_puls() from public, anon, authenticated;
grant execute on function public.kc_club_puls() to service_role;
