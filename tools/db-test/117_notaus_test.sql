-- KC-NOTAUS: Probelauf in Supabase – nach der Migration 20261121_kc_notaus.sql in derselben Transaktion
-- (begin; <Migration>; <dieser Test>), bricht am Ende absichtlich ab (raise exception → alles zurückgerollt, auch der NOT-AUS).
-- Liest nur Zahlen und Status – nie Texte, Empfänger oder Variablen (KC-CHATS-PRIVAT). Testaufträge: source_program 'kc-notaus-test'.
do $$
declare
  spalten int; rechte_ok boolean; vorher text; nachher text; probe jsonb; aus jsonb; st jsonb; ent jsonb; ent2 jsonb;
  t_queued uuid; t_proc uuid; testzeilen boolean := false; q_status text; p_status text; q_vorher text; q2_status text; schalter boolean;
  sek text;
begin
  select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'kc_communication_settings'
    and column_name in ('notaus_seit', 'notaus_von', 'notaus_quelle') into spalten;
  select bool_and(not has_function_privilege('anon', f, 'execute') and not has_function_privilege('authenticated', f, 'execute')
                  and has_function_privilege('service_role', f, 'execute'))
    from unnest(array['public.kc_notaus_ausloesen(text,text,boolean)', 'public.kc_notaus_entriegeln(text,text)', 'public.kc_notaus_stand()']) f into rechte_ok;
  select coalesce(string_agg(prosecdef::text, ','), '') from pg_proc where proname in ('kc_notaus_ausloesen', 'kc_notaus_entriegeln', 'kc_notaus_stand') into sek;

  -- zwei Testaufträge (falls die Pflichtspalten es zulassen): einer wartet, einer läuft gerade
  begin
    insert into public.kc_communication_requests (source_program, channel, status, audit_meta) values ('kc-notaus-test', 'push', 'queued', '{}'::jsonb) returning id into t_queued;
    insert into public.kc_communication_requests (source_program, channel, status, audit_meta) values ('kc-notaus-test', 'email', 'processing', '{}'::jsonb) returning id into t_proc;
    testzeilen := true;
  exception when others then testzeilen := false;
  end;

  -- Probe ändert nichts: Status-Zählung vorher = nachher, Schalter unverändert
  select string_agg(status || ':' || n, ',' order by status) from (select status, count(*) n from public.kc_communication_requests group by status) x into vorher;
  probe := public.kc_notaus_ausloesen('KC-P-TEST', 'club', true);
  select string_agg(status || ':' || n, ',' order by status) from (select status, count(*) n from public.kc_communication_requests group by status) x into nachher;

  aus := public.kc_notaus_ausloesen('KC-P-TEST', 'club', false);
  select dispatch_enabled from public.kc_communication_settings where id = 'global' into schalter;
  if testzeilen then
    select status, audit_meta->>'notaus_vorher' from public.kc_communication_requests where id = t_queued into q_status, q_vorher;
    select status from public.kc_communication_requests where id = t_proc into p_status;
  end if;
  st := public.kc_notaus_stand();
  ent := public.kc_notaus_entriegeln('KC-P-TEST', 'senden');
  if testzeilen then select status from public.kc_communication_requests where id = t_queued into q2_status; end if;
  ent2 := public.kc_notaus_entriegeln('KC-P-TEST', 'behalten');

  raise exception 'TESTBERICHT spalten=% | rechte=% | definer=% | probe_aendert_nichts=% | probe_ist_probe=% | ausgeloest=% | schalter_aus=% | testzeilen=% | wartend_angehalten=% | vorher_gemerkt=% | processing_bleibt=% | stand_ohne_inhalt=% | entriegelt=% | wieder_queued=% | schalter_an=%',
    spalten, rechte_ok, sek, vorher is not distinct from nachher, (probe->>'probe')::boolean,
    (aus->>'aktiv')::boolean and (aus->>'angehalten')::int >= case when testzeilen then 1 else 0 end, schalter = false, testzeilen,
    coalesce(q_status = 'angehalten', not testzeilen), coalesce(q_vorher = 'queued', not testzeilen), coalesce(p_status = 'processing', not testzeilen),
    (select array_agg(k order by k) from jsonb_object_keys(st) k) = array['aktiv', 'angehalten', 'nach_kanal', 'quelle', 'seit', 'von'],
    (ent->>'aktiv')::boolean = false and (ent2->>'aktiv')::boolean = false,
    coalesce(q2_status = 'queued', not testzeilen),
    (select dispatch_enabled from public.kc_communication_settings where id = 'global');
end $$;
