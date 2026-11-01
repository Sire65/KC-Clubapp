-- KC-CLUB-STROM-MESSUNG: Probelauf in Supabase – nach der Migration in derselben Transaktion, bricht am Ende absichtlich ab (nichts bleibt).
do $$
declare v_ok boolean := false; v_falsch boolean := false; v_rechte boolean;
begin
  insert into public.kc_club_strom (tag, person_id, bereich, minuten, prozent) values (current_date, 'KC-P-TEST-STROM', 'start', 12.5, 1.5);
  insert into public.kc_club_strom (tag, person_id, bereich, minuten, prozent) values (current_date, 'KC-P-TEST-STROM', 'start', 3, 1)
    on conflict (tag, person_id, bereich) do update set minuten = excluded.minuten, prozent = excluded.prozent;
  select minuten = 3 into v_ok from public.kc_club_strom where person_id = 'KC-P-TEST-STROM';
  begin insert into public.kc_club_strom (tag, person_id, bereich, minuten, prozent) values (current_date, 'KC-P-TEST-STROM', 'Böse Sache', 1, 1);
  exception when check_violation then v_falsch := true; end;
  select has_table_privilege('service_role', 'public.kc_club_strom', 'insert') and not has_table_privilege('anon', 'public.kc_club_strom', 'select') into v_rechte;
  raise exception 'TESTBERICHT upsert=% | bereich_geprueft=% | rechte=% | regel=%', v_ok, v_falsch, v_rechte,
    exists (select 1 from public.kc_db_mirror_table_rules where table_name = 'kc_club_strom' and not mirror_enabled);
end $$;
