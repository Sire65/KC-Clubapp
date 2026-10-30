-- KC-CLUB-SCHILDER-ABLAGE: Probelauf in Supabase – nach der Migration in derselben Transaktion, bricht am Ende absichtlich ab (nichts bleibt).
do $$
declare o record; n int;
begin
  select count(*) into n from public.kc_club_archiv_ordner where titel = 'Schilder' and besitzer is null and geloescht_am is null;
  select * into o from public.kc_club_archiv_ordner where titel = 'Schilder' and besitzer is null and geloescht_am is null limit 1;
  raise exception 'TESTBERICHT genau_einer=% | nur_clubleitung=% | register_da=% | club_ordner=%',
    n = 1, o.nur_vorstand, o.register @> array['Preislisten', 'Hinweise', 'Öffnungszeiten', 'Sonstiges'], o.art = 'sonstiges' and o.besitzer is null;
end $$;
