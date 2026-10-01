-- KC Club-App – Version 1.14.0
-- KC-CLUB-SICHERHEIT (Wunsch Hansi 01.10.2026): „Sicherheits-Check“ für Mitglieder im Reiter Programme. Liefert nur
-- Ja/Nein-Werte und Zeitabstände (Minuten) – keine Tabellen-, Datenbank- oder Anbieternamen. Quelle sind die echten
-- Läufe der Spiegel-/Sicherungs-Überwachung (kc_db_mirror_runs) und der Zugriffsschutz (RLS) aller Tabellen.
-- Regel 11: Was fehlt (null), zeigt die App als „nicht geprüft“, nie als OK. Nur der Server (service_role) darf aufrufen.
-- Rückweg: drop function public.kc_club_sicherheit_status();

create or replace function public.kc_club_sicherheit_status()
returns jsonb
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  with lauf as (
    select run_type, status, finished_at from public.kc_db_mirror_runs where started_at > now() - interval '14 days'
  ), zuletzt as (
    select
      (select max(finished_at) from lauf where run_type = 'snapshot' and status = 'ok') spiegel,
      (select max(finished_at) from lauf where run_type = 'backup' and status = 'ok') sicherung,
      (select max(finished_at) from lauf where run_type = 'restore_test' and status = 'ok') wiederherstellung,
      (select max(finished_at) from lauf where run_type = 'restore_test' and status <> 'ok') wiederherstellung_fehler,
      (select max(finished_at) from lauf where run_type = 'watchdog') ueberwachung
  )
  select jsonb_build_object(
    'tabellen', (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r', 'p')),
    'ohne_schutz', (select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity),
    'spiegel_min', (select round(extract(epoch from now() - spiegel) / 60) from zuletzt),
    'sicherung_min', (select round(extract(epoch from now() - sicherung) / 60) from zuletzt),
    'sicherung_am', (select sicherung from zuletzt),
    'wiederherstellung_min', (select round(extract(epoch from now() - wiederherstellung) / 60) from zuletzt),
    'wiederherstellung_fehler_danach', (select coalesce(wiederherstellung_fehler > wiederherstellung, wiederherstellung is null and wiederherstellung_fehler is not null) from zuletzt),
    'ueberwachung_min', (select round(extract(epoch from now() - ueberwachung) / 60) from zuletzt)
  );
$function$;
revoke all on function public.kc_club_sicherheit_status() from public, anon, authenticated;
grant execute on function public.kc_club_sicherheit_status() to service_role;
