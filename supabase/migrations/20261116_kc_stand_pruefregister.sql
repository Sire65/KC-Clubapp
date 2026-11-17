-- KC-STAND-PRUEFREGISTER (16.11.2026, Freigabe Hansi „Ja mach das“): Datenleck-Wächter ROT seit 16.11. 10:19 UTC und System Check GELB
-- („11 SECURITY-DEFINER-Ausführungsrecht(e)“) – Ursache: die Stand-Brücke (Migrationen kc_stand_bruecke / kc_stand_bruecke_rechte vom 16.11.,
-- Kassen am Weihnachtsmarkt-Stand melden an den Server) wurde ohne Eintrag im Prüfregister angelegt (Regel KC-SECURITY-DEFINER-REGISTER).
-- Geprüft 16.11.2026 (nur Funktionscode und Rechte, keine Daten):
--   • kc_stand_melden, kc_stand_auftrag_erledigt (anon + authenticated): rufen zuerst kc_stand__pruefe auf – Stand-ID + 256-Bit-Geheimnis
--     (gen_random_bytes(32), gespeichert nur als SHA-256), nur aktive Stände; schreiben nur in den eigenen Stand; Größen begrenzt.
--   • kc_stand_anlegen/_liste/_abmelden/_auftrag/_auftrag_anlegen/_spiegel/_ereignisse (authenticated): verlangen über kc_stand__admin_org
--     auth.uid() (nicht anonym) und eine aktive Manager-Mitgliedschaft admin/superadmin; nur Stände der eigenen Organisation; Pfade per Positivliste.
--   • Tabellen kc_stand, kc_stand_spiegel, kc_stand_auftrag, kc_stand_ereignis: RLS an, keine Policies, kein Direktzugriff.
-- 1) Einträge im Prüfregister (wiederholbar). 2) Der Datenleck-Wächter liest geprüfte anon-Ausnahmen künftig aus dem Prüfregister,
--    statt eine eigene Liste zu führen (die bisherige Liste bleibt zusätzlich bestehen). Rückweg: Funktion aus 20261029_kc_club_haendlerausweise.sql.
insert into public.kc_security_reviewed_exceptions (object_schema, object_name, object_type, finding_code, decision, reason, reviewed_at, review_after, active)
select 'public', v.name, 'function', v.code, 'accepted_required', 'KC-STAND-PRUEFREGISTER 16.11.2026: ' || v.grund, now(), now() + interval '6 months', true
  from (values
    ('kc_stand_melden', 'security_definer_anon_execute', 'Kasse am Stand meldet ohne Anmeldung; erst kc_stand__pruefe (Stand-ID + 256-Bit-Geheimnis, SHA-256-Vergleich, nur aktive Stände), schreibt nur in den eigenen Stand, Größen begrenzt, Spiegel-Pfade per Positivliste.'),
    ('kc_stand_melden', 'security_definer_authenticated_execute', 'wie anon: erst kc_stand__pruefe (Stand-ID + 256-Bit-Geheimnis).'),
    ('kc_stand_auftrag_erledigt', 'security_definer_anon_execute', 'Kasse am Stand quittiert Aufträge; erst kc_stand__pruefe (Stand-ID + 256-Bit-Geheimnis), nur Aufträge des eigenen Stands, Antwort ≤ 1 MB.'),
    ('kc_stand_auftrag_erledigt', 'security_definer_authenticated_execute', 'wie anon: erst kc_stand__pruefe (Stand-ID + 256-Bit-Geheimnis).'),
    ('kc_stand_anlegen', 'security_definer_authenticated_execute', 'kc_stand__admin_org: auth.uid(), nicht anonym, aktive Manager-Rolle admin/superadmin; Geheimnis nur einmal zurückgegeben.'),
    ('kc_stand_liste', 'security_definer_authenticated_execute', 'kc_stand__admin_org (Admin der Organisation); nur Stände der eigenen Organisation, ohne Geheimnis.'),
    ('kc_stand_abmelden', 'security_definer_authenticated_execute', 'kc_stand__admin_org; nur Stände der eigenen Organisation.'),
    ('kc_stand_auftrag', 'security_definer_authenticated_execute', 'kc_stand__admin_org; nur Aufträge von Ständen der eigenen Organisation.'),
    ('kc_stand_auftrag_anlegen', 'security_definer_authenticated_execute', 'kc_stand__admin_org; nur eigene Organisation, Pfade per Positivliste, ≤ 8 MB.'),
    ('kc_stand_spiegel', 'security_definer_authenticated_execute', 'kc_stand__admin_org; nur Stände der eigenen Organisation.'),
    ('kc_stand_ereignisse', 'security_definer_authenticated_execute', 'kc_stand__admin_org; nur Stände der eigenen Organisation, höchstens 500 Einträge.')
  ) as v(name, code, grund)
 where exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = v.name)
   and not exists (select 1 from public.kc_security_reviewed_exceptions r
                    where r.object_schema = 'public' and r.object_name = v.name and r.finding_code = v.code and r.active);

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
     from public.kc_club_zugang z where z.aktiv and z.zuletzt_gesehen > now() - interval '7 days' group by 1) v),
  -- gerade offen (letzte 30 Min.): hat hier jemand noch eine alte Version, hat seine App das Update nicht geholt
  'versionen_jetzt', (select coalesce(jsonb_object_agg(v.app_version, v.n), '{}'::jsonb) from (select coalesce(z.app_version, '?') as app_version, count(*) as n
     from public.kc_club_zugang z where z.aktiv and z.zuletzt_gesehen > now() - interval '30 minutes' group by 1) v),
  -- KC-CLUB-SICHERHEIT-WAECHTER: nur Zählungen (24 Std. / 7 Tage) aus dem eigenen Protokoll und dem Fremdzugriff-Protokoll
  'sicherheit', (select jsonb_build_object(
     'ereignisse', (select coalesce(jsonb_object_agg(e.aktion, jsonb_build_object('n24', e.n24, 'n7', e.n7, 'wer24', e.wer24)), '{}'::jsonb) from (
         select k.aktion, count(*) filter (where k.zeit > now() - interval '24 hours') as n24, count(*) as n7,
                count(distinct k.person_id) filter (where k.zeit > now() - interval '24 hours') as wer24
         from public.kc_club_protokoll k
         where k.zeit > now() - interval '7 days' and k.aktion in ('sicherheit_viel', 'sicherheit_unbekannt', 'sicherheit_absaug', 'sicherheit_bremse', 'sicherheit_link',
           'sicherheit_neues_geraet', 'sicherheit_geraet_fremd', 'sicherheit_geraet_bestaetigt', 'gesperrt_versuch')
         group by k.aktion) e),
     'fremd', (select jsonb_build_object('n24', count(*) filter (where f.zeit > now() - interval '24 hours'), 'n7', count(*),
         'n15', count(*) filter (where f.zeit > now() - interval '15 minutes'), 'programm24', count(*) filter (where f.zeit > now() - interval '24 hours' and f.geraet like 'Programm%'),
         'zuletzt', max(f.zeit)) from public.kc_club_fremdzugriff f where f.zeit > now() - interval '7 days'),
     'gebremst', (select coalesce(jsonb_agg(jsonb_build_object('person_id', k.person_id, 'bis', k.details ->> 'bis', 'aktion', k.details ->> 'aktion')), '[]'::jsonb)
        from public.kc_club_protokoll k where k.aktion = 'sicherheit_bremse' and k.zeit > now() - interval '60 minutes'
          and not exists (select 1 from public.kc_club_protokoll fr where fr.aktion = 'sicherheit_bremse_frei' and fr.zeit > k.zeit and fr.details ->> 'person' = k.person_id)),
     'fragen_offen', (select count(*) from public.kc_club_person_einstellung pe where pe.schluessel = 'sicherheit_geraete' and pe.wert -> 'frage' is not null and jsonb_typeof(pe.wert -> 'frage') = 'object'))),
  -- KC-CLUB-SICHERHEIT-WAECHTER (Datenleck): was gegenüber dem geprüften Stand vom 28.10.2026 NEU offen wäre
  'leck', jsonb_build_object(
     'ohne_rls', (select coalesce(jsonb_agg(c.relname order by c.relname), '[]'::jsonb) from pg_class c join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity),
     'weit_offen', (select coalesce(jsonb_agg(pp.tablename || ' · ' || pp.policyname order by 1), '[]'::jsonb) from pg_policies pp
        where pp.schemaname in ('public', 'storage') and pp.roles && array['anon', 'public', 'authenticated']::name[]
          and (btrim(coalesce(pp.qual, '')) = 'true' or btrim(coalesce(pp.with_check, '')) = 'true')),
     'club_direkt', (select coalesce(jsonb_agg(distinct pp.tablename), '[]'::jsonb) from pg_policies pp
        where pp.schemaname = 'public' and pp.tablename like 'kc\_club\_%' and pp.tablename <> 'kc_club_haendlerausweise' and pp.roles && array['anon', 'public', 'authenticated']::name[]
          and coalesce(btrim(pp.qual), '') not in ('false', '') ),
     'speicher_oeffentlich', (select coalesce(jsonb_agg(b.name), '[]'::jsonb) from storage.buckets b where b.public),
     'funktionen_offen', (select coalesce(jsonb_agg(pr.proname order by pr.proname), '[]'::jsonb) from pg_proc pr join pg_namespace n on n.oid = pr.pronamespace
        where n.nspname = 'public' and pr.prosecdef and has_function_privilege('anon', pr.oid, 'execute')
          and pr.proname <> all (array['kc_communication_push_erneuern', 'kc_dp_report_error', 'kc_wm_danke_mail_erledigt', 'kc_wm_danke_mail_offen',
                                      'kc_wm_spruch_liste', 'kc_wm_spruch_waehlen', 'kc_wm_umfrage_absenden'])
          -- KC-STAND-PRUEFREGISTER (16.11.2026): geprüfte Ausnahmen aus dem Prüfregister zählen nicht als Lücke (eine Stelle für alle Programme)
          and not exists (select 1 from public.kc_security_reviewed_exceptions r where r.object_schema = 'public' and r.object_name = pr.proname
                            and r.finding_code = 'security_definer_anon_execute' and r.decision = 'accepted_required' and r.active
                            and (r.review_after is null or r.review_after > now()))))
);
$function$;
revoke all on function public.kc_club_waechter_lage() from public, anon, authenticated;
grant execute on function public.kc_club_waechter_lage() to service_role;
