-- KC-CLUB-DB-LAST (2.389.0, Wunsch Hansi „Balkengrafik im Admin unter Supabase: Datenbank-Abfragen mit Wochentag und Uhrzeit und woher sie kommen“):
-- Alle 10 Minuten wird aus pg_stat_statements (zählt nur hoch, ohne Zeitstempel) der ZUWACHS seit der letzten Messung berechnet und je Quelle
-- abgelegt (Aufrufe + Rechenzeit). Quelle = Programm, erkannt am Namen der Tabelle/Funktion (Registry in kc_club_db_last_quelle).
-- Reine Verwaltungsbefehle (BEGIN, COMMIT, SET …) zählen nicht. 35 Tage aufbewahrt. Nur der Server liest (RLS an, keine Rechte für Nutzer).
-- Rückweg: cron.unschedule('kc-club-db-last-10min'); drop function kc_club_db_last_messen(), kc_club_db_last_bericht(int), kc_club_db_last_quelle(text,text);
-- drop table kc_club_db_last, kc_club_db_last_stand.
create table if not exists public.kc_club_db_last (zeit timestamptz not null, quelle text not null, aufrufe bigint not null, ms bigint not null, primary key (zeit, quelle));
create table if not exists public.kc_club_db_last_stand (queryid bigint not null, userid oid not null, calls bigint not null, ms double precision not null, primary key (queryid, userid));
alter table public.kc_club_db_last enable row level security;
alter table public.kc_club_db_last_stand enable row level security;
revoke all on public.kc_club_db_last, public.kc_club_db_last_stand from anon, authenticated;
grant select, insert, update, delete on public.kc_club_db_last to service_role;
grant select, insert, update, delete on public.kc_club_db_last_stand to service_role;

create or replace function public.kc_club_db_last_quelle(q text, rolle text) returns text language sql immutable set search_path = '' as $$
  select case
    when q ~* '^\s*(begin|commit|rollback|set |reset |discard|show |select set_config|deallocate|savepoint|release)' then null
    when rolle = 'supabase_auth_admin' then 'Anmeldung (Supabase)'
    when q ~* 'kc_club_' then 'Club-App'
    when q ~* 'kc_dp_' then 'Dienstplan DP2'
    when q ~* 'kc_manager_|kc_core_' then 'Verwaltung / PC-Manager'
    when q ~* 'kc_finance_|kc_pos|kc_kasse|kc_inventory|kc_money' then 'Kasse / Money Butler'
    when q ~* 'kc_communication_|kc_member_push|kc_wm_' then 'Kommunikation (Push/Mail)'
    when q ~* 'kc_db_mirror|kc_db_backup|kc_backup|kc_neon' then 'Spiegel / Sicherung'
    when q ~* 'kc_system_check|kicc_|kc_access_watch|kc_live|kc_check|kc_lebenszeichen|kc_cron' then 'Überwachung'
    when q ~* 'kc_termin' then 'Termine / Kalender'
    when q ~* '(^|[^a-z_])(cron|net)\.' then 'Zeitpläne (Cron)'
    when q ~* 'realtime\.' then 'Realtime'
    when rolle in ('supabase_admin', 'supabase_storage_admin', 'supabase_replication_admin', 'pgbouncer', 'authenticator') or q ~* 'pg_catalog|pg_timezone|information_schema|storage\.' then 'Supabase intern'
    else 'Sonstiges' end
$$;

create or replace function public.kc_club_db_last_messen() returns void language plpgsql security definer set search_path = public, extensions, pg_catalog as $$
declare v_erst boolean := not exists (select 1 from public.kc_club_db_last_stand); v_zeit timestamptz := date_trunc('minute', now());
begin
  drop table if exists _jetzt;
  create temp table _jetzt on commit drop as
    select s.queryid, s.userid, sum(s.calls)::bigint calls, sum(s.total_exec_time) ms, min(s.query) query, min(r.rolname) rolle
      from extensions.pg_stat_statements s left join pg_roles r on r.oid = s.userid
     where s.dbid = (select oid from pg_database where datname = current_database()) and s.queryid is not null
     group by s.queryid, s.userid;
  if not v_erst then
    insert into public.kc_club_db_last (zeit, quelle, aufrufe, ms)
    select v_zeit, quelle, sum(d_calls), round(sum(d_ms))::bigint from (
      select public.kc_club_db_last_quelle(j.query, j.rolle) quelle,
             case when st.calls is null or j.calls < st.calls then j.calls else j.calls - st.calls end d_calls,
             case when st.calls is null or j.calls < st.calls then j.ms else greatest(0, j.ms - st.ms) end d_ms
        from _jetzt j left join public.kc_club_db_last_stand st on st.queryid = j.queryid and st.userid = j.userid) x
     where quelle is not null and d_calls > 0 group by quelle
    on conflict (zeit, quelle) do update set aufrufe = excluded.aufrufe, ms = excluded.ms;
  end if;
  delete from public.kc_club_db_last_stand;
  insert into public.kc_club_db_last_stand (queryid, userid, calls, ms) select queryid, userid, calls, ms from _jetzt;
  delete from public.kc_club_db_last where zeit < now() - interval '35 days';
end $$;

-- Bericht für den Admin: je Stunde (Ortszeit) und Quelle, die letzten p_tage Tage
create or replace function public.kc_club_db_last_bericht(p_tage int default 7) returns jsonb language sql stable security definer set search_path = public, pg_catalog as $$
  select coalesce(jsonb_agg(jsonb_build_object('h', h, 'q', quelle, 'n', n, 'ms', ms) order by h, quelle), '[]'::jsonb) from (
    select to_char(date_trunc('hour', zeit at time zone 'Europe/Berlin'), 'YYYY-MM-DD"T"HH24') h, quelle, sum(aufrufe) n, sum(ms) ms
      from public.kc_club_db_last where zeit > now() - make_interval(days => least(greatest(coalesce(p_tage, 7), 1), 35))
     group by 1, 2) x
$$;
revoke all on function public.kc_club_db_last_messen(), public.kc_club_db_last_bericht(int), public.kc_club_db_last_quelle(text, text) from public, anon, authenticated;
grant execute on function public.kc_club_db_last_messen(), public.kc_club_db_last_bericht(int) to service_role;

select cron.unschedule('kc-club-db-last-10min') where exists (select 1 from cron.job where jobname = 'kc-club-db-last-10min');
select cron.schedule('kc-club-db-last-10min', '*/10 * * * *', 'select public.kc_club_db_last_messen()');
