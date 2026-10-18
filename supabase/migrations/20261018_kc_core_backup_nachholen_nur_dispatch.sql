-- KC-CORE-BACKUP-NACHHOLEN-DISPATCH – 18.10.2026 (Freigabe Hansi „Baue du die Reparaturen“)
-- Befund (Prüfbericht 18.10.2026, 06:40): kc_db_backup_nachholen() verglich einen laufenden Backup-Satz mit der AKTUELLEN Registry.
-- Eine Tabelle, die erst NACH dem Dispatch neu angelegt wurde (kc_club_wunschliste, 06:32 automatisch aufgenommen), wurde in den
-- schon geprüften Satz nachgeladen; der Restore-Lesetest scheiterte sofort („type public.<tabelle> does not exist“), weil die Tabelle
-- in Neon erst nach dem nächsten regulären Spiegellauf existiert. Gleiches Muster am 11.10., 13.10. und 17.10.
-- Die Zurückstell-Regel vom 13.10. (20261013_kc_core_backup_neue_tabellen_nach_spiegel.sql) galt nur im Tagesbackup.
-- Neu:
--   1. kc_db_backup_nachholen(): holt nur Tabellen nach, die zum Satz gehören – also nicht beim Dispatch zurückgestellt und nicht erst
--      danach neu aufgenommen (Regel nach dem Dispatch geändert UND vor dem Dispatch noch nie erfolgreich gespiegelt). Bestehende Tabellen
--      werden wie bisher IMMER nachgeholt. Neue Tabellen kommen in den nächsten Tagessatz; einmal je Satz steht das im Audit.
--   2. kc_db_backup_verify_latest(): prüft den jüngsten Satz erneut, wenn sein LETZTER Restore-Test nicht bestanden ist
--      (bisher genügte irgendein früheres „ok“ – ein später rot gewordener Satz blieb bis zum nächsten Tag rot).
-- Rückweg: Funktionsstände aus kicc_f_105_backup_grosse_tabellen (Nachholen) und verify_dispatched_backup_set (Prüfen) wieder einspielen
-- (Wortlaut vom 18.10.2026 in docs/BACKUP_NACHHOLEN_2026-10-18.md).

