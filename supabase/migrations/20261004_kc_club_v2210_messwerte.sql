-- KC Club-App – Version 2.21.0 (Wunsch Hansi): Admin-Register Stufe 2 – Verlauf für Linien-/Säulen-Grafiken
-- KC-CLUB-ADMIN-VERLAUF:
--   kc_club_messwerte: Messpunkte (nur Zahlen, keine Personen/Inhalte), 35 Tage aufbewahrt.
--   quelle 'db'  – alle 10 Min. direkt in der Datenbank (pg_cron, OHNE Datenschnittstelle/pg_net): Größe, Verbindungen,
--                  Hintergrund-Aufrufe der letzten 10 Min. ok/fehlgeschlagen (net._http_response). Läuft auch, wenn REST hängt
--                  (Störung 04.10.: genau diese Fehler wären sichtbar gewesen).
--   quelle 'api' – alle 15 Min. vom Club-Server im Wartungslauf (über die Datenschnittstelle): Antwortzeit der Datenbank.
--                  Fehlt dieser Punkt, während 'db' weiterläuft → Datenschnittstelle/Server gestört (rote Lücke).
--   Tabelle hat RLS ohne Richtlinien – nur der Server (service role) liest/schreibt.
--   Spiegel: bewusst nicht gespiegelt (laufend erzeugte Messwerte, wie kc_communication_health_snapshots) – Regel vorhanden,
--   damit die Abdeckung vollständig bleibt.
-- Rückweg: select cron.unschedule('kc-club-messung-10min'); drop function public.kc_club_messung_db(); drop table public.kc_club_messwerte;
--          delete from kc_db_mirror_table_rules where table_name = 'kc_club_messwerte';

create table if not exists public.kc_club_messwerte (
  id bigint generated always as identity primary key,
  zeit timestamptz not null default now(),
  quelle text not null check (quelle in ('db', 'api')),
  db_bytes bigint,
  verbindungen integer,
  net_ok integer,
  net_fehler integer,
  db_ms integer
);
create index if not exists kc_club_messwerte_zeit on public.kc_club_messwerte (zeit);
alter table public.kc_club_messwerte enable row level security;
revoke all on table public.kc_club_messwerte from anon, authenticated;

create or replace function public.kc_club_messung_db()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.kc_club_messwerte (quelle, db_bytes, verbindungen, net_ok, net_fehler)
  select 'db', pg_database_size(current_database()),
    (select count(*) from pg_stat_activity where datname = current_database()),
    (select count(*) from net._http_response where created > now() - interval '10 minutes' and status_code between 100 and 499),
    (select count(*) from net._http_response where created > now() - interval '10 minutes' and (coalesce(timed_out, false) or status_code is null or status_code >= 500));
  delete from public.kc_club_messwerte where zeit < now() - interval '35 days';
end $function$;
revoke all on function public.kc_club_messung_db() from public, anon, authenticated;
grant execute on function public.kc_club_messung_db() to service_role;

select cron.unschedule('kc-club-messung-10min') where exists (select 1 from cron.job where jobname = 'kc-club-messung-10min');
select cron.schedule('kc-club-messung-10min', '*/10 * * * *', 'select public.kc_club_messung_db()');

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_messwerte', 'Club-App', 'sensitive', false, false, false,
  'KC-CLUB-ADMIN-VERLAUF (2.21.0): bewusst nicht gespiegelt – laufend erzeugte Messwerte (Zahlen), 35 Tage aufbewahrt')
on conflict (table_name) do update set mirror_enabled = false, backup_enabled = false, note = excluded.note, updated_at = now();

select public.kc_club_messung_db();
