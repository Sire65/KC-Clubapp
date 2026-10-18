-- KC-CLUB-OBJEKT-ANLAGEN: Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt.
do $$
declare o uuid := gen_random_uuid(); a1 uuid := gen_random_uuid(); ok_art bool := false; ok_doppelt bool := false; n int; rls bool; anon bool;
begin
  insert into public.kc_club_objekt_anlagen (art, objekt_id, attachment_id) values ('vorschlag', o, a1);
  begin insert into public.kc_club_objekt_anlagen (art, objekt_id, attachment_id) values ('quatsch', o, a1); exception when check_violation then ok_art := true; end;
  begin insert into public.kc_club_objekt_anlagen (art, objekt_id, attachment_id) values ('vorschlag', o, a1); exception when unique_violation then ok_doppelt := true; end;
  select count(*) into n from public.kc_club_objekt_anlagen where objekt_id = o;
  select relrowsecurity into rls from pg_class where oid = 'public.kc_club_objekt_anlagen'::regclass;
  anon := has_table_privilege('anon', 'public.kc_club_objekt_anlagen', 'select') or has_table_privilege('authenticated', 'public.kc_club_objekt_anlagen', 'select');
  raise exception 'TESTBERICHT gespeichert=% | art_geprueft=% | doppelt_verhindert=% | rls=% | kein_zugriff_ohne_server=%', n = 1, ok_art, ok_doppelt, rls, not anon;
end $$;