create or replace function public.kc_db_backup_nachholen()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'vault', 'net'
as $function$
declare
  v_token text;
  v_satz record;
  v_fehlend text[];
  v_spaeter_neu text[];
  v_versuche int;
  v_paket text[];
  v_req bigint;
  v_reqs jsonb;
  v_geplant boolean;
  v_ergebnis jsonb := '[]'::jsonb;
  v_paketgroesse constant int := 5;
  v_max_pakete constant int := 3;
  v_max_versuche constant int := 8;
  i int;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name='kc_db_mirror_worker_token' limit 1;
  if v_token is null then raise exception 'backup worker token unavailable'; end if;

  for v_satz in
    select a.metadata->>'backup_set' as satz, a.happened_at, coalesce(a.metadata->'spaeter', '[]'::jsonb) as spaeter,
           coalesce(a.metadata->'deferred', '[]'::jsonb) as zurueck
      from public.kc_db_mirror_audit a
     where a.action = 'immutable_backup_dispatched'
       and a.happened_at > now() - interval '20 hours'
       and a.happened_at < now() - interval '5 minutes'
     order by a.happened_at desc
  loop
    if exists (select 1 from public.kc_db_mirror_audit n
                where n.action in ('backup_nachgeholt','backup_spaeter_gesichert') and n.metadata->>'backup_set' = v_satz.satz
                  and n.happened_at > now() - interval '5 minutes') then
      continue;
    end if;

    -- KC-CORE-BACKUP-NACHHOLEN-DISPATCH: nur Tabellen, die zum Satz gehören
    with kandidaten as (
      select tr.table_name,
             (v_satz.zurueck ? tr.table_name
              or (tr.updated_at > v_satz.happened_at
                  and not exists (select 1 from public.kc_db_mirror_runs s
                                   where s.run_type = 'snapshot' and s.status = 'ok'
                                     and s.metrics->>'table' = tr.table_name
                                     and s.finished_at < v_satz.happened_at))) as nicht_im_satz
        from public.kc_db_mirror_table_rules tr
       where tr.backup_enabled and tr.mirror_enabled and tr.sensitivity <> 'secret'
         and not exists (select 1 from public.kc_db_mirror_runs r
                          where r.run_type = 'backup' and r.status = 'ok'
                            and r.started_at > v_satz.happened_at - interval '1 minute'
                            and r.metrics->>'backup_set' = v_satz.satz
                            and r.metrics->>'table' = tr.table_name)
    )
    select array_agg(table_name order by table_name) filter (where not nicht_im_satz),
           array_agg(table_name order by table_name) filter (where nicht_im_satz)
      into v_fehlend, v_spaeter_neu
      from kandidaten;

    if v_spaeter_neu is not null and not exists (
         select 1 from public.kc_db_mirror_audit n
          where n.action = 'backup_table_deferred' and n.metadata->>'backup_set' = v_satz.satz and n.metadata->>'quelle' = 'nachholen') then
      insert into public.kc_db_mirror_audit(severity,action,detail,metadata)
      values('info','backup_table_deferred','Neue Tabelle(n) nach dem Dispatch: kommen in den nächsten Tagessatz, nicht in den laufenden',
             jsonb_build_object('tables',to_jsonb(v_spaeter_neu),'backup_set',v_satz.satz,'quelle','nachholen'));
    end if;

    if v_fehlend is null then continue; end if;

    select count(*) into v_versuche from public.kc_db_mirror_audit n
     where n.action in ('backup_nachgeholt','backup_spaeter_gesichert','backup_nachholen_aufgegeben') and n.metadata->>'backup_set' = v_satz.satz;

    if v_versuche >= v_max_versuche then
      if not exists (select 1 from public.kc_db_mirror_audit n where n.action = 'backup_nachholen_aufgegeben' and n.metadata->>'backup_set' = v_satz.satz) then
        insert into public.kc_db_mirror_audit(severity,action,detail,metadata)
        values('critical','backup_nachholen_aufgegeben','Backup-Satz nach mehreren Nachhol-Versuchen unvollstaendig',
               jsonb_build_object('backup_set',v_satz.satz,'missing',to_jsonb(v_fehlend)));
      end if;
      continue;
    end if;

    -- KICC-F-105: erster Lauf, und es fehlen nur die bewusst spaeter gesicherten grossen Tabellen -> geplanter Schritt
    v_geplant := v_versuche = 0 and jsonb_array_length(v_satz.spaeter) > 0
                 and not exists (select 1 from unnest(v_fehlend) f where not (v_satz.spaeter ? f));

    v_reqs := '[]'::jsonb;
    i := 1;
    while i <= least(cardinality(v_fehlend), v_paketgroesse * v_max_pakete) loop
      v_paket := v_fehlend[i:least(i + v_paketgroesse - 1, v_paketgroesse * v_max_pakete)];
      select net.http_post(
        url:='https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-db-backup-worker',
        body:=jsonb_build_object('mode','backup','backup_set',v_satz.satz,'tables',to_jsonb(v_paket)),
        headers:=jsonb_build_object('Content-Type','application/json','x-kc-mirror-token',v_token),
        timeout_milliseconds:=120000) into v_req;
      v_reqs := v_reqs || to_jsonb(v_req);
      i := i + v_paketgroesse;
    end loop;

    insert into public.kc_db_mirror_audit(severity,action,detail,metadata)
    values(case when v_geplant then 'info' else 'warning' end,
           case when v_geplant then 'backup_spaeter_gesichert' else 'backup_nachgeholt' end,
           case when v_geplant then 'Grosse Tabellen wie geplant im ruhigen Nachlauf gesichert' else 'Fehlende Tabellen in laufenden Backup-Satz nachgeladen' end,
           jsonb_build_object('backup_set',v_satz.satz,'missing',to_jsonb(v_fehlend),'missing_count',cardinality(v_fehlend),
                              'requests',v_reqs,'versuch',v_versuche + 1,'geplant',v_geplant));
    v_ergebnis := v_ergebnis || jsonb_build_object('backup_set',v_satz.satz,'missing_count',cardinality(v_fehlend),'requests',v_reqs,'geplant',v_geplant);
    exit;
  end loop;

  return jsonb_build_object('status', case when jsonb_array_length(v_ergebnis) = 0 then 'nichts_zu_tun' else 'nachgeholt' end, 'saetze', v_ergebnis);
end
$function$;

create or replace function public.kc_db_backup_verify_latest()
 returns bigint
 language plpgsql
 security definer
 set search_path to 'public', 'vault', 'net'
as $function$
declare v_token text; v_request bigint; v_set uuid;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name='kc_db_mirror_worker_token' limit 1;
  if v_token is null then raise exception 'backup worker token unavailable'; end if;
  select nullif(metadata->>'backup_set','')::uuid into v_set from public.kc_db_mirror_audit
   where action='immutable_backup_dispatched' order by happened_at desc limit 1;
  if v_set is null then raise exception 'no dispatched backup set found'; end if;
  -- KC-CORE-BACKUP-NACHHOLEN-DISPATCH: nur überspringen, wenn der LETZTE Restore-Test dieses Satzes bestanden ist
  if (select status from public.kc_db_mirror_runs
       where run_type='restore_test' and metrics->>'backup_set'=v_set::text
       order by started_at desc, id desc limit 1) = 'ok' then
    return null;
  end if;
  select net.http_post(url:='https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-db-backup-verify-v2',
    body:=jsonb_build_object('backup_set',v_set::text),
    headers:=jsonb_build_object('Content-Type','application/json','x-kc-mirror-token',v_token),
    timeout_milliseconds:=150000) into v_request;
  return v_request;
end $function$;
