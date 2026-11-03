-- KC-CLUB-MAGAZIN-POSTFACH: Probelauf in Supabase – nach der Migration in derselben Transaktion, bricht am Ende absichtlich ab (nichts bleibt).
do $$
declare pid text; bid uuid; ok_status boolean := false; ok_art boolean := false; rechte boolean; neu int;
begin
  select person_id into pid from public.kc_core_people limit 1;
  insert into public.kc_club_magazin_beitrag (von, art, titel, text) values (pid, 'witz', 'Test', 'Testtext') returning id into bid;
  select count(*) into neu from public.kc_club_magazin_beitrag where id = bid and status = 'neu';
  begin update public.kc_club_magazin_beitrag set status = 'vielleicht' where id = bid; exception when check_violation then ok_status := true; end;
  begin insert into public.kc_club_magazin_beitrag (von, art, titel) values (pid, 'Falsch Art!', 'x'); exception when check_violation then ok_art := true; end;
  select not has_table_privilege('anon', 'public.kc_club_magazin_beitrag', 'select') and not has_table_privilege('authenticated', 'public.kc_club_magazin_beitrag', 'select')
    and has_table_privilege('service_role', 'public.kc_club_magazin_beitrag', 'insert') into rechte;
  raise exception 'TESTBERICHT neu_eingang=% | status_geprueft=% | art_geprueft=% | rechte_nur_server=%', neu = 1, ok_status, ok_art, rechte;
end $$;
