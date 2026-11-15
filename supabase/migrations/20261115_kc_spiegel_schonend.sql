-- KC-SPIEGEL-SCHONEND (15.11.2026, Wunsch Hansi „App ist schon wieder langsam … setze 1 bis 3 um und spiele es ein – alles muss sicher bleiben
-- und mit den anderen Zeiten abgeglichen sein: Neon, Spiegelung, Backup usw.“).
-- Befund 15.11.: Die Supabase-Datenbank (kostenloser Tarif, kleiner Rechner) brach um 16:16 UTC mitten in der Spiegel-Welle ab und startete neu
-- („database system was interrupted“, 1,5 Min. weg, davor bis 9 s je Anfrage, dann „DB-Zeitgrenze 15000 ms“). Die langsamsten Viertelstunden
-- der letzten 24 h lagen beide in Spiegel-Wellen (10:15 und 16:15 UTC = 11:15 und 17:15 Uhr – die stärksten Stunden der App).
--
-- 1) Entzerren: 1 Paket je Minute statt 3 (kc_neon_low_compute_cycle c_je_welle 3 → 1), Welle :11–:40 statt :11–:22 (18 Pakete passen bequem).
-- 2) Andere Zeiten: Spiegelung 04, 13, 22 UTC (05, 14, 23 Uhr Winterzeit) statt 04, 10, 16, 22 – weg von 11 und 17 Uhr.
--    Abgleich der Zeiten (UTC): Neon-Nachtsicherung 00:40 · FRA-Sicherung 01–03 · Aufräumen 03:05–03:50 · Spiegel 04:10–04:40 ·
--    Backup-Prüfung 06:30 · Einspiel-Fenster 10:45–12:00 und 18:45–20:00 · Spiegel 13:10–13:40 · Spiegel 22:10–22:40 – nichts trifft aufeinander.
--    Frische-Fenster des Wächters rechnet kc_db_mirror_frischefenster() aus dem Zeitplan selbst: größter Abstand 9 h + 30 Min. = 570 Min.
--    Der externe GitHub-Wächter (kc_db_mirror_extern_plan) nutzt jetzt dasselbe Fenster statt fester 390 Min. – sonst stieße er mittags
--    zusätzliche Läufe an. Das Nachholen erkennt eine Welle jetzt in 60-Min.-Fenstern (die Welle dauert bis zu 30 Min.) und schaut 10 Std. zurück.
-- 3) Klüger prüfen: kc_db_mirror_stat_sig(tabelle) liefert eine billige Kennung aus der Datenbank-Statistik (Dateinummer + Einfüge/Änderungs/
--    Lösch-Zähler). Der Spiegel-Arbeiter überspringt die teure Prüfsumme nur, wenn diese Kennung seit der letzten echten Prüfsumme gleich ist,
--    diese höchstens 12 Std. alt ist und es nicht der Nachtlauf (04 UTC) ist – nachts wird immer voll geprüft. Nur service_role.
-- Keine neue Tabelle, keine Daten gelöscht. Rückweg: alter_job auf '10 4,10,16,22 * * *' / '11-22 4,10,16,22 * * *', c_je_welle wieder 3,
-- c_fenster wieder interval '390 minutes', Nachholen-Bins wieder 30 Min./7 Std.; die Funktion kc_db_mirror_stat_sig darf bleiben.

-- 3) billige Änderungs-Kennung je Tabelle (nur Zahlen, keine Inhalte)
create or replace function public.kc_db_mirror_stat_sig(p_table_name text)
returns text
language sql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
  select concat_ws(':', pg_relation_filenode(c.oid), s.n_tup_ins, s.n_tup_upd, s.n_tup_del)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'public'
    join pg_stat_user_tables s on s.relid = c.oid
   where c.relname = p_table_name and c.relkind in ('r', 'p')
     and exists (select 1 from public.kc_db_mirror_table_rules r where r.table_name = p_table_name and r.mirror_enabled)
$function$;
revoke all on function public.kc_db_mirror_stat_sig(text) from public, anon, authenticated;
grant execute on function public.kc_db_mirror_stat_sig(text) to service_role;

