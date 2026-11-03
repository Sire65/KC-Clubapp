-- KC-CLUB-HILFE-TIPPS: Probelauf in Supabase – nach der Migration in derselben Transaktion, bricht am Ende absichtlich ab (nichts bleibt).
-- Nur Testzeilen mit einer vorhandenen Person als Absender/Empfänger; keine echten Inhalte werden gelesen.
do $$
declare pid text; tid uuid; ok_antwort boolean := false; ok_kaskade boolean; ok_vorlage boolean := false; offen int; rechte boolean;
begin
  select person_id into pid from public.kc_core_people limit 1;
  insert into public.kc_club_hilfe_tipp (von, problem, text, rueckmeldung, empfaenger) values (pid, 'Test', 'Testtipp', true, 1) returning id into tid;
  insert into public.kc_club_hilfe_tipp_empfang (tipp_id, person_id) values (tid, pid);
  select count(*) into offen from public.kc_club_hilfe_tipp_empfang where tipp_id = tid and antwort is null;
  begin update public.kc_club_hilfe_tipp_empfang set antwort = 'vielleicht' where tipp_id = tid; exception when check_violation then ok_antwort := true; end;
  insert into public.kc_club_hilfe_vorlage (problem, text, von) values ('Test Vorlage', 'x', pid);
  begin insert into public.kc_club_hilfe_vorlage (problem, text, von) values ('TEST vorlage', 'y', pid); exception when unique_violation then ok_vorlage := true; end;
  delete from public.kc_club_hilfe_tipp where id = tid;
  select not exists (select 1 from public.kc_club_hilfe_tipp_empfang where tipp_id = tid) into ok_kaskade;
  select not has_table_privilege('anon', 'public.kc_club_hilfe_tipp', 'select') and not has_table_privilege('authenticated', 'public.kc_club_hilfe_tipp_empfang', 'select')
    and has_table_privilege('service_role', 'public.kc_club_hilfe_vorlage', 'insert') into rechte;
  raise exception 'TESTBERICHT empfang_offen=% | antwort_geprueft=% | vorlage_einmalig=% | loeschen_kaskade=% | rechte_nur_server=%',
    offen = 1, ok_antwort, ok_vorlage, ok_kaskade, rechte;
end $$;
