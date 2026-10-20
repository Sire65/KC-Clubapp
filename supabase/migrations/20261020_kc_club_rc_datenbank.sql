-- KC-CLUB-RC-DATENBANK (RC 20.10.2026, Freigabe Hansi „1 bis 4“): Ergebnis der RC-Prüfung – Rechte enger, weniger Schreiblast, Eltern-Tabelle im Spiegel.
-- Keine Funktion wird abgeschaltet oder gedrosselt. Rückweg je Abschnitt unten.

-- 1) Rechte: TRUNCATE/TRIGGER/REFERENCES braucht weder die App (PostgREST nutzt sie nie) noch sonst jemand.
--    TRUNCATE umgeht RLS – deshalb für anon/authenticated auf allen public-Tabellen weg, auch für künftige Tabellen.
--    Rückweg: grant truncate, trigger, references on all tables in schema public to anon, authenticated;
--    Je Tabelle höchstens 3 s auf eine Sperre warten (laufende Spiegel-Läufe); gesperrte Tabellen werden übersprungen und gemeldet –
--    ein zweiter Lauf erledigt den Rest (die Migration ist wiederholbar).
do $$ declare t record; v_ok int := 0; v_weg text[] := '{}'; begin
  perform set_config('lock_timeout', '3s', true);
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r', 'p')
             and (has_table_privilege('anon', c.oid, 'TRUNCATE') or has_table_privilege('authenticated', c.oid, 'TRUNCATE')
                  or has_table_privilege('anon', c.oid, 'TRIGGER') or has_table_privilege('authenticated', c.oid, 'TRIGGER')) loop
    begin
      execute format('revoke truncate, trigger, references on table public.%I from anon, authenticated', t.relname);
      v_ok := v_ok + 1;
    exception when lock_not_available then v_weg := v_weg || t.relname;
    end;
  end loop;
  raise notice 'KC-CLUB-RC-DATENBANK: % Tabellen eingeschränkt, übersprungen (Sperre): %', v_ok, v_weg;
end $$;
alter default privileges in schema public revoke truncate, trigger, references on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke truncate, trigger, references on tables from anon, authenticated;

-- 2) Schreibende Verwaltungs-Funktionen nicht ohne Anmeldung ausführbar (sie laufen als INVOKER, RLS greift ohnehin – hier zusätzlich zu).
--    Lesende (system_version, is_permanent_user, inventory_recent …) bleiben unverändert. Rückweg: grant execute … to anon;
revoke execute on function public.kc_manager_create_inventory_event(text, text, text, text, date, text) from anon;
revoke execute on function public.kc_manager_inventory_save_count(jsonb) from anon;
revoke execute on function public.kc_manager_inventory_save_disposition(jsonb) from anon;
revoke execute on function public.kc_manager_save_article_supplier_link(jsonb) from anon;
revoke execute on function public.kc_manager_save_recipe(jsonb, jsonb) from anon;
revoke execute on function public.kc_manager_upsert_inventory_count(uuid, uuid, text, text, text, numeric, text, numeric, text, numeric, numeric, numeric, text, date, text, text, text) from anon;
revoke execute on function public.kc_core_takt_setzen(text, text) from anon;

-- 3) Lastmessung: der Zwischenstand von pg_stat_statements wurde alle 10 Min. ganz gelöscht und neu geschrieben (3,7 Mio. Zeilen in 7 Tagen).
--    Jetzt nur noch geänderte Zeilen schreiben und verschwundene löschen – Messwerte in kc_club_db_last bleiben genau gleich.
create or replace function public.kc_club_db_last_messen()
 returns void
 language plpgsql
 security definer
 set search_path to 'public', 'extensions', 'pg_catalog'
as $function$
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
  -- KC-CLUB-RC-DATENBANK: nur Unterschiede schreiben (vorher: alles löschen + alles neu einfügen)
  delete from public.kc_club_db_last_stand st where not exists (select 1 from _jetzt j where j.queryid = st.queryid and j.userid = st.userid);
  insert into public.kc_club_db_last_stand as st (queryid, userid, calls, ms) select queryid, userid, calls, ms from _jetzt
    on conflict (queryid, userid) do update set calls = excluded.calls, ms = excluded.ms where st.calls is distinct from excluded.calls;
  delete from public.kc_club_db_last where zeit < now() - interval '35 days';
end $function$;

-- 4) Frankfurt-Sicherung: der Zeitplaner rief kc-club 90-mal je Nacht (1–3 Uhr alle 2 Min.), obwohl der Lauf gegen 1:30 fertig ist.
--    Jetzt nur, solange der Lauf des Tages (deutsche Zeit) noch nicht „ok“ ist – bei Fehler wird wie bisher weiter versucht.
--    Rückweg: alten Befehl ohne „where not exists …“ wieder eintragen.
select cron.alter_job(64, command => $cmd$
  select net.http_post(
    url => 'https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-club',
    headers => '{"Content-Type":"application/json"}'::jsonb,
    body => jsonb_build_object('action', 'fra_sicherung',
      'cronSecret', (select decrypted_secret from vault.decrypted_secrets where name = 'kc_club_cron_secret')),
    timeout_milliseconds => 60000
  ) where not exists (select 1 from public.kc_club_fra_sicherung_stand where lauf = to_char(now() at time zone 'Europe/Berlin', 'YYYY-MM-DD') and status = 'ok');
$cmd$) where exists (select 1 from cron.job where jobid = 64 and jobname = 'kc-club-fra-sicherung');

-- 5) Eltern-Tabelle in den Spiegel (war „wartet auf Admin-Freigabe“, Dauerwarnung der Abdeckungsprüfung).
--    Push-Adresse, Abo und Link-Prüfwert werden geschwärzt (wie bei kc_member_push_subscriptions). Rückweg: mirror_enabled = false.
--    token_hash ist Pflichtfeld → durch „[entfernt]“ ersetzt statt leer.
insert into public.kc_db_mirror_redaction (table_name, column_name, grund, muster, ersatz)
select x.t, x.c, x.g, x.m, x.e from (values
  ('kc_club_eltern', 'subscription', 'Push-Abo der Eltern (Geheimnis)', null, null),
  ('kc_club_eltern', 'endpoint', 'Push-Adresse der Eltern', null, null),
  ('kc_club_eltern', 'token_hash', 'Prüfwert des Eltern-Links', '.+', '[entfernt]')) x(t, c, g, m, e)
where not exists (select 1 from public.kc_db_mirror_redaction r where r.table_name = x.t and r.column_name = x.c);
update public.kc_db_mirror_table_rules set mirror_enabled = true,
  note = 'Freigabe Hansi 20.10.2026 (RC-Prüfung): gespiegelt, subscription/endpoint/token_hash geschwärzt', updated_at = now()
 where table_name = 'kc_club_eltern';
