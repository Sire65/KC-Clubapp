-- KC-CLUB-GRUPPEN-QUITTUNG: Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt.
do $$
declare th uuid := gen_random_uuid(); a text := 'TEST-A'; b text := 'TEST-B'; c text := 'TEST-C';
  n_erst int; n_nochmal int; n_fremd int; n_neu int; zeilen int; seit_ok bool; rls bool; anon bool; m1 timestamptz;
begin
  insert into public.kc_communication_threads (id, org_id, created_by_person_id, subject) values (th, 'KC_WERNE', a, 'Test Quittung');
  insert into public.kc_communication_thread_participants (thread_id, person_id) values (th, a), (th, b);
  m1 := now() - interval '5 minutes';
  insert into public.kc_communication_messages (thread_id, sender_person_id, body, created_at) values (th, a, 'Hallo', m1);
  n_erst := public.kc_club_chat_quittung_merken(b, array[th], 'angekommen');     -- B bekommt die Nachricht von A
  n_nochmal := public.kc_club_chat_quittung_merken(b, array[th], 'angekommen');  -- nichts Neues → kein Eintrag
  n_fremd := public.kc_club_chat_quittung_merken(c, array[th], 'gelesen');       -- C ist kein Teilnehmer → nichts
  perform public.kc_club_chat_quittung_merken(a, array[th], 'gelesen');          -- A hat nur eigene Nachrichten → nichts
  insert into public.kc_communication_messages (thread_id, sender_person_id, body, created_at) values (th, a, 'Noch was', now() - interval '1 second');
  n_neu := public.kc_club_chat_quittung_merken(b, array[th], 'gelesen');
  select count(*) into zeilen from public.kc_club_chat_quittung where thread_id = th;
  select bool_and(seit is null) into seit_ok from public.kc_club_chat_quittung where thread_id = th; -- vorher nie gelesen
  select relrowsecurity into rls from pg_class where oid = 'public.kc_club_chat_quittung'::regclass;
  anon := has_table_privilege('anon', 'public.kc_club_chat_quittung', 'select') or has_table_privilege('authenticated', 'public.kc_club_chat_quittung', 'select')
       or has_function_privilege('anon', 'public.kc_club_chat_quittung_merken(text, uuid[], text)', 'execute');
  raise exception 'TESTBERICHT erster_eintrag=% | doppelt_verhindert=% | nicht_teilnehmer=% | gelesen_neu=% | zeilen=% | seit_leer=% | rls=% | kein_zugriff_ohne_server=%',
    n_erst = 1, n_nochmal = 0, n_fremd = 0, n_neu = 1, zeilen, seit_ok, rls, not anon;
end $$;
