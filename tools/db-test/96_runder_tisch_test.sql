-- KC-CLUB-RUNDER-TISCH (2.762.0): Probelauf in Supabase – nach der Migration 20261030_kc_club_v2762_runder_tisch.sql in derselben Transaktion,
-- bricht am Ende absichtlich ab (nichts bleibt). Personen: die ersten aktiven aus kc_core_people (nur gelesen, alles zurückgerollt).
do $$
declare p text[]; th uuid; t uuid; voll text; da text; nach_ablauf text; zweimal int; chat int; zu_frueh text; vorbei text; abgesagt text; i int;
begin
  select array_agg(person_id order by person_id) into p from (select person_id from public.kc_core_people where active order by person_id limit 7) x;
  insert into public.kc_communication_threads (org_id, subject, created_by_person_id) values ('KC_WERNE', '🪑 Probe', p[1]) returning id into th;
  insert into public.kc_club_tisch (thema, beginn, dauer_min, ende, plaetze, gastgeber, thread_id)
    values ('Probe', now() - interval '5 minutes', 60, now() + interval '55 minutes', 4, p[1], th) returning id into t;
  for i in 2..5 loop perform public.kc_club_tisch_beitreten(t, p[i], 150, 15); end loop;
  voll := public.kc_club_tisch_beitreten(t, p[6], 150, 15);
  da := public.kc_club_tisch_beitreten(t, p[3], 150, 15);
  update public.kc_club_tisch_teilnahme set zuletzt_da = now() - interval '10 minutes' where tisch_id = t and person_id = p[2];  -- App ohne Herzschlag
  nach_ablauf := public.kc_club_tisch_beitreten(t, p[6], 150, 15);
  select count(*) into zweimal from public.kc_club_tisch_teilnahme where tisch_id = t and person_id = p[3];
  select count(*) into chat from public.kc_communication_thread_participants where thread_id = th;
  update public.kc_club_tisch set beginn = now() + interval '1 hour', ende = now() + interval '2 hours' where id = t;
  zu_frueh := public.kc_club_tisch_beitreten(t, p[7], 150, 15);
  update public.kc_club_tisch set beginn = now() - interval '2 hours', ende = now() - interval '1 hour' where id = t;
  vorbei := public.kc_club_tisch_beitreten(t, p[7], 150, 15);
  update public.kc_club_tisch set status = 'abgesagt' where id = t;
  abgesagt := public.kc_club_tisch_beitreten(t, p[7], 150, 15);
  raise exception 'TESTBERICHT voll=% | herzschlag=% | platz_frei_nach_ablauf=% | eine_zeile=% | chat_teilnehmer=% | zu_frueh=% | vorbei=% | abgesagt=% | neunzehn_verboten=% | nur_server=%',
    voll, da, nach_ablauf, zweimal, chat, zu_frueh, vorbei, abgesagt,
    exists (select 1 from pg_constraint where conrelid = 'public.kc_club_tisch'::regclass and pg_get_constraintdef(oid) like '%plaetze%18%'),
    not has_function_privilege('anon', 'public.kc_club_tisch_beitreten(uuid, text, integer, integer)', 'execute') and has_function_privilege('service_role', 'public.kc_club_tisch_beitreten(uuid, text, integer, integer)', 'execute');
end $$;
