-- KC-COMM-WARTEN Nachschärfung: Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt.
do $$
declare pc jsonb;
begin
  select public_config into pc from public.kc_communication_providers where id = 'email-webde';
  raise exception 'TESTBERICHT pro_minute_3=% | pro_stunde_20=% | rest_bleibt=% | brevo_unveraendert=%',
    (pc->>'bremseProMinute') = '3', (pc->>'bremseProStunde') = '20', (pc->>'host') = 'smtp.web.de' and (pc->>'zeroCost') = 'true',
    not exists (select 1 from public.kc_communication_providers where id = 'email-brevo' and public_config ? 'bremseProMinute');
end $$;
