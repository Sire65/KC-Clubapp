-- 2.598.0 KC-CLUB-UNTERHALTUNGEN-PAKET: Probelauf – nur lesend, Transaktion bricht am Ende absichtlich ab, nichts bleibt.
-- Vergleicht je Mitglied die Zahlen des Pakets mit den bisherigen Einzelabfragen (gleiche 1000 neuesten Nachrichten).
do $$
declare pid text; j jsonb; n_ok bool := true; th_ok bool := true; un_ok bool := true; leer jsonb; rechte_ok bool; anzahl int := 0;
begin
  for pid in select distinct person_id from public.kc_communication_thread_participants where hidden_at is null loop
    anzahl := anzahl + 1;
    j := public.kc_club_unterhaltungen_paket(pid);
    if (select coalesce(sum((a ->> 'n')::int), 0) from jsonb_array_elements(j -> 'agg') a)
       <> (select count(*) from (select 1 from public.kc_communication_messages where thread_id in (select thread_id from public.kc_communication_thread_participants where person_id = pid and hidden_at is null) order by created_at desc limit 1000) x)
      then n_ok := false; end if;
    if jsonb_array_length(j -> 'meine') <> (select count(*) from public.kc_communication_thread_participants where person_id = pid and hidden_at is null)
       or jsonb_array_length(j -> 'th') <> jsonb_array_length(j -> 'meine') then th_ok := false; end if;
    if exists (select 1 from jsonb_array_elements(j -> 'agg') a where (a ->> 'wichtig_neu')::int > (a ->> 'ungelesen')::int) then un_ok := false; end if;
  end loop;
  leer := public.kc_club_unterhaltungen_paket('KC-P-ZZTEST1');
  rechte_ok := not has_function_privilege('anon', 'public.kc_club_unterhaltungen_paket(text)', 'execute')
           and not has_function_privilege('authenticated', 'public.kc_club_unterhaltungen_paket(text)', 'execute')
           and has_function_privilege('service_role', 'public.kc_club_unterhaltungen_paket(text)', 'execute');
  raise exception 'TESTBERICHT personen_geprueft=% | anzahl_gleich=% | chats_gleich=% | wichtig_nie_mehr_als_ungelesen=% | leer=% | rechte=%',
    anzahl > 0, n_ok, th_ok, un_ok, leer = '{"agg": [], "gr": [], "th": [], "tn": [], "meine": []}'::jsonb, rechte_ok;
end $$;
