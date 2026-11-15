-- KC-CLUB-GEGENVORSCHLAG: Probelauf in Supabase – nach der Migration 20261115_kc_club_vorschlag_gegen.sql in derselben
-- Transaktion, bricht am Ende absichtlich ab (nichts bleibt). Ersteller: erste aktive Person aus kc_core_people (nur gelesen).
do $$
declare p text; a uuid; b uuid; gruppe int; nach_loeschen boolean; alt_leer boolean;
begin
  select person_id into p from public.kc_core_people where active order by person_id limit 1;
  insert into public.kc_club_vorschlaege (art, titel, erstellt_von) values ('thema', 'Test A', p) returning id into a;
  insert into public.kc_club_vorschlaege (art, titel, erstellt_von, gegen_zu) values ('thema', 'Test B', p, a) returning id into b;
  select count(*) into gruppe from public.kc_club_vorschlaege where id = a or gegen_zu = a;
  select not exists (select 1 from public.kc_club_vorschlaege where gegen_zu is not null and id not in (a, b)) into alt_leer;
  delete from public.kc_club_vorschlaege where id = a;
  select gegen_zu is null into nach_loeschen from public.kc_club_vorschlaege where id = b;
  raise exception 'TESTBERICHT gruppe=% | bestehende_leer=% | a_geloescht_b_frei=%', gruppe, alt_leer, nach_loeschen;
end $$;
