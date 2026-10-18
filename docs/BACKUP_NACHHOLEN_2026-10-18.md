# KC-CORE-BACKUP-NACHHOLEN-DISPATCH – Recovery-Punkt (18.10.2026)

Migration: `supabase/migrations/20261018_kc_core_backup_nachholen_nur_dispatch.sql` · Probelauf: `tools/db-test/81_backup_nachholen_dispatch_test.sql` (Erwartung `81_erwartet.txt`).

## Anlass
Restore-Lesetest 18.10.2026 06:40 MESZ rot: `kc_club_wunschliste` wurde um 06:32 automatisch aufgenommen und um 06:40 von
`kc_db_backup_nachholen()` in den schon geprüften Satz des Tages nachgeladen; in Neon gab es die Tabelle noch nicht.
Gleiches Muster am 11.10., 13.10. und 17.10. Daten waren nie verloren (Satz vom 18.10. 02:50 bestand 266/266).

## Rückweg
Die folgenden Stände (unverändert ausgelesen am 18.10.2026 vor dem Einspielen) wieder mit `create or replace` einspielen.

### kc_db_backup_nachholen (Stand kicc_f_105_backup_grosse_tabellen)
```sql
CREATE OR REPLACE FUNCTION public.kc_db_backup_nachholen()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'net'
AS $function$
declare
  v_token text;
  v_satz record;
  v_fehlend text[];
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
    select a.metadata->>'backup_set' as satz, a.happened_at, coalesce(a.metadata->'spaeter', '[]'::jsonb) as spaeter
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

    select array_agg(tr.table_name order by tr.table_name) into v_fehlend
      from public.kc_db_mirror_table_rules tr
     where tr.backup_enabled and tr.mirror_enabled and tr.sensitivity <> 'secret'
       and not exists (select 1 from public.kc_db_mirror_runs r
                        where r.run_type = 'backup' and r.status = 'ok'
                          and r.started_at > v_satz.happened_at - interval '1 minute'
                          and r.metrics->>'backup_set' = v_satz.satz
                          and r.metrics->>'table' = tr.table_name);

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
```

### kc_db_backup_verify_latest (Stand verify_dispatched_backup_set)
```sql
CREATE OR REPLACE FUNCTION public.kc_db_backup_verify_latest()
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'vault', 'net'
AS $function$
declare v_token text; v_request bigint; v_set uuid;
begin
  select decrypted_secret into v_token from vault.decrypted_secrets where name='kc_db_mirror_worker_token' limit 1;
  if v_token is null then raise exception 'backup worker token unavailable'; end if;
  select nullif(metadata->>'backup_set','')::uuid into v_set from public.kc_db_mirror_audit
   where action='immutable_backup_dispatched' order by happened_at desc limit 1;
  if v_set is null then raise exception 'no dispatched backup set found'; end if;
  -- bereits bestanden: nichts zu tun
  if exists (select 1 from public.kc_db_mirror_runs
              where run_type='restore_test' and status='ok' and metrics->>'backup_set'=v_set::text) then
    return null;
  end if;
  select net.http_post(url:='https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-db-backup-verify-v2',
    body:=jsonb_build_object('backup_set',v_set::text),
    headers:=jsonb_build_object('Content-Type','application/json','x-kc-mirror-token',v_token),
    timeout_milliseconds:=150000) into v_request;
  return v_request;
end $function$;
```