-- 1) Anstoß: 1 Paket je Minute
create or replace function public.kc_neon_low_compute_cycle()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
 v_until timestamptz; v_count int := 0; v_reqs jsonb := '[]'::jsonb; v_pakete jsonb; p jsonb; v_req bigint;
 v_jetzt timestamptz := now(); i int := 0; v_vorgemerkt int := 0;
 c_je_welle constant int := 1; -- KC-SPIEGEL-SCHONEND (15.11.2026): 1 statt 3 Pakete je Minute – die Datenbank behält Luft für die App
begin
 select maintenance_until into v_until from public.kc_neon_compute_policy where id='primary';
 if now()<coalesce(v_until,'infinity'::timestamptz) then
   return jsonb_build_object('status','maintenance','compute_opened',false,'until',v_until);
 end if;
 update kc_internal.kc_db_mirror_welle set verworfen = true where gesendet_at is null and not verworfen;
 v_pakete := public.kc_db_mirror_pakete_vorbereiten();
 for p in select value from jsonb_array_elements(v_pakete) loop
   v_req := null;
   if i < c_je_welle then
     v_req := public.kc_db_mirror_dispatch(array(select jsonb_array_elements_text(p)));
     v_reqs := v_reqs || to_jsonb(v_req);
   else
     v_vorgemerkt := v_vorgemerkt + 1;
   end if;
   -- KICC-F-111: auch die sofort geschickten Pakete (gesendet_at gesetzt), damit die Welle sie bei Serverfehler wiederholen kann
   insert into kc_internal.kc_db_mirror_welle(nr, zyklus, paket, faellig_ab, gesendet_at, request_id, verworfen, versuche)
   values (i, v_jetzt, array(select jsonb_array_elements_text(p)), v_jetzt + (i / c_je_welle) * interval '1 minute' - interval '10 seconds',
           case when v_req is null then null else now() end, v_req, false, 0)
   on conflict (nr) do update set zyklus = excluded.zyklus, paket = excluded.paket, faellig_ab = excluded.faellig_ab,
     gesendet_at = excluded.gesendet_at, request_id = excluded.request_id, verworfen = false, versuche = 0;
   v_count := v_count + jsonb_array_length(p);
   i := i + 1;
 end loop;
 if v_count=0 then return jsonb_build_object('status','nothing_to_mirror','compute_opened',false); end if;
 update public.kc_neon_compute_policy set mode='low_compute_active',updated_at=now() where id='primary';
 return jsonb_build_object('status','mirror_dispatched','compute_opened',true,'tables',v_count,'requests',v_reqs,'pakete',i,'vorgemerkt',v_vorgemerkt);
end $function$;
-- Rechte wie bisher (postgres für den Zeitplan, service_role) – ausdrücklich, damit nie public/anon/authenticated dazukommen
revoke all on function public.kc_neon_low_compute_cycle() from public, anon, authenticated;
grant execute on function public.kc_neon_low_compute_cycle() to service_role;

-- 1) Welle: höchstens 1 neues Paket je Minute (Wiederholungen nach Serverfehler wie bisher höchstens 2)
create or replace function kc_internal.kc_db_mirror_welle_senden()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
 w record; v_req bigint; v_reqs jsonb := '[]'::jsonb; v_wdh jsonb := '[]'::jsonb;
