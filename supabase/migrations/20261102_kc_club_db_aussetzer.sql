-- KC-CLUB-DB-AUSSETZER (Wunsch Hansi 02.11.2026 „Ja bau beides ein“): kurze Aussetzer der Datenbank mitzählen.
-- Anlass: 02.11. 08:25–08:27 Uhr nahm die Datenbank keine Verbindungen an (alle Zeitpläne „job startup timeout“, App „Die Datenbank antwortet
-- gerade nicht“). Rückblick 30 Tage: rund 20 solcher Minuten, meist 1–2 Minuten lang.
-- Erfasst wird je Minute: wie viele Zeitpläne nicht starten konnten (cron.job_run_details, „job startup timeout“/Verbindung) und wie oft die App
-- „Die Datenbank antwortet gerade nicht“ bekam (kc_club_protokoll fehler_api, nur dieser feste Text – keine Inhalte). Ab 3 Zeitplänen oder
-- 1 App-Meldung zählt die Minute als Aussetzer. Läuft alle 30 Minuten (:07/:37, nicht in den vollen Minuten :00/:15/:25/:30), schaut 2 Std. zurück;
-- beim ersten Lauf 30 Tage. Anzeige: Admin → Verlauf. Aufbewahrung 90 Tage.
-- Rückweg: select cron.unschedule('kc-club-db-aussetzer'); drop table public.kc_club_db_aussetzer;

create table if not exists public.kc_club_db_aussetzer (
  minute timestamptz primary key,
  zeitplaene int not null default 0,
  app int not null default 0,
  erfasst_am timestamptz not null default now()
);
alter table public.kc_club_db_aussetzer enable row level security;
revoke all on public.kc_club_db_aussetzer from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_db_aussetzer to service_role;

create or replace function kc_internal.kc_club_db_aussetzer_erfassen(p_stunden int default 2)
returns int
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_ab timestamptz := now() - make_interval(hours => greatest(1, least(p_stunden, 24 * 30))); v_n int := 0;
begin
  with z as (
    select date_trunc('minute', d.start_time) as minute, count(*)::int as n
      from cron.job_run_details d
     where d.start_time >= v_ab and d.status = 'failed'
       and (d.return_message ilike '%startup timeout%' or d.return_message ilike '%could not connect%' or d.return_message ilike '%connection%')
     group by 1),
  a as (
    select date_trunc('minute', p.zeit) as minute, count(*)::int as n
      from public.kc_club_protokoll p
     where p.zeit >= v_ab and p.aktion = 'fehler_api' and p.details->>'text' like 'Die Datenbank antwortet gerade nicht%'
     group by 1),
  alle as (
    select coalesce(z.minute, a.minute) as minute, coalesce(z.n, 0) as zeitplaene, coalesce(a.n, 0) as app
      from z full join a on a.minute = z.minute),
  neu as (
    insert into public.kc_club_db_aussetzer(minute, zeitplaene, app)
    select minute, zeitplaene, app from alle where zeitplaene >= 3 or app >= 1
    on conflict (minute) do update set zeitplaene = greatest(kc_club_db_aussetzer.zeitplaene, excluded.zeitplaene),
      app = greatest(kc_club_db_aussetzer.app, excluded.app), erfasst_am = now()
    returning 1)
  select count(*) into v_n from neu;
  delete from public.kc_club_db_aussetzer where minute < now() - interval '90 days';
  return v_n;
end $function$;
revoke all on function kc_internal.kc_club_db_aussetzer_erfassen(int) from public;

select kc_internal.kc_club_db_aussetzer_erfassen(24 * 30); -- Rückblick 30 Tage
select cron.unschedule('kc-club-db-aussetzer') where exists (select 1 from cron.job where jobname = 'kc-club-db-aussetzer');
select cron.schedule('kc-club-db-aussetzer', '7,37 * * * *', 'select kc_internal.kc_club_db_aussetzer_erfassen()');
