-- KC-CLUB-GESPRAECHE: Probelauf in Supabase – nach der Migration in derselben Transaktion, bricht am Ende absichtlich ab (nichts bleibt).
do $$
declare v_ok boolean := true; v_alt boolean := true; v_falsch boolean := false; p1 text; p2 text;
begin
  select person_id into p1 from public.kc_core_people where active order by person_id limit 1;
  select person_id into p2 from public.kc_core_people where active and person_id <> p1 order by person_id limit 1;
  begin insert into public.kc_club_anklopfen (von, an, art, anruf_id) values (p1, p2, 'dazukommen', gen_random_uuid()); exception when others then v_ok := false; end;
  begin insert into public.kc_club_anklopfen (von, an, art) values (p1, p2, 'sprechen'); exception when others then v_alt := false; end;
  begin insert into public.kc_club_anklopfen (von, an, art) values (p1, p2, 'quatsch'); v_falsch := true; exception when others then null; end;
  raise exception 'TESTBERICHT dazukommen_geht=% | sprechen_geht=% | falsche_art_abgelehnt=% | spalte_da=%',
    v_ok, v_alt, not v_falsch,
    exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'kc_club_anklopfen' and column_name = 'anruf_id' and data_type = 'uuid');
end $$;
