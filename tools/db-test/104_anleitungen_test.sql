-- KC-CLUB-ANLEITUNGEN: Probelauf in Supabase – nach der Migration in derselben Transaktion, bricht am Ende absichtlich ab (nichts bleibt).
do $$
declare v_n int; v_reg text[]; v_vorstand boolean;
begin
  select count(*), max(register::text)::text[], bool_and(nur_vorstand) into v_n, v_reg, v_vorstand from public.kc_club_archiv_ordner where titel = 'Anleitungen' and besitzer is null and geloescht_am is null;
  raise exception 'TESTBERICHT ordner=% | register=% | nur_leitung=%', v_n, array_length(v_reg, 1), v_vorstand;
end $$;
