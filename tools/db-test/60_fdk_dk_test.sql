-- KC-CLUB-FDK-MG + KC-CLUB-DK-MG (2.216.0): Probelauf der Migration (läuft in einer Transaktion, die am Ende absichtlich abbricht → nichts bleibt).
do $$
declare v_alt int; v_fdk uuid; v_dk uuid; v_falsch text := 'ok';
begin
  select count(*) into v_alt from kc_club_spiele;
  insert into kc_club_spiele (spiel, groesse, von, an, spieler_x, spieler_o, brett, dran, fdk)
    values ('fdk', 24, 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'fdk', 'KC-P-ZZTEST1', '{"sp":[],"n":0}'::jsonb) returning id into v_fdk;
  insert into kc_club_spiele (spiel, groesse, von, an, spieler_x, spieler_o, brett, dran, dk)
    values ('dk', 4, 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'dk', 'KC-P-ZZTEST1', '{"hand":[],"n":0}'::jsonb) returning id into v_dk;
  begin
    insert into kc_club_spiele (spiel, groesse, von, an, spieler_x, spieler_o, brett, dran) values ('fdk', 24, 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'fdk', 'KC-P-ZZTEST1');
    v_falsch := 'fdk_ohne_stand_angenommen';
  exception when check_violation then null; end;
  begin
    insert into kc_club_spiele (spiel, groesse, von, an, spieler_x, spieler_o, brett, dran, dk) values ('dk', 3, 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'dk', 'KC-P-ZZTEST1', '{}'::jsonb);
    v_falsch := 'dk_groesse_3_angenommen';
  exception when check_violation then null; end;
  begin
    insert into kc_club_spiele (spiel, groesse, von, an, spieler_x, spieler_o, brett, dran, mae) values ('mae', 4, 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'KC-P-ZZTEST1', 'KC-P-ZZTEST2', 'mae', 'KC-P-ZZTEST1', '{"sitze":[]}'::jsonb);
  exception when check_violation then v_falsch := 'mae_kaputt'; end;
  raise exception 'TESTBERICHT fdk_angelegt=% | dk_angelegt=% | falsch=% | vorher=%', (v_fdk is not null)::text, (v_dk is not null)::text, v_falsch, v_alt;
end $$;
