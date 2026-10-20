-- KC-COMM-WARTEN (2.520.0): Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt.
do $$
declare c text;
begin
  select command into c from cron.job where jobname = 'kc-club-geplant-minute';
  raise exception 'TESTBERICHT zeitplan_da=% | jede_minute=% | geplant_bleibt=% | warteschlange_neu=% | ein_job=%',
    c is not null,
    (select schedule = '* * * * *' from cron.job where jobname = 'kc-club-geplant-minute'),
    position('kc_club_geplant where status = ''offen'' and senden_um <= now()' in c) > 0,
    position('kc_communication_requests where status = ''queued'' and scheduled_for <= now()' in c) > 0,
    (select count(*) = 1 from cron.job where jobname = 'kc-club-geplant-minute');
end $$;
