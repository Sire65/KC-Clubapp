-- KC-CLUB-TA-PROTOKOLL: Probelauf in Supabase – nach der Migration 20261113_kc_club_terminanfrage_protokoll.sql in derselben
-- Transaktion, bricht am Ende absichtlich ab (nichts bleibt). Ersteller: erste aktive Person aus kc_core_people (nur gelesen).
do $$
declare p text; a1 uuid; leer boolean; tops int; alt_leer boolean;
begin
  select person_id into p from public.kc_core_people where active order by person_id limit 1;
  insert into public.kc_club_terminanfragen (erstellt_von, anlass, beginn) values (p, 'Test', '2030-01-10 19:00+00') returning id into a1;
  select protokoll is null into leer from public.kc_club_terminanfragen where id = a1;
  update public.kc_club_terminanfragen set protokoll = '{"tops":[{"t":"A","ergebnis":"x"},{"t":"B"}],"status":"entwurf"}'::jsonb where id = a1;
  select jsonb_array_length(protokoll->'tops') into tops from public.kc_club_terminanfragen where id = a1;
  select not exists (select 1 from public.kc_club_terminanfragen where protokoll is not null and id <> a1) into alt_leer;
  raise exception 'TESTBERICHT anfangs_leer=% | tops=% | bestehende_leer=%', leer, tops, alt_leer;
end $$;