begin
 -- 1) KICC-F-111: Pakete mit Serverfehler, Zeitüberschreitung oder Netzfehler noch einmal schicken (je Paket höchstens 2-mal, je Minute 2)
 for w in
   select x.nr, x.paket, x.versuche, r.status_code from kc_internal.kc_db_mirror_welle x
     join net._http_response r on r.id = x.request_id
    where x.gesendet_at is not null and not x.verworfen and x.versuche < 2 and x.zyklus > now() - interval '1 hour'
      and (coalesce(r.status_code, 0) >= 500 or coalesce(r.timed_out, false) or r.error_msg is not null)
    order by x.nr limit 2 for update of x skip locked
 loop
   v_req := public.kc_db_mirror_dispatch(w.paket);
   update kc_internal.kc_db_mirror_welle set gesendet_at = now(), request_id = v_req, versuche = versuche + 1 where nr = w.nr;
   v_wdh := v_wdh || to_jsonb(w.nr);
   insert into public.kc_db_mirror_audit(severity, action, detail, metadata)
   values ('info', 'mirror_welle_wiederholt', format('Spiegel-Welle: Paket %s (%s Tabellen) kam mit Fehler %s zurück und wird noch einmal geschickt (Versuch %s).',
           w.nr, cardinality(w.paket), coalesce(w.status_code::text, 'ohne Antwort'), w.versuche + 2),
           jsonb_build_object('nr', w.nr, 'tabellen', to_jsonb(w.paket), 'status', w.status_code, 'request_id', v_req));
 end loop;
 -- 2) fällige Pakete schicken – KC-SPIEGEL-SCHONEND (15.11.2026): 1 statt 3 je Minute
 for w in
   select nr, paket from kc_internal.kc_db_mirror_welle
    where gesendet_at is null and not verworfen and faellig_ab <= now() and zyklus > now() - interval '1 hour'
    order by nr limit 1 for update skip locked
 loop
   v_req := public.kc_db_mirror_dispatch(w.paket);
   update kc_internal.kc_db_mirror_welle set gesendet_at = now(), request_id = v_req where nr = w.nr;
   v_reqs := v_reqs || to_jsonb(v_req);
 end loop;
 return jsonb_build_object('gesendet', jsonb_array_length(v_reqs), 'requests', v_reqs, 'wiederholt', v_wdh);
end $function$;

-- 2) externer Wächter: dasselbe Frische-Fenster wie der Wächter (aus dem Zeitplan berechnet) statt fester 390 Min.
create or replace function public.kc_db_mirror_extern_plan()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
 v_until timestamptz; v_letzter timestamptz; v_anstoss timestamptz; v_pakete jsonb; v_tabellen int := 0;
 c_fenster constant interval := kc_internal.kc_db_mirror_frischefenster(); -- KC-SPIEGEL-SCHONEND: bisher fest 390 Min.
 c_sperre constant interval := interval '60 minutes';
begin
 perform pg_advisory_xact_lock(hashtext('kc_db_mirror_extern_plan'));
 select maintenance_until into v_until from public.kc_neon_compute_policy where id='primary';
 if now()<coalesce(v_until,'infinity'::timestamptz) then
   return jsonb_build_object('status','wartung','bis',v_until);
 end if;
 select max(started_at) into v_letzter from public.kc_db_mirror_runs where run_type='snapshot';
 if v_letzter is not null and v_letzter > now() - c_fenster then
   return jsonb_build_object('status','frisch','letzter_lauf',v_letzter);
 end if;
 select max(started_at) into v_anstoss from public.kc_db_mirror_runs where run_type='extern_anstoss';
 if v_anstoss is not null and v_anstoss > now() - c_sperre then
   return jsonb_build_object('status','schon_angestossen','letzter_lauf',v_letzter,'angestossen_um',v_anstoss);
 end if;
 v_pakete := public.kc_db_mirror_pakete_vorbereiten();
 select coalesce(sum(jsonb_array_length(value)),0) into v_tabellen from jsonb_array_elements(v_pakete);
 if v_tabellen = 0 then
   return jsonb_build_object('status','nichts_zu_spiegeln','letzter_lauf',v_letzter);
 end if;
 insert into public.kc_db_mirror_runs(run_type,status,started_at,finished_at,source_rows,target_rows,mismatch_count,message,metrics)
 values ('extern_anstoss','ok',now(),now(),v_tabellen,0,0,
   format('Spiegel von außen angestoßen (GitHub-Wächter): letzter Lauf %s, %s Tabellen in %s Paketen',
     coalesce(to_char(v_letzter at time zone 'Europe/Berlin','DD.MM. HH24:MI'),'unbekannt'), v_tabellen, jsonb_array_length(v_pakete)),
   jsonb_build_object('quelle','github','letzter_lauf',v_letzter,'tabellen',v_tabellen,'pakete',jsonb_array_length(v_pakete)));
 update public.kc_neon_compute_policy set mode='low_compute_active',updated_at=now() where id='primary';
 return jsonb_build_object('status','angestossen','letzter_lauf',v_letzter,'tabellen',v_tabellen,'pakete',v_pakete);
