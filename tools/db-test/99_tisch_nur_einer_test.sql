-- KC-CLUB-RUNDER-TISCH-ZEITCHECK (2.764.0): Probelauf in Supabase – nach der Migration 20261030_kc_club_v2764_tisch_nur_einer.sql in derselben
-- Transaktion, bricht am Ende absichtlich ab (nichts bleibt). Gastgeber: erste aktive Person aus kc_core_people (nur gelesen).
do $$
declare p text; a uuid; doppelt boolean := false; angrenzend boolean := true; abgesagt_frei boolean := true; verlaengern_gesperrt boolean := false; andere_gruppe boolean := false;
begin
  select person_id into p from public.kc_core_people where active order by person_id limit 1;
  insert into public.kc_club_tisch (thema, beginn, dauer_min, ende, gastgeber) values ('A', '2030-01-10 19:00+00', 60, '2030-01-10 20:00+00', p) returning id into a;
  begin insert into public.kc_club_tisch (art, thema, beginn, dauer_min, ende, gastgeber) values ('seminar', 'B', '2030-01-10 19:30+00', 60, '2030-01-10 20:30+00', p); exception when exclusion_violation then doppelt := true; end;
  begin insert into public.kc_club_tisch (thema, beginn, dauer_min, ende, gastgeber) values ('C', '2030-01-10 20:00+00', 30, '2030-01-10 20:30+00', p); exception when exclusion_violation then angrenzend := false; end;
  begin update public.kc_club_tisch set ende = '2030-01-10 20:30+00', verlaengert_min = 30 where id = a; exception when exclusion_violation then verlaengern_gesperrt := true; end;
  begin insert into public.kc_club_tisch (thema, beginn, dauer_min, ende, gastgeber, status) values ('D', '2030-01-10 19:00+00', 60, '2030-01-10 20:00+00', p, 'abgesagt'); exception when exclusion_violation then abgesagt_frei := false; end;
  begin insert into public.kc_club_tisch (thema, beginn, dauer_min, ende, gastgeber, gruppe_id) values ('E', '2030-01-10 19:15+00', 30, '2030-01-10 19:45+00', p, gen_random_uuid()); exception when exclusion_violation then andere_gruppe := true; end;
  raise exception 'TESTBERICHT gleichzeitig_gesperrt=% | angrenzend_erlaubt=% | verlaengern_in_naechsten_gesperrt=% | abgesagt_zaehlt_nicht=% | auch_gruppen_tisch_gesperrt=%',
    doppelt, angrenzend, verlaengern_gesperrt, abgesagt_frei, andere_gruppe;
end $$;
