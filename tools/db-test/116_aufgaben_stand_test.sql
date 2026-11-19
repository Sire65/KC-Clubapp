-- KC-CLUB-AUFGABEN-STAND: Probelauf in Supabase – nach der Migration 20261119_kc_club_aufgaben_stand.sql in derselben Transaktion,
-- bricht am Ende absichtlich ab (nichts bleibt). Prüft nur die Struktur (Spalten, Regeln) – liest und ändert keine Aufgabentexte.
do $$
declare spalten int; pr_spalten int; regel boolean; erledigt_ok boolean; verlauf_std boolean; rls boolean;
begin
  select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'kc_club_aufgaben'
    and column_name in ('stand', 'stand_am', 'stand_von', 'stand_text', 'stand_ziel', 'stand_verlauf', 'gefragt_am', 'spaeter_bis', 'nachgefragt_am') into spalten;
  select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'kc_club_sitzungsprotokolle'
    and column_name in ('aufgaben_stand', 'aufgaben_nachgefragt_am') into pr_spalten;
  select exists (select 1 from pg_constraint where conname = 'kc_club_aufgaben_stand_check' and conrelid = 'public.kc_club_aufgaben'::regclass
    and pg_get_constraintdef(oid) like '%teilweise%' and pg_get_constraintdef(oid) like '%nicht%') into regel;
  -- nur Zählung: keine erledigte Aufgabe ohne Stand „erledigt“
  select not exists (select 1 from public.kc_club_aufgaben where erledigt_am is not null and stand <> 'erledigt') into erledigt_ok;
  select column_default like '%[]%' from information_schema.columns where table_schema = 'public' and table_name = 'kc_club_aufgaben' and column_name = 'stand_verlauf' into verlauf_std;
  select relrowsecurity from pg_class where oid = 'public.kc_club_aufgaben'::regclass into rls;
  raise exception 'TESTBERICHT aufgaben_spalten=% | protokoll_spalten=% | stand_regel=% | erledigte_mit_stand=% | verlauf_leer=% | rls=%',
    spalten, pr_spalten, regel, erledigt_ok, verlauf_std, rls;
end $$;
