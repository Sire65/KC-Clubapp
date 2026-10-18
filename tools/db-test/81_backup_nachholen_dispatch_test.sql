-- KC-CORE-BACKUP-NACHHOLEN-DISPATCH: Probelauf – läuft nach der Migration in derselben Transaktion und bricht am Ende absichtlich ab.
-- Nichts bleibt: Test-Satz, Test-Regeln und die von net.http_post vorgemerkten Anfragen werden zurückgerollt (pg_net sendet erst nach Commit).
do $$
declare
  v_satz uuid := gen_random_uuid();
  v_dispatch timestamptz := now() - interval '1 hour';
  r jsonb; a jsonb; z jsonb;
  v_rot bigint; v_gruen bigint;
begin
  insert into public.kc_db_mirror_audit(severity,action,detail,metadata,happened_at)
  values('info','immutable_backup_dispatched','TEST',jsonb_build_object('backup_set',v_satz,'tables',300,'deferred',jsonb_build_array('kc_zztest_zurueck'),'spaeter','[]'::jsonb),v_dispatch);

  -- alt: bestehende Tabelle, Regel nach dem Dispatch bearbeitet, vorher gespiegelt → muss nachgeholt werden
  -- neu: erst nach dem Dispatch aufgenommen, nie gespiegelt → darf NICHT in den laufenden Satz
  -- zurueck: beim Dispatch zurückgestellt → darf NICHT nachgeholt werden
  insert into public.kc_db_mirror_table_rules(table_name,area,sensitivity,mirror_enabled,backup_enabled,updated_at) values
    ('kc_zztest_alt','TEST','normal',true,true,now()), ('kc_zztest_neu','TEST','normal',true,true,now()),
    ('kc_zztest_zurueck','TEST','normal',true,true,now() - interval '3 hours');
  insert into public.kc_db_mirror_runs(run_type,status,started_at,finished_at,message,metrics)
  values('snapshot','ok',v_dispatch - interval '2 hours',v_dispatch - interval '2 hours','TEST',jsonb_build_object('table','kc_zztest_alt'));

  r := public.kc_db_backup_nachholen();
  select metadata into a from public.kc_db_mirror_audit where action = 'backup_nachgeholt' and metadata->>'backup_set' = v_satz::text;
  select metadata into z from public.kc_db_mirror_audit where action = 'backup_table_deferred' and metadata->>'backup_set' = v_satz::text and metadata->>'quelle' = 'nachholen';

  -- Prüfen: letzter Test rot → neu prüfen; letzter Test grün → nichts tun
  insert into public.kc_db_mirror_runs(run_type,status,started_at,finished_at,message,metrics) values
    ('restore_test','ok',now() - interval '50 minutes',now() - interval '50 minutes','TEST',jsonb_build_object('backup_set',v_satz)),
    ('restore_test','error',now() - interval '10 minutes',now() - interval '10 minutes','TEST',jsonb_build_object('backup_set',v_satz));
  v_rot := public.kc_db_backup_verify_latest();
  insert into public.kc_db_mirror_runs(run_type,status,started_at,finished_at,message,metrics)
  values('restore_test','ok',now() - interval '1 minute',now() - interval '1 minute','TEST',jsonb_build_object('backup_set',v_satz));
  v_gruen := public.kc_db_backup_verify_latest();

  raise exception 'TESTBERICHT nachgeholt=% | alt_nachgeholt=% | neu_nicht_nachgeholt=% | zurueckgestellt_nicht_nachgeholt=% | neu_im_audit=% | zurueck_im_audit=% | rot_wird_geprueft=% | gruen_bleibt=%',
    r->>'status' = 'nachgeholt', coalesce(a->'missing' ? 'kc_zztest_alt', false),
    not coalesce(a->'missing' ? 'kc_zztest_neu', true), not coalesce(a->'missing' ? 'kc_zztest_zurueck', true),
    coalesce(z->'tables' ? 'kc_zztest_neu', false), coalesce(z->'tables' ? 'kc_zztest_zurueck', false),
    v_rot is not null, v_gruen is null;
end $$;
