-- KC Club-App – Version 1.33.0 (Wunsch Hansi 02.10.2026: Tages-Übersicht beim Start für Admin/Clubleitung/Kassenwart)
-- KC-CLUB-TAGESINFO: Größe der Datenbank für die Ampel „Datenbank belegt“ (nur service_role, nur lesend).
-- Rückweg: drop function public.kc_club_db_groesse();
create or replace function public.kc_club_db_groesse()
returns bigint
language sql
stable
security definer
set search_path to 'pg_catalog'
as $function$ select pg_database_size(current_database()); $function$;
revoke all on function public.kc_club_db_groesse() from public, anon, authenticated;
grant execute on function public.kc_club_db_groesse() to service_role;
