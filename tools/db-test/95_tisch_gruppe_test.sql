-- KC-CLUB-RUNDER-TISCH-GRUPPE (2.762.0): Probelauf Gruppen-Tisch. Wie 93/94: lokal (Nachbau) oder in Supabase nach allen drei Migrationen in derselben
-- Transaktion – bricht am Ende absichtlich ab (nichts bleibt). Testpersonen KC-P-ZZRT…, keine Echtdaten.
-- Lokal:  psql -d t1 -f tools/db-test/95_tisch_gruppe_test.sql
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
\ir ../../supabase/migrations/20261030_kc_club_v2761_tisch_arten.sql
\ir ../../supabase/migrations/20261030_kc_club_v2762_tisch_gruppe.sql
do $$
declare g uuid; t uuid; s uuid; fremd text; mitglied text; leiter text; offen text; sem_ohne text; sem_mit text;
begin
  insert into public.kc_communication_threads (subject) values ('💡 Innovation') returning id into g;
  insert into public.kc_communication_thread_participants (thread_id, person_id) values (g, 'KC-P-ZZRT1'), (g, 'KC-P-ZZRT2');
  insert into public.kc_club_tisch (thema, beginn, dauer_min, ende, plaetze, gastgeber, gruppe_id) values ('Ideen', now(), 60, now() + interval '1 hour', 4, 'KC-P-ZZLEIT', g) returning id into t;
  fremd := public.kc_club_tisch_beitreten(t, 'KC-P-ZZRT9', 150, 15);
  mitglied := public.kc_club_tisch_beitreten(t, 'KC-P-ZZRT1', 150, 15);
  leiter := public.kc_club_tisch_beitreten(t, 'KC-P-ZZLEIT', 150, 15);
  update public.kc_club_tisch set gruppe_id = null where id = t;
  offen := public.kc_club_tisch_beitreten(t, 'KC-P-ZZRT9', 150, 15);
  insert into public.kc_club_tisch (art, thema, beginn, dauer_min, ende, plaetze, gastgeber, gruppe_id) values ('seminar', 'Gruppen-Seminar', now(), 60, now() + interval '1 hour', 4, 'KC-P-ZZLEIT', g) returning id into s;
  sem_ohne := public.kc_club_tisch_beitreten(s, 'KC-P-ZZRT2', 150, 15);
  insert into public.kc_club_tisch_teilnahme (tisch_id, person_id, zusage) values (s, 'KC-P-ZZRT2', 'ja');
  sem_mit := public.kc_club_tisch_beitreten(s, 'KC-P-ZZRT2', 150, 15);
  raise exception 'TESTBERICHT nicht_in_gruppe=% | gruppenmitglied=% | leitung=% | ohne_gruppe_offen=% | gruppen_seminar_ohne_anmeldung=% | gruppen_seminar_angemeldet=%',
    fremd, mitglied, leiter, offen, sem_ohne, sem_mit;
end $$;
