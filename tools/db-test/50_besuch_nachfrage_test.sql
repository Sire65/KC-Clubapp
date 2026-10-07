-- KC-CLUB-SCHULUNG-NACHFRAGE (2.35.0): Probelauf der Migration (Transaktion bricht am Ende absichtlich ab → nichts bleibt).
do $$
declare v_id text := 'B-2099-901'; v_falsch text := 'ok'; v_prog text;
begin
  insert into kc_besuche (besuch_id, person_ids, mitglied, datum, status, installiert_auf, programme)
    values (v_id, array['KC-P-ZZTEST1'], 'Test', '2099-01-01', 'fertig', array['notebook', 'leih'], array['bilderrechner', 'clubapp']);
  select array_to_string(programme, ',') into v_prog from kc_besuche where besuch_id = v_id;
  begin
    update kc_besuche set installiert_auf = array['toaster'] where besuch_id = v_id;
    v_falsch := 'geraet_unbekannt_angenommen';
  exception when check_violation then null; end;
  update kc_besuche set nachfrage_erinnert_am = now(), nachfrage_gesendet_am = now(), nachfrage_aus = true where besuch_id = v_id;
  raise exception 'TESTBERICHT programme=% | falsch=%', v_prog, v_falsch;
end $$;
