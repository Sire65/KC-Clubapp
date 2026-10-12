-- KC-DATA-API-FREIGABEN (12.10.2026, Wunsch Hansi): Supabase gibt ab 30.10.2026 neue Tabellen in public NICHT mehr automatisch
-- für die Data API frei (anon, authenticated, service_role). Bestehende Tabellen behalten ihre Freigaben.
-- Regel ab jetzt: jede neue Tabelle bekommt ihre Freigabe ausdrücklich in derselben Migration, z. B.
--   grant select, insert, update, delete on public.kc_club_beispiel to service_role;
-- (der Vertragstest prüft das für alle Migrationen ab 20261012).
-- Bereits eingespielt am 12.10.2026 (per SQL, Schritt für Schritt); diese Datei ist wiederholbar.

-- A) bisherige Standard-Freigaben ausdrücklich festschreiben (gleich wie bisher)
alter default privileges for role postgres in schema public grant select, insert, update, delete on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant usage, select on sequences to anon, authenticated, service_role;

-- Sicherheitsnetz: setzt Supabase die Standard-Freigaben am 30.10. zurück, bekommt jede neue Tabelle/Sicht/Sequenz in public
-- trotzdem die Freigabe für service_role (unsere Server-Funktionen). anon/authenticated bleiben bewusst Sache der ausdrücklichen Freigabe.
create or replace function kc_internal.kc_neue_objekte_freigeben() returns event_trigger
language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in select * from pg_event_trigger_ddl_commands() where schema_name = 'public' loop
    if r.object_type in ('table', 'view', 'materialized view', 'foreign table') then
      execute format('grant select, insert, update, delete on %s to service_role', r.object_identity);
    elsif r.object_type = 'sequence' then
      execute format('grant usage, select on sequence %s to service_role', r.object_identity);
    end if;
  end loop;
end $$;
drop event trigger if exists kc_neue_objekte_freigeben;
create event trigger kc_neue_objekte_freigeben on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'CREATE VIEW', 'CREATE MATERIALIZED VIEW', 'CREATE SEQUENCE', 'CREATE FOREIGN TABLE')
  execute function kc_internal.kc_neue_objekte_freigeben();