end $function$;
revoke all on function public.kc_db_mirror_extern_plan() from public, anon, authenticated;
grant execute on function public.kc_db_mirror_extern_plan() to service_role;

-- 2) Nachholen: Welle dauert jetzt bis zu 30 Min. → 60-Min.-Fenster, 10 Std. zurück (größter Abstand 9 Std.)
create or replace function kc_internal.kc_db_mirror_nachholen()
 returns integer
 language plpgsql
 security definer
 set search_path to 'pg_catalog', 'public', 'kc_internal'
as $function$
declare
  v_zyklus timestamptz;
  v_tabellen text[];
begin
  -- Beginn des jüngsten REGULÄREN Laufs = jüngste „Welle“ (60-Min.-Fenster) mit mindestens der Hälfte aller Tabellen (mind. 20).
  -- Einzelne Nachstöße (Admin-Knopf, dieses Nachholen) zählen NICHT als Lauf – sonst sähe alles andere „verpasst“ aus (Trockenprobe 13.10.).
  select min(x.started_at) into v_zyklus
  from public.kc_db_mirror_runs x,
       (select max(w.w) as w from (select date_bin('60 minutes', started_at, timestamptz '2000-01-01') as w, count(*) as n
                                     from public.kc_db_mirror_runs where run_type = 'snapshot' and started_at > now() - interval '10 hours' group by 1) w
         where w.n >= greatest(20, (select count(*) from public.kc_db_mirror_table_rules where mirror_enabled) / 2)) welle
  where x.run_type = 'snapshot' and x.started_at >= welle.w and x.started_at < welle.w + interval '60 minutes';
  if v_zyklus is null or v_zyklus > now() - interval '40 minutes' then return 0; end if; -- Welle läuft bis :40 – erst danach nachholen

  select coalesce(array_agg(t.table_name order by t.table_name), '{}') into v_tabellen
  from (
    select r.table_name
    from public.kc_db_mirror_table_rules r
    left join lateral (
      select max(finished_at) as ok_am from public.kc_db_mirror_runs x
       where x.run_type = 'snapshot' and x.status = 'ok' and coalesce(x.mismatch_count, 0) = 0 and x.metrics->>'table' = r.table_name
         and x.started_at > now() - interval '14 days'
    ) s on true
    where r.mirror_enabled
      and r.updated_at < v_zyklus                                   -- neue Tabellen nimmt weiter die automatische Aufnahme
      and (s.ok_am is null or s.ok_am < v_zyklus - interval '5 minutes')
      and (select count(*) from public.kc_db_mirror_audit a
            where a.action = 'mirror_nachholen' and a.happened_at > now() - interval '6 hours'
              and a.metadata->'tabellen' ? r.table_name) < 2
    order by s.ok_am nulls first
    limit 10
  ) t;

  if cardinality(v_tabellen) = 0 then return 0; end if;
  perform public.kc_db_mirror_dispatch(v_tabellen);
  insert into public.kc_db_mirror_audit(severity, action, detail, metadata)
  values ('info', 'mirror_nachholen', format('Spiegel-Nachholen: %s Tabelle(n) haben den Lauf um %s verpasst und werden nachgeholt: %s',
          cardinality(v_tabellen), to_char(v_zyklus at time zone 'Europe/Berlin', 'DD.MM. HH24:MI'), array_to_string(v_tabellen, ', ')),
          jsonb_build_object('tabellen', to_jsonb(v_tabellen), 'zyklus', v_zyklus));
  return cardinality(v_tabellen);
end $function$;

-- 2) Zeitpläne verlegen (Anstoß :10, Welle :11–:40 derselben Stunden)
select cron.alter_job(j.jobid, schedule => '10 4,13,22 * * *') from cron.job j where j.jobname = 'kc-neon-low-compute-cycle';
select cron.alter_job(j.jobid, schedule => '11-40 4,13,22 * * *') from cron.job j where j.jobname = 'kc-db-mirror-welle';
