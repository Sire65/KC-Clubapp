-- KICC-F-104: Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt.
-- Prüft: alte Datenfluss-Messwerte (> 30 Tage) weg, neue bleiben; abgeschlossene Versandaufträge > 180 Tage weg
-- (Zustellmeldungen per Cascade mit), offene alte Aufträge bleiben; Cron-Eintrag vorhanden.
do $$
declare i_alt bigint; i_neu bigint; r_alt uuid := gen_random_uuid(); r_offen uuid := gen_random_uuid(); r_neu uuid := gen_random_uuid();
  res jsonb; flow_alt_weg bool; flow_neu_da bool; req_alt_weg bool; req_offen_da bool; req_neu_da bool; meldung_weg bool; cron_da bool;
begin
  select coalesce(max(id), 0) + 1 into i_alt from public.kicc_program_flow_events; i_neu := i_alt + 1;
  insert into public.kicc_program_flow_events (id, program_id, instance_id, source_id, target_id, flow_type, measured_at, received_at)
  values (i_alt, 'test', 'test', 'a', 'b', 'TEST', now() - interval '40 days', now() - interval '40 days'),
         (i_neu, 'test', 'test', 'a', 'b', 'TEST', now() - interval '5 days', now() - interval '5 days');
  insert into public.kc_communication_requests (id, channel, status, created_at) values
    (r_alt, 'push', 'sent', now() - interval '200 days'),
    (r_offen, 'push', 'retry_scheduled', now() - interval '200 days'),
    (r_neu, 'push', 'sent', now() - interval '10 days');
  insert into public.kc_communication_delivery_events (request_id, event_type, created_at) values (r_alt, 'sent', now() - interval '200 days');
  res := kc_internal.kc_protokolle_aufraeumen();
  flow_alt_weg := not exists (select 1 from public.kicc_program_flow_events where id = i_alt);
  flow_neu_da := exists (select 1 from public.kicc_program_flow_events where id = i_neu);
  req_alt_weg := not exists (select 1 from public.kc_communication_requests where id = r_alt);
  req_offen_da := exists (select 1 from public.kc_communication_requests where id = r_offen);
  req_neu_da := exists (select 1 from public.kc_communication_requests where id = r_neu);
  meldung_weg := not exists (select 1 from public.kc_communication_delivery_events where request_id = r_alt);
  cron_da := exists (select 1 from cron.job where jobname = 'kc-protokolle-aufraeumen' and schedule = '35 3 * * *' and active);
  raise exception 'TESTBERICHT flow_alt_weg=% | flow_neu_da=% | versand_alt_weg=% | versand_offen_da=% | versand_neu_da=% | zustellmeldung_weg=% | cron_da=%',
    flow_alt_weg, flow_neu_da, req_alt_weg, req_offen_da, req_neu_da, meldung_weg, cron_da;
end $$;
