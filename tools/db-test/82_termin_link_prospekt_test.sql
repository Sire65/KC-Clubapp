-- KC-CLUB-TERMIN-LINK-PROSPEKT: Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt.
do $$
declare tid uuid; ok_link bool := false; ok_falsch bool := false; ok_art bool := false; lb bool;
begin
  insert into public.kc_club_treffen (titel, beginn, art, link, im_laufband, erstellt_von) values ('TEST Adventsmarkt', now() + interval '10 days', 'veranstaltung', 'https://www.freilichtbuehne-werne.de/', true, 'KC-P-TEST') returning id, im_laufband into tid, lb;
  ok_link := true;
  begin update public.kc_club_treffen set link = 'javascript:alert(1)' where id = tid; exception when check_violation then ok_falsch := true; end;
  insert into public.kc_club_objekt_anlagen (art, objekt_id, attachment_id) values ('treffen', tid, gen_random_uuid()); ok_art := true;
  raise exception 'TESTBERICHT link_ok=% | falscher_link_abgewiesen=% | anlage_treffen=% | im_laufband=%', ok_link, ok_falsch, ok_art, lb;
end $$;
