-- KC-CORE-PSEUDONYM-SCHUTZ (10.10.2026, Wunsch Hansi „Pseudo darf nicht mehr überschrieben werden“)
-- Fund: Der Trigger kc_core_people_sync_directory kopierte bei jeder Änderung kc_core_people.preferred_name (= Rufname)
--   in kc_core_operational_directory.preferred_name (= Pseudonym für Kasse/Dienstplan, gehört dem KC Manager).
--   So wurde am 01.09. Hansis Pseudonym „Pumuckl“ zu „Hansi“; am 10.10. kurz Annes „Einhorn“ zu „Anne“ (sofort zurückgesetzt).
-- Neu: Der Trigger gleicht nur noch Anzeigename und aktiv/inaktiv ab. Das Pseudonym schreibt ausschließlich der KC Manager.
--   Neue Personen bekommen im Betriebsverzeichnis kein Pseudonym vorbelegt (leer, bis der Manager eins vergibt).
-- Rückweg: Funktion und Trigger aus dem Abschnitt „ALTER STAND“ unten wieder einspielen.
create or replace function kc_private.kc_core_sync_directory()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'pg_catalog'
as $function$
begin
  insert into public.kc_core_operational_directory(org_id, person_id, display_name, active, updated_at)
  values (new.org_id, new.person_id, new.display_name, new.active, now())
  on conflict (org_id, person_id) do update
     set display_name = excluded.display_name,
         active = excluded.active,
         updated_at = now();
  return new;
end;
$function$;

-- Der Trigger selbst bleibt unverändert (feuert weiter auch bei preferred_name-Änderungen) – harmlos, weil die Funktion das
-- Pseudonym nicht mehr anfasst. (Neu anlegen scheiterte am 10.10. an einer Tabellensperre; nicht nötig.)
-- Geprüft 10.10.: Update auf Annes Datensatz → Pseudonym „Einhorn“ blieb erhalten.

-- Hansis Pseudonym wiederherstellen (laut Abgleich-Bericht 01.09.2026: „Pumuckl“)
update public.kc_core_operational_directory set preferred_name = 'Pumuckl', updated_at = now()
 where org_id = 'KC_WERNE' and person_id = 'KC-P-002' and preferred_name = 'Hansi';

-- ALTER STAND (Rückweg):
-- create or replace function kc_private.kc_core_sync_directory() returns trigger language plpgsql security definer
--   set search_path to 'public','pg_catalog' as $f$ begin
--   insert into public.kc_core_operational_directory(org_id, person_id, display_name, preferred_name, active, updated_at)
--   values (new.org_id, new.person_id, new.display_name, new.preferred_name, new.active, now())
--   on conflict (org_id, person_id) do update set display_name = excluded.display_name, preferred_name = excluded.preferred_name,
--     active = excluded.active, updated_at = now(); return new; end; $f$;
