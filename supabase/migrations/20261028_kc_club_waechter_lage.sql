-- KC-CLUB-WAECHTER (28.10.2026, Wunsch Hansi „Admin-Kachel Wächter: alle Wächter mit den wichtigsten Infos, antippen = ausführlich“):
-- EINE Lese-Funktion für die Wächter-Übersicht. Nur lesen, keine Tabelle, nur für den Club-Server (service_role).
-- Quellen: cron.job + cron.job_run_details (ein Durchlauf über die letzten 24 Std.), kc_db_mirror_runs, kc_traffic_guard_samples,
-- kc_club_messwerte, kc_club_zugang (App-Versionen). Keine Supabase-Protokolle.
create or replace function public.kc_club_waechter_lage()
 returns jsonb
 language sql
 stable security definer
 set search_path to 'pg_catalog', 'public', 'cron', 'kc_internal'
as $function$
with jobs as (
  select j.jobid, j.jobname, j.schedule, j.active from cron.job j
  where j.jobname = any (array['kc-db-mirror-watchdog','kc-db-mirror-source-health','kc-neon-backup-verify','kc-traffic-guard-15m',
    'kc-live-operations-watch-minute','kc-system-check-auto-15m','kicc-access-watch-minute','kc-club-messung-30min','kc-club-db-last-30min'])
), laeufe as (
  select d.jobid, d.status, d.start_time, d.end_time, d.return_message,
         row_number() over (partition by d.jobid order by d.start_time desc) as nr
  from cron.job_run_details d join jobs using (jobid)
  where d.start_time > now() - interval '26 hours'
)
select jsonb_build_object(
  'jetzt', now(),
  'jobs', coalesce((select jsonb_object_agg(j.jobname, jsonb_build_object(
      'plan', j.schedule, 'aktiv', j.active,
      'letzt', l.start_time, 'dauer_ms', round(extract(epoch from (l.end_time - l.start_time)) * 1000), 'status', l.status, 'msg', left(l.return_message, 200),
      'ok24', (select count(*) from laeufe x where x.jobid = j.jobid and x.status = 'succeeded' and x.start_time > now() - interval '24 hours'),
      'fehler24', (select count(*) from laeufe x where x.jobid = j.jobid and x.status not in ('succeeded', 'running', 'starting') and x.start_time > now() - interval '24 hours'),
      'verlauf', (select coalesce(string_agg(case when x.status = 'succeeded' then '1' when x.status in ('running', 'starting') then '2' else '0' end, '' order by x.start_time), '')
                  from laeufe x where x.jobid = j.jobid and x.nr <= 48)))
    from jobs j left join laeufe l on l.jobid = j.jobid and l.nr = 1), '{}'::jsonb),
  'spiegel', coalesce((select jsonb_object_agg(x.run_type, jsonb_build_object('status', x.status, 'zeit', x.started_at, 'msg', left(x.message, 220), 'abweichung', x.mismatch_count))
    from (select distinct on (r.run_type) r.run_type, r.status, r.started_at, r.message, r.mismatch_count from public.kc_db_mirror_runs r
          where r.run_type in ('watchdog', 'source_health', 'coverage', 'backup', 'restore_test', 'snapshot') and r.started_at > now() - interval '8 days'
          order by r.run_type, r.started_at desc) x), '{}'::jsonb),
  'spiegel_fehler24', (select count(*) from public.kc_db_mirror_runs r where r.started_at > now() - interval '24 hours' and (r.status <> 'ok' or coalesce(r.mismatch_count, 0) > 0)),
  'last', (select jsonb_build_object('zeit', t.measured_at, 'stufe', t.level, 'abfragen', t.calls_15m, 'ueblich', round(t.baseline_15m), 'ursache', t.ursache ->> 'text')
           from public.kc_traffic_guard_samples t order by t.measured_at desc limit 1),
  'last_warn24', (select count(*) from public.kc_traffic_guard_samples t where t.measured_at > now() - interval '24 hours' and t.level <> 'normal'),
  'mess', jsonb_build_object(
     'api', (select jsonb_build_object('zeit', m.zeit, 'db_ms', m.db_ms) from public.kc_club_messwerte m where m.quelle = 'api' order by m.zeit desc limit 1),
     'db', (select jsonb_build_object('zeit', m.zeit, 'verbindungen', m.verbindungen, 'net_ok', m.net_ok, 'net_fehler', m.net_fehler, 'bytes', m.db_bytes) from public.kc_club_messwerte m where m.quelle = 'db' order by m.zeit desc limit 1)),
  'versionen', (select coalesce(jsonb_object_agg(v.app_version, v.n), '{}'::jsonb) from (select coalesce(z.app_version, '?') as app_version, count(*) as n
     from public.kc_club_zugang z where z.aktiv and z.zuletzt_gesehen > now() - interval '7 days' group by 1) v)
);
$function$;
revoke all on function public.kc_club_waechter_lage() from public, anon, authenticated;
grant execute on function public.kc_club_waechter_lage() to service_role;
