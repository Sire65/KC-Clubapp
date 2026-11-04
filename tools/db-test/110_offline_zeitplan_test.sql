-- KC-CLUB-OFFLINE-PUSH: Probelauf in Supabase – nach der Migration in derselben Transaktion, bricht am Ende absichtlich ab (nichts bleibt).
do $$
declare cmd text; n int; ok_sql boolean := true;
begin
  select command into cmd from cron.job where jobname = 'kc-club-geplant-minute';
  select count(*) into n from cron.job where jobname = 'kc-club-geplant-minute';
  begin
    perform 1 from public.kc_club_person_einstellung
      where schluessel = 'online_seit' and (wert->>'zuletzt')::timestamptz between now() - interval '25 minutes' and now() - interval '330 seconds'
        and coalesce(wert->>'offline', '') <> coalesce(wert->>'seit', '') and person_id not like 'KC-P-TEST%';
  exception when others then ok_sql := false;
  end;
  raise exception 'TESTBERICHT ein_zeitplan=% | offline_bedingung=% | wecker_bleibt=% | abfrage_laeuft=%',
    n = 1, cmd like '%online_seit%', cmd like '%kc_club_wecker%', ok_sql;
end $$;
