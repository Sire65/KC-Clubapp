-- KC-CLUB-RUNDER-TISCH-GAST (2.775.0): Probelauf in Supabase – nach der Migration 20261030_kc_club_v2775_tisch_gast.sql in derselben Transaktion,
-- bricht am Ende absichtlich ab (nichts bleibt). Gastgeber: die erste aktive Person aus kc_core_people (nur gelesen, alles zurückgerollt).
do $$
declare p text; t uuid; g1 uuid; g2 uuid; zurueck uuid; erst text; herz text; zweiter text; weg text; voll text; im_chat integer; zu_frueh text;
begin
  select person_id into p from public.kc_core_people where active order by person_id limit 1;
  insert into public.kc_club_tisch (art, thema, beginn, dauer_min, ende, plaetze, gastgeber, gruppe_id) values ('besprechung', 'Probe mit Gast', now(), 60, now() + interval '1 hour', 4, p, null) returning id into t;
  insert into public.kc_club_tisch_gast (tisch_id, name, link_hash, eingeladen_von) values (t, 'Dr. Probe', repeat('a', 64), p) returning id into g1;
  insert into public.kc_club_tisch_gast (tisch_id, name, link_hash, eingeladen_von) values (t, 'Zweiter Gast', repeat('b', 64), p) returning id into g2;
  insert into public.kc_club_tisch_gast (tisch_id, name, link_hash, eingeladen_von, zurueckgezogen_am) values (t, 'Zurückgezogen', repeat('c', 64), p, now()) returning id into zurueck;
  erst := public.kc_club_tisch_gast_beitreten(g1, 150, 30);
  herz := public.kc_club_tisch_gast_beitreten(g1, 150, 30);
  weg := public.kc_club_tisch_gast_beitreten(zurueck, 150, 30);
  -- Tisch voll: 4 Plätze, 1 Gast + 3 Platzhalter sitzen → zweiter Gast bekommt keinen Platz
  insert into public.kc_club_tisch_teilnahme (tisch_id, person_id, dabei_seit, zuletzt_da) values (t, 'P-1', now(), now()), (t, 'P-2', now(), now()), (t, 'P-3', now(), now());
  voll := public.kc_club_tisch_gast_beitreten(g2, 150, 30);
  select count(*) into im_chat from public.kc_communication_thread_participants where person_id like 'TG-%';
  update public.kc_club_tisch set beginn = now() + interval '2 hours', ende = now() + interval '3 hours' where id = t;
  zu_frueh := public.kc_club_tisch_gast_beitreten(g2, 150, 30);
  raise exception 'TESTBERICHT gast_platz=% | gast_herzschlag=% | zurueckgezogen=% | tisch_voll=% | gaeste_im_chat=% | zu_frueh=%',
    erst, herz, weg, voll, im_chat, zu_frueh;
end $$;
