-- KC Club-App – Version 0.47.0
-- KC-CLUB-ADMINLAGE: aktuelle Datenbankgröße für die Admin-Kommandozentrale (nur Server/Service-Rolle).
-- Ergänzt den täglichen KC-System-Check (kc_core_system_health) um einen Live-Wert.
create or replace function kc_club_db_groesse() returns bigint
language sql stable security definer set search_path = public, pg_catalog
as $$ select pg_database_size(current_database()) $$;
revoke all on function kc_club_db_groesse() from public, anon, authenticated;
grant execute on function kc_club_db_groesse() to service_role;
