-- KC-CLUB-RUNDER-TISCH-GRUPPE (2.762.0): Probelauf in Supabase – nach der Migration 20261030_kc_club_v2762_tisch_gruppe.sql in derselben Transaktion,
-- bricht am Ende absichtlich ab (nichts bleibt). Personen: die ersten aktiven aus kc_core_people (nur gelesen, alles zurückgerollt).
do $$
declare p text[]; g uuid; t uuid; s uuid; fremd text; mitglied text; leiter text; offen text; sem_ohne text; sem_mit text;
begin
  select array_agg(person_id order by person_id) into p from (select person_id from public.kc_core_people where active order by person_id limit 4) x;
  insert into public.kc_communication_threads (org_id, subject, created_by_person_id) values ('KC_WERNE', '💡 Probe-Gruppe', p[1]) returning id into g;
  insert into public.kc_communication_thread_participants (thread_id, person_id) values (g, p[2]), (g, p[3]);
  insert into public.kc_club_tisch (thema, beginn, dauer_min, ende, plaetze, gastgeber, gruppe_id) values ('Ideen', now(), 60, now() + interval '1 hour', 4, p[1], g) returning id into t;
  fremd := public.kc_club_tisch_beitreten(t, p[4], 150, 15);
  mitglied := public.kc_club_tisch_beitreten(t, p[2], 150, 15);
  leiter := public.kc_club_tisch_beitreten(t, p[1], 150, 15);
  update public.kc_club_tisch set gruppe_id = null where id = t;
  offen := public.kc_club_tisch_beitreten(t, p[4], 150, 15);
  insert into public.kc_club_tisch (art, thema, beginn, dauer_min, ende, plaetze, gastgeber, gruppe_id) values ('seminar', 'Gruppen-Seminar', now(), 60, now() + interval '1 hour', 4, p[1], g) returning id into s;
  sem_ohne := public.kc_club_tisch_beitreten(s, p[3], 150, 15);
  insert into public.kc_club_tisch_teilnahme (tisch_id, person_id, zusage) values (s, p[3], 'ja');
  sem_mit := public.kc_club_tisch_beitreten(s, p[3], 150, 15);
  raise exception 'TESTBERICHT nicht_in_gruppe=% | gruppenmitglied=% | leitung=% | ohne_gruppe_offen=% | gruppen_seminar_ohne_anmeldung=% | gruppen_seminar_angemeldet=%',
    fremd, mitglied, leiter, offen, sem_ohne, sem_mit;
end $$;
