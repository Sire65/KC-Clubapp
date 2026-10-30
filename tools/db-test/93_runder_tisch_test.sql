-- KC-CLUB-RUNDER-TISCH (2.760.0): Probelauf der Platzgrenze. Lokal (leere Datenbank, Nachbau unten) oder in Supabase nach der Migration
-- in derselben Transaktion – bricht am Ende absichtlich ab (nichts bleibt). Testpersonen KC-P-ZZRT…, keine Echtdaten.
-- Lokal:  psql -d t1 -f tools/db-test/93_runder_tisch_test.sql   (legt den Nachbau selbst an, wenn die Tabellen fehlen)
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; end if;
  if to_regclass('public.kc_communication_threads') is null then
    create table public.kc_communication_threads (id uuid primary key default gen_random_uuid(), org_id text, subject text, created_by_person_id text, updated_at timestamptz);
    create table public.kc_communication_thread_participants (thread_id uuid references public.kc_communication_threads(id) on delete cascade, person_id text, last_read_at timestamptz, hidden_at timestamptz, primary key (thread_id, person_id));
    create table public.kc_db_mirror_table_rules (table_name text primary key, area text, sensitivity text, realtime_allowed boolean, mirror_enabled boolean, backup_enabled boolean, note text);
    create table public.kc_neon_resume_tables (table_name text primary key);
  end if;
end $$;
\ir ../../supabase/migrations/20261030_kc_club_v2760_runder_tisch.sql
do $$
declare th uuid; t uuid; r text; i int; voll text; nach_ablauf text; zu_frueh text; vorbei text; abgesagt text; da text; zweimal int; chat int;
begin
  insert into public.kc_communication_threads (subject) values ('🪑 Probe') returning id into th;
  insert into public.kc_club_tisch (thema, beginn, dauer_min, ende, plaetze, gastgeber, thread_id)
    values ('Probe', now() - interval '5 minutes', 60, now() + interval '55 minutes', 4, 'KC-P-ZZRT0', th) returning id into t;
  for i in 1..4 loop perform public.kc_club_tisch_beitreten(t, 'KC-P-ZZRT' || i, 150, 15); end loop;
  voll := public.kc_club_tisch_beitreten(t, 'KC-P-ZZRT5', 150, 15);
  da := public.kc_club_tisch_beitreten(t, 'KC-P-ZZRT2', 150, 15);
  update public.kc_club_tisch_teilnahme set zuletzt_da = now() - interval '10 minutes' where person_id = 'KC-P-ZZRT1';  -- App ohne Herzschlag
  nach_ablauf := public.kc_club_tisch_beitreten(t, 'KC-P-ZZRT5', 150, 15);
  select count(*) into zweimal from public.kc_club_tisch_teilnahme where tisch_id = t and person_id = 'KC-P-ZZRT2';
  select count(*) into chat from public.kc_communication_thread_participants where thread_id = th;
  update public.kc_club_tisch set beginn = now() + interval '1 hour', ende = now() + interval '2 hours' where id = t;
  zu_frueh := public.kc_club_tisch_beitreten(t, 'KC-P-ZZRT6', 150, 15);
  update public.kc_club_tisch set beginn = now() - interval '2 hours', ende = now() - interval '1 hour' where id = t;
  vorbei := public.kc_club_tisch_beitreten(t, 'KC-P-ZZRT6', 150, 15);
  update public.kc_club_tisch set status = 'abgesagt' where id = t;
  abgesagt := public.kc_club_tisch_beitreten(t, 'KC-P-ZZRT6', 150, 15);
  raise exception 'TESTBERICHT voll=% | herzschlag=% | platz_frei_nach_ablauf=% | eine_zeile=% | chat_teilnehmer=% | zu_frueh=% | vorbei=% | abgesagt=% | neunzehn_verboten=% | nur_server=%',
    voll, da, nach_ablauf, zweimal, chat, zu_frueh, vorbei, abgesagt,
    exists (select 1 from pg_constraint where conrelid = 'public.kc_club_tisch'::regclass and pg_get_constraintdef(oid) like '%plaetze%18%'),
    not has_function_privilege('anon', 'public.kc_club_tisch_beitreten(uuid, text, integer, integer)', 'execute') and has_function_privilege('service_role', 'public.kc_club_tisch_beitreten(uuid, text, integer, integer)', 'execute');
end $$;
