-- KC-CLUB-ORDNER-KENNUNG: Probelauf in Supabase – nach der Migration in derselben Transaktion, bricht am Ende absichtlich ab (nichts bleibt).
-- Nur Ordner-Metadaten (Beschriftung, Kennung, Jahr) – keine Dokumente, keine Inhalte.
do $$
declare doppelt int; ohne int; schilder int; fremd int; ok_format boolean := true;
begin
  select count(*) into doppelt from (select kennung, jahr from public.kc_club_archiv_ordner
    where kennung is not null and geloescht_am is null group by 1, 2 having count(*) > 1) x;
  select count(*) into ohne from public.kc_club_archiv_ordner
    where besitzer is null and geloescht_am is null and kennung is null
      and titel in ('Schilder', 'Anleitungen', 'Weihnachtsmarkt', 'Besprechungen', 'Verträge', 'Admin', 'Personal', 'Dienstpläne', 'Protokolle')
      and not exists (select 1 from public.kc_club_archiv_ordner y where y.titel = kc_club_archiv_ordner.titel and y.jahr = kc_club_archiv_ordner.jahr
                        and y.kennung is not null and y.geloescht_am is null);
  select count(*) into schilder from public.kc_club_archiv_ordner where kennung = 'schilder' and geloescht_am is null;
  select count(*) into fremd from public.kc_club_archiv_ordner where kennung is not null and besitzer is not null;
  begin
    insert into public.kc_club_archiv_ordner (art, jahr, titel, register, erstellt_von, kennung)
      select 'sonstiges', 2026, 'Test', array['Sonstiges'], erstellt_von, 'Falsch Format' from public.kc_club_archiv_ordner limit 1;
    ok_format := false;
  exception when check_violation then ok_format := true;
  end;
  raise exception 'TESTBERICHT keine_doppelten=% | alle_festen_haben_kennung=% | schilder_genau_einer=% | nur_vereinsordner=% | format_geprueft=%',
    doppelt = 0, ohne = 0, schilder <= 1, fremd = 0, ok_format;
end $$;
