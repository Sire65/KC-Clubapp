-- KC-RT-PROGRAMME (Standleitung PC-Manager / Money Butler / dp2): Probelauf – läuft in einer Transaktion, die am Ende
-- absichtlich abbricht → nichts bleibt (keine Test-Übergabe, kein Signal, kein Zählerstand).
do $$
declare
  k_mgr text := public.kc_rt_programm_kanal_intern('manager', 'KC_WERNE');
  k_mb  text := public.kc_rt_programm_kanal_intern('money-butler', 'KC_WERNE');
  k_dp  text := public.kc_rt_programm_kanal_intern('dp', 'KC_WERNE');
  t0 timestamptz := clock_timestamp(); v_id uuid; v_geld int; v_dp int; v_plan int; v_inhalt int;
  v_fremd text; v_mgr_user uuid; v_mgr_kanal text; v_getrennt boolean;
begin
  -- 1. Geld: neue Übergabe + Statuswechsel → je 1 Signal "geld" an Manager und Money Butler (also 4)
  insert into public.kc_finance_cash_transfers (org_id, correlation_id, register_id, amount)
    values ('KC_WERNE', 'ZZTEST-RT', 'KASSE-ZZTEST', 1) returning id into v_id;
  update public.kc_finance_cash_transfers set status = 'manager_received' where id = v_id;
  update public.kc_finance_cash_transfers set register_id = 'KASSE-ZZTEST2' where id = v_id; -- ohne Statuswechsel: KEIN Signal
  select count(*) into v_geld from realtime.messages
    where inserted_at >= t0 - interval '1 minute' and topic in (k_mgr, k_mb) and event = 'neu' and payload->>'art' = 'geld';
  -- 2. dp2: zwei Abgleich-Zeilen in EINER Anweisung → genau 1 Signal "abgleich"
  insert into public.kc_dp_sync_operations (seq, operation_id, org_id, project_id, entity, entity_id, operation, remote_version, envelope)
    values (-900001, 'ZZTEST-RT-1', 'KC_WERNE', 'ZZTEST', 'test', 'zz1', 'upsert', 1, '{}'::jsonb),
           (-900002, 'ZZTEST-RT-2', 'KC_WERNE', 'ZZTEST', 'test', 'zz2', 'upsert', 1, '{}'::jsonb);
  select count(*) into v_dp from realtime.messages
    where inserted_at >= t0 - interval '1 minute' and topic = k_dp and payload->>'art' = 'abgleich';
  -- 3. Sollplan veröffentlicht → 1 Signal "dienstplan" an den Manager
  insert into public.kc_dp_plan_published (org_id, event_id, source_shift_id, person_id, work_date, start_time, end_time, payload, checksum)
    values ('KC_WERNE', 'ZZTEST', 'ZZTEST-S1', 'KC-P-ZZTEST', current_date, '10:00', '12:00', '{}'::jsonb, 'zz');
  select count(*) into v_plan from realtime.messages
    where inserted_at >= t0 - interval '1 minute' and topic = k_mgr and payload->>'art' = 'dienstplan';
  -- 4. Signale enthalten nur die Art – keine Beträge, Namen, Kassen
  select count(*) into v_inhalt from realtime.messages
    where inserted_at >= t0 - interval '1 minute' and topic in (k_mgr, k_mb, k_dp) and (payload - 'art' - 'id') <> '{}'::jsonb;
  -- 5. Berechtigung: fremder Benutzer bekommt keinen Kanal; ein aktiver Manager bekommt genau seinen
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000000","role":"authenticated"}', true);
  begin v_fremd := public.kc_rt_programm_kanal('manager'); exception when others then v_fremd := 'fehler'; end;
  select user_id into v_mgr_user from public.kc_manager_memberships where active is true and role in ('admin','superadmin') and org_id = 'KC_WERNE' limit 1;
  if v_mgr_user is not null then
    perform set_config('request.jwt.claims', json_build_object('sub', v_mgr_user, 'role', 'authenticated')::text, true);
    v_mgr_kanal := public.kc_rt_programm_kanal('manager');
  end if;
  v_getrennt := k_mgr <> k_mb and k_mb <> k_dp and k_mgr <> public.kc_club_rt_kanal('KC_WERNE');
  raise exception 'TESTBERICHT geld=% | abgleich=% | dienstplan=% | inhalt=% | fremd=% | manager_kanal=% | getrennt=%',
    v_geld, v_dp, v_plan, v_inhalt, coalesce(v_fremd, 'null'),
    case when v_mgr_user is null then 'kein_manager' when v_mgr_kanal = k_mgr then 'richtig' else coalesce(v_mgr_kanal, 'null') end, v_getrennt;
end $$;
