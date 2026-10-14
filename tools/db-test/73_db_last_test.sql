-- KC-CLUB-DB-LAST: Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt.
-- Prüft: Quellen-Erkennung; erste Messung legt nur den Stand an; zweite Messung legt den Zuwachs je Quelle ab; Bericht liefert Stunden + Quellen.
do $$
declare q1 text; q2 text; q3 text; q4 text; q5 text; n0 int; n1 int; club bigint; b jsonb; v_id bigint;
begin
  q1 := public.kc_club_db_last_quelle('select x from public.kc_club_zugang', 'service_role');
  q2 := public.kc_club_db_last_quelle('BEGIN ISOLATION LEVEL READ COMMITTED', 'authenticator');
  q3 := public.kc_club_db_last_quelle('insert into cron.job_run_details (jobid) values ($1)', 'postgres');
  q4 := public.kc_club_db_last_quelle('select * from public.kc_manager_state_sections', 'authenticated');
  q5 := public.kc_club_db_last_quelle('select 1 from auth.users', 'supabase_auth_admin');
  delete from public.kc_club_db_last_stand; delete from public.kc_club_db_last;
  perform public.kc_club_db_last_messen();
  select count(*) into n0 from public.kc_club_db_last;
  select s.queryid into v_id from extensions.pg_stat_statements s where s.query ~* 'kc_club_' and s.calls > 10 limit 1;
  update public.kc_club_db_last_stand set calls = calls - 5 where queryid = v_id;
  perform pg_sleep(0);
  perform public.kc_club_db_last_messen();
  select count(*) into n1 from public.kc_club_db_last;
  select coalesce(sum(aufrufe), 0) into club from public.kc_club_db_last where quelle = 'Club-App';
  b := public.kc_club_db_last_bericht(7);
  raise exception 'TESTBERICHT club=% | leer=% | cron=% | verwaltung=% | anmeldung=% | erste_messung_leer=% | zweite_messung=% | club_zuwachs=% | bericht_stunde=%',
    q1 = 'Club-App', q2 is null, q3 = 'Zeitpläne (Cron)', q4 = 'Verwaltung / PC-Manager', q5 = 'Anmeldung (Supabase)', n0 = 0, n1 > 0, club >= 5,
    coalesce((b->0->>'h') ~ '^\d{4}-\d\d-\d\dT\d\d$', false);
end $$;
