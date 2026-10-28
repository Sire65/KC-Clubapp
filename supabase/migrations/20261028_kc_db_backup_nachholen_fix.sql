-- KC-DB-BACKUP-NACHHOLEN-FIX (28.10.2026, Fund über den neuen 🔐 Sicherungs-Prüfer, Bild Hansi 07:35):
-- Die Nachtsicherung 28.10. (Satz 9beb9f9e…) blieb unvollständig (265/285 Tabellen). Ursache zweifach:
--  1. Das Nachholen schafft je Lauf 15 Tabellen (3 Pakete × 5) und gab nach 8 Läufen auf – 8 × 15 = 120 < 130 fehlende Tabellen.
--  2. Beim Aufgeben schrieb es severity 'critical' – die Prüfregel von kc_db_mirror_audit erlaubt nur info/ok/warning/error/security
--     → seit 04:00 UTC brach JEDER Nachhol-Lauf mit Fehler ab.
-- Korrektur: höchstens 16 statt 8 Versuche (Fenster 0–7 UTC alle 10 Min. = 48 Läufe, reicht für 240 Tabellen) und 'error' statt 'critical'.
-- Sonst unverändert (Stand der Datenbank vom 28.10.2026, inkl. KICC-F-105). Kein Schema, keine Tabelle.
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
  v_max_versuche constant int := 16;
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
        values('error','backup_nachholen_aufgegeben','Backup-Satz nach mehreren Nachhol-Versuchen unvollstaendig',
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
