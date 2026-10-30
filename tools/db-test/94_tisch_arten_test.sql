-- KC-CLUB-RUNDER-TISCH-ARTEN (2.761.0): Probelauf Seminar-Anmeldung und Arten. Wie 93: lokal (Nachbau) oder in Supabase nach beiden Migrationen in
-- derselben Transaktion – bricht am Ende absichtlich ab (nichts bleibt). Testpersonen KC-P-ZZRT…, keine Echtdaten.
-- Lokal:  psql -d t1 -f tools/db-test/94_tisch_arten_test.sql
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
do $$
declare s uuid; r uuid; ohne text; mit text; referent text; tisch_frei text; alt text; falsche_art boolean := false; zu_lang boolean := false;
begin
  insert into public.kc_club_tisch (art, thema, beginn, dauer_min, ende, plaetze, gastgeber) values ('seminar', 'Probe-Seminar', now(), 60, now() + interval '1 hour', 4, 'KC-P-ZZREF') returning id into s;
  insert into public.kc_club_tisch_teilnahme (tisch_id, person_id, zusage) values (s, 'KC-P-ZZRT1', 'ja');
  ohne := public.kc_club_tisch_beitreten(s, 'KC-P-ZZRT2', 150, 15);
  mit := public.kc_club_tisch_beitreten(s, 'KC-P-ZZRT1', 150, 15);
  referent := public.kc_club_tisch_beitreten(s, 'KC-P-ZZREF', 150, 15);
  insert into public.kc_club_tisch (thema, beginn, dauer_min, ende, plaetze, gastgeber) values ('Probe-Tisch', now(), 60, now() + interval '1 hour', 4, 'KC-P-ZZREF') returning id into r;
  tisch_frei := public.kc_club_tisch_beitreten(r, 'KC-P-ZZRT2', 150, 15);
  select art into alt from public.kc_club_tisch where id = r;
  begin insert into public.kc_club_tisch (art, thema, beginn, dauer_min, ende, gastgeber) values ('konferenz', 'x', now(), 60, now() + interval '1 hour', 'x'); exception when check_violation then falsche_art := true; end;
  begin insert into public.kc_club_tisch (art, tagesordnung, thema, beginn, dauer_min, ende, gastgeber) values ('besprechung', (select jsonb_agg(i) from generate_series(1, 13) i), 'x', now(), 60, now() + interval '1 hour', 'x'); exception when check_violation then zu_lang := true; end;
  raise exception 'TESTBERICHT seminar_ohne_anmeldung=% | seminar_angemeldet=% | referent=% | runder_tisch_spontan=% | standard_art=% | falsche_art_verboten=% | to_hoechstens_12=%',
    ohne, mit, referent, tisch_frei, alt, falsche_art, zu_lang;
end $$;
