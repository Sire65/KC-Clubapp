-- KC-CLUB-PASSIV: Probelauf in Supabase – nach der Migration in derselben Transaktion, bricht am Ende absichtlich ab (nichts bleibt).
do $$
declare v_fridbert text; v_passiv_ok boolean := false; v_falsch_ok boolean := false;
begin
  select zugang into v_fridbert from public.kc_club_rollen where person_id = 'KC-P-M0004';
  begin
    update public.kc_club_rollen set zugang = 'passiv' where person_id = 'KC-P-M0004'; v_passiv_ok := true;
  exception when check_violation then v_passiv_ok := false; end;
  begin
    update public.kc_club_rollen set zugang = 'quatsch' where person_id = 'KC-P-M0004';
  exception when check_violation then v_falsch_ok := true; end;
  raise exception 'TESTBERICHT fridbert=% | passiv_erlaubt=% | unsinn_abgelehnt=% | andere_unveraendert=%',
    v_fridbert, v_passiv_ok, v_falsch_ok, (select count(*) = 0 from public.kc_club_rollen where zugang = 'passiv' and person_id <> 'KC-P-M0004');
end $$;
