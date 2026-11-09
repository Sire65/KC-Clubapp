-- KC-CLUB-ANFRAGE-GEGENVORSCHLAG: Probelauf in Supabase – nach der Migration 20261109_kc_club_terminanfrage_gegenvorschlag.sql in derselben
-- Transaktion, bricht am Ende absichtlich ab (nichts bleibt). Ersteller: erste aktive Person aus kc_core_people (nur gelesen).
do $$
declare p text; a1 uuid; a2 uuid; std boolean; aus boolean; alt_ok boolean;
begin
  select person_id into p from public.kc_core_people where active order by person_id limit 1;
  insert into public.kc_club_terminanfragen (erstellt_von, anlass, beginn) values (p, 'Test A', '2030-01-10 19:00+00') returning id into a1;
  insert into public.kc_club_terminanfragen (erstellt_von, anlass, beginn, gegenvorschlag) values (p, 'Test B', '2030-01-10 19:00+00', false) returning id into a2;
  select gegenvorschlag into std from public.kc_club_terminanfragen where id = a1;
  select gegenvorschlag into aus from public.kc_club_terminanfragen where id = a2;
  select not exists (select 1 from public.kc_club_terminanfragen where gegenvorschlag is distinct from true and id not in (a2)) into alt_ok;
  raise exception 'TESTBERICHT standard_erlaubt=% | abschaltbar=% | bestehende_erlaubt=%', std, not aus, alt_ok;
end $$;
