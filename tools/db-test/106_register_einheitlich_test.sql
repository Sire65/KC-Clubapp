-- KC-CLUB-REGISTER-EINHEITLICH: Probelauf in Supabase – nach der Migration in derselben Transaktion, bricht am Ende absichtlich ab (nichts bleibt).
-- Nur Registernamen und Zählungen – keine Inhalte.
do $$
declare alt_reg int; alt_dok int; mitglieder int; ohne_ordner int; ordnung boolean;
begin
  select count(*) into alt_reg from public.kc_club_archiv_ordner o, unnest(o.register) r
   where o.besitzer is null and o.geloescht_am is null
     and regexp_replace(r, '^.* › ', '') in ('Allgemein', 'Einladung', 'Protokoll', 'Sitzungsprotokolle', 'Kassenbericht', 'Kassenprüfung');
  select count(*) into alt_dok from public.kc_club_archiv_dokumente d join public.kc_club_archiv_ordner o on o.id = d.ordner_id
   where o.besitzer is null and regexp_replace(coalesce(d.register, ''), '^.* › ', '') in ('Allgemein', 'Einladung', 'Protokoll', 'Sitzungsprotokolle', 'Kassenbericht', 'Kassenprüfung');
  select count(*) into mitglieder from public.kc_club_archiv_ordner m
   where m.besitzer is null and m.geloescht_am is null and m.titel = 'Mitglieder' and m.kennung is null
     and exists (select 1 from public.kc_club_archiv_ordner p where p.kennung = 'personal' and p.jahr = m.jahr and p.geloescht_am is null);
  select count(*) into ohne_ordner from public.kc_club_archiv_dokumente d join public.kc_club_archiv_ordner o on o.id = d.ordner_id
   where d.geloescht_am is null and o.geloescht_am is not null and o.titel = 'Mitglieder' and o.besitzer is null;
  select coalesce(bool_and(coalesce(array_length(o.register, 1), 0) > 0), true) into ordnung from public.kc_club_archiv_ordner o where o.besitzer is null;
  raise exception 'TESTBERICHT keine_alten_register=% | keine_alten_dokumente=% | mitglieder_zusammengelegt=% | nichts_im_papierkorb_verloren=% | register_nie_leer=%',
    alt_reg = 0, alt_dok = 0, mitglieder = 0, ohne_ordner = 0, ordnung;
end $$;
