-- KC-CLUB-MAE (2.26.0): Probelauf der Migration (läuft in einer Transaktion, die am Ende absichtlich abbricht → nichts bleibt).
do $$
declare v_ttt int; v_mae uuid; v_falsch text := 'ok';
begin
  select count(*) into v_ttt from kc_club_spiele;
  insert into kc_club_spiele (spiel, groesse, von, an, spieler_x, spieler_o, brett, dran, mae)
    values ('mae', 4, 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'mae', 'KC-P-ZZTEST1', '{"sitze":[],"n":0}'::jsonb) returning id into v_mae;
  begin
    insert into kc_club_spiele (spiel, groesse, von, an, spieler_x, spieler_o, brett, dran) values ('mae', 4, 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'mae', 'KC-P-ZZTEST1');
    v_falsch := 'ohne_stand_angenommen';
  exception when check_violation then null; end;
  begin
    insert into kc_club_spiele (spiel, groesse, von, an, spieler_x, spieler_o, brett, dran, mae) values ('mae', 3, 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'mae', 'KC-P-ZZTEST1', '{}'::jsonb);
    v_falsch := 'groesse_3_angenommen';
  exception when check_violation then null; end;
  raise exception 'TESTBERICHT mae_angelegt=% | falsch=% | vorher=%', (v_mae is not null)::text, v_falsch, v_ttt;
end $$;
