-- KC-CLUB-VORSCHLAG-SPAETER (2.527.0): Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt (erstellt_von braucht eine echte Person).
do $$
declare v uuid; ok_grenze bool := false;
begin
  insert into public.kc_club_vorschlaege (art, titel, erstellt_von, sitzung_nr, sitzung_ab) values ('thema', 'Test', 'KC-P-002', 2, now()) returning id into v;
  begin insert into public.kc_club_vorschlaege (art, titel, erstellt_von, sitzung_nr) values ('thema', 'Test', 'KC-P-002', 4); exception when check_violation then ok_grenze := true; end;
  raise exception 'TESTBERICHT angelegt=% | nr_gemerkt=% | nur_1_bis_3=% | alte_ohne_nr=%',
    v is not null, (select sitzung_nr = 2 and sitzung_ab is not null from public.kc_club_vorschlaege where id = v), ok_grenze,
    not exists (select 1 from public.kc_club_vorschlaege where id <> v and sitzung_nr is not null);
end $$;
