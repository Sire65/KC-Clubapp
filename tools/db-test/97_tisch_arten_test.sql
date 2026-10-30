-- KC-CLUB-RUNDER-TISCH-ARTEN (2.762.0): Probelauf in Supabase – nach der Migration 20261030_kc_club_v2762_tisch_arten.sql in derselben Transaktion,
-- bricht am Ende absichtlich ab (nichts bleibt). Personen: die ersten aktiven aus kc_core_people (nur gelesen, alles zurückgerollt).
do $$
declare p text[]; s uuid; r uuid; ohne text; mit text; referent text; tisch_frei text; alt text; falsche_art boolean := false; zu_lang boolean := false;
begin
  select array_agg(person_id order by person_id) into p from (select person_id from public.kc_core_people where active order by person_id limit 3) x;
  insert into public.kc_club_tisch (art, thema, beginn, dauer_min, ende, plaetze, gastgeber) values ('seminar', 'Probe-Seminar', now(), 60, now() + interval '1 hour', 4, p[1]) returning id into s;
  insert into public.kc_club_tisch_teilnahme (tisch_id, person_id, zusage) values (s, p[2], 'ja');
  ohne := public.kc_club_tisch_beitreten(s, p[3], 150, 15);
  mit := public.kc_club_tisch_beitreten(s, p[2], 150, 15);
  referent := public.kc_club_tisch_beitreten(s, p[1], 150, 15);
  update public.kc_club_tisch set status = 'abgesagt' where id = s;  -- 2.763.0: immer nur ein Tisch zur selben Zeit
  insert into public.kc_club_tisch (thema, beginn, dauer_min, ende, plaetze, gastgeber) values ('Probe-Tisch', now(), 60, now() + interval '1 hour', 4, p[1]) returning id into r;
  tisch_frei := public.kc_club_tisch_beitreten(r, p[3], 150, 15);
  select art into alt from public.kc_club_tisch where id = r;
  begin insert into public.kc_club_tisch (art, thema, beginn, dauer_min, ende, gastgeber) values ('konferenz', 'x', now(), 60, now() + interval '1 hour', p[1]); exception when check_violation then falsche_art := true; end;
  begin insert into public.kc_club_tisch (art, tagesordnung, thema, beginn, dauer_min, ende, gastgeber) values ('besprechung', (select jsonb_agg(i) from generate_series(1, 13) i), 'x', now(), 60, now() + interval '1 hour', p[1]); exception when check_violation then zu_lang := true; end;
  raise exception 'TESTBERICHT seminar_ohne_anmeldung=% | seminar_angemeldet=% | referent=% | runder_tisch_spontan=% | standard_art=% | falsche_art_verboten=% | to_hoechstens_12=%',
    ohne, mit, referent, tisch_frei, alt, falsche_art, zu_lang;
end $$;
