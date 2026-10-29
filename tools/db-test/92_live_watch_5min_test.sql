-- KC-LIVE-WATCH-5MIN: Probelauf in Supabase – nach der Migration in derselben Transaktion, bricht am Ende absichtlich ab (nichts bleibt).
do $$
declare j record;
begin
  select * into j from cron.job where jobname = 'kc-live-operations-watch-minute';
  raise exception 'TESTBERICHT fuenf_minuten=% | aktiv=% | ziel_gleich=% | einmal=%',
    j.schedule = '*/5 * * * *', j.active, j.command like '%/functions/v1/kc-live-operations-watch?run=1%',
    (select count(*) = 1 from cron.job where jobname = 'kc-live-operations-watch-minute');
end $$;
