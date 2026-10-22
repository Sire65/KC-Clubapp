-- 2.597.0 KC-CLUB-ONLINE-PAKET / KC-CLUB-MAHNUNG-PAKET: Probelauf – nur lesend, Transaktion bricht am Ende absichtlich ab, nichts bleibt.
-- Vergleicht die neuen Funktionen mit den bisherigen Einzelabfragen (gleiche Filter und Grenzen).
do $$
declare
  seit timestamptz := now() - interval '7 days';
  j jsonb; ids_ok bool; einst_ok bool; inko_ok bool; m jsonb; thr jsonb; pid text; mahnung_ok bool := true; leer jsonb; rechte_ok bool;
begin
  j := public.kc_club_online_jetzt(seit, array['anklopfen', 'online_seit', 'fenster']);
  ids_ok := (select coalesce(array_agg(x order by x), '{}') from jsonb_array_elements_text(j -> 'ids') x)
          = (select coalesce(array_agg(distinct person_id order by person_id), '{}') from public.kc_club_zugang where aktiv and zuletzt_gesehen >= seit and person_id not like 'KC-P-TEST%');
  einst_ok := jsonb_array_length(j -> 'einst') = (select count(*) from public.kc_club_person_einstellung where schluessel in ('online', 'inkognito', 'anklopfen', 'online_seit', 'fenster')
          and person_id in (select person_id from public.kc_club_zugang where aktiv and zuletzt_gesehen >= seit and person_id not like 'KC-P-TEST%'));
  inko_ok := jsonb_typeof(j -> 'inko') = 'array';
  for pid in select distinct person_id from public.kc_communication_thread_participants where hidden_at is null limit 25 loop
    select jsonb_agg(jsonb_build_object('t', u.thread_id, 'lr', u.last_read_at)) into thr from (select * from public.kc_club_ungelesen_je_chat(pid) where n > 0 limit 40) u;
    m := public.kc_club_nachricht_mahnung(pid, coalesce(thr, '[]'::jsonb), now() - interval '5 days');
    if (m ->> 'alt')::int <> (select count(*) from (select (x ->> 't')::uuid t, nullif(x ->> 'lr', '')::timestamptz lr from jsonb_array_elements(coalesce(thr, '[]'::jsonb)) x) th
        join public.kc_communication_messages msg on msg.thread_id = th.t and msg.sender_person_id <> pid and (th.lr is null or msg.created_at > th.lr) and msg.created_at < now() - interval '5 days')
      and (select max(n) from public.kc_club_ungelesen_je_chat(pid)) <= 100 then mahnung_ok := false; end if;
  end loop;
  leer := public.kc_club_nachricht_mahnung('KC-P-ZZTEST1', '[]'::jsonb, now());
  rechte_ok := not has_function_privilege('anon', 'public.kc_club_online_jetzt(timestamptz, text[])', 'execute')
           and not has_function_privilege('authenticated', 'public.kc_club_nachricht_mahnung(text, jsonb, timestamptz)', 'execute')
           and has_function_privilege('service_role', 'public.kc_club_nachricht_mahnung(text, jsonb, timestamptz)', 'execute');
  raise exception 'TESTBERICHT online_ids=% | online_einst=% | online_inko=% | mahnung_gleich=% | mahnung_leer=% | rechte=%',
    ids_ok, einst_ok, inko_ok, mahnung_ok, leer = '{"alt": 0, "wichtig": 0}'::jsonb, rechte_ok;
end $$;
