-- KC Core Backup – neue Tabellen erst nach dem ersten Spiegellauf sichern – 13.10.2026 (Freigabe Hansi „Ja, bau das ein“)
-- Befund: Der Restore-Lesetest (kc-db-backup-verify-v2) liest jede gesicherte Tabelle probeweise in den Neon-Spiegel zurück. Eine NEUE Tabelle
-- landet sofort im Backup (Regel automatisch aufgenommen), existiert in Neon aber erst nach dem nächsten regulären Spiegellauf (bis 6 h).
-- Fällt der Lesetest in diese Lücke, meldet der System Check ROT („type public.<tabelle> does not exist“), obwohl keine Daten fehlen
-- (zuletzt 13.10. 11:42 mit kc_club_video_stimmen; nach dem Spiegellauf neu geprüft: 250/250 ok).
-- Neu: Eine Tabelle wird zurückgestellt, wenn ihre Regel in den letzten 24 h angelegt/geändert wurde UND sie in den letzten 2 Tagen noch
-- keinen erfolgreichen Spiegellauf (snapshot ok) hatte. Bestehende Tabellen werden IMMER gesichert – auch wenn die Spiegelung einmal ausfällt.
-- Jede Zurückstellung steht im Audit (backup_table_deferred). Rückweg: Funktion aus 20260929_kc_core_backup_spaltenreihenfolge-Stand
-- (ohne den Block „zurückgestellt“) wieder einspielen.
create or replace function public.kc_db_backup_daily()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'vault', 'net'
as $function$
declare
  v_token text;
  v_set uuid := gen_random_uuid();
  v_tabellen text[];
  v_zurueck text[];
  v_total int;
  v_reqs jsonb := '[]'::jsonb;
  v_req bigint;
  i int := 1;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name='kc_db_mirror_worker_token' limit 1;
  if v_token is null then raise exception 'backup worker token unavailable'; end if;

  with gespiegelt as (
    select distinct r.metrics->>'table' as t from public.kc_db_mirror_runs r
     where r.run_type = 'snapshot' and r.status = 'ok' and r.finished_at > now() - interval '2 days'
  ), kandidaten as (
    select tr.table_name, (tr.updated_at > now() - interval '24 hours' and not exists (select 1 from gespiegelt g where g.t = tr.table_name)) as neu_ohne_spiegel
      from public.kc_db_mirror_table_rules tr
     where tr.backup_enabled and tr.mirror_enabled and tr.sensitivity <> 'secret'
  )
  select coalesce(array_agg(table_name order by table_name) filter (where not neu_ohne_spiegel), '{}'::text[]),
         coalesce(array_agg(table_name order by table_name) filter (where neu_ohne_spiegel), '{}'::text[])
    into v_tabellen, v_zurueck from kandidaten;

  if cardinality(v_zurueck) > 0 then
    insert into public.kc_db_mirror_audit(severity,action,detail,metadata)
    values('info','backup_table_deferred','Neue Tabelle(n) erst nach dem ersten Spiegellauf im Backup',jsonb_build_object('tables',to_jsonb(v_zurueck),'backup_set',v_set));
  end if;

  v_total := cardinality(v_tabellen);
  if v_total = 0 then return jsonb_build_object('backup_set', null, 'status', 'nothing_to_backup'); end if;

  while i <= v_total loop
    select net.http_post(
      url:='https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-db-backup-worker',
      body:=jsonb_build_object('mode','backup','backup_set',v_set::text,'expected_total',v_total,'tables',to_jsonb(v_tabellen[i:i+24])),
      headers:=jsonb_build_object('Content-Type','application/json','x-kc-mirror-token',v_token), timeout_milliseconds:=60000) into v_req;
    v_reqs := v_reqs || to_jsonb(v_req);
    i := i + 25;
  end loop;

  insert into public.kc_db_mirror_audit(severity,action,detail,metadata)
  values('info','immutable_backup_dispatched','Daily immutable Neon backup dispatched',jsonb_build_object('backup_set',v_set,'tables',v_total,'requests',v_reqs,'deferred',to_jsonb(v_zurueck)));
  return jsonb_build_object('backup_set',v_set,'tables',v_total,'request_ids',v_reqs,'deferred',to_jsonb(v_zurueck));
end $function$;
