-- KC-CLUB-TISCH-TASCHE (2.774.0): Probelauf in Supabase – nach der Migration 20261030_kc_club_v2774_tisch_tasche.sql in derselben Transaktion,
-- bricht am Ende absichtlich ab (nichts bleibt). Nutzt eine vorhandene Person und eine vorhandene Anlage nur als Verweis (nichts wird daran geändert).
do $$
declare p text; a uuid; t uuid; zweimal boolean := false; falsche_art boolean := false; anzahl int; nach_loeschen int;
begin
  select person_id into p from public.kc_core_people where active order by person_id limit 1;
  select id into a from public.kc_communication_attachments order by created_at limit 1;
  insert into public.kc_club_tisch (thema, beginn, dauer_min, ende, gastgeber) values ('Tasche-Probe', '2031-02-01 19:00+00', 60, '2031-02-01 20:00+00', p) returning id into t;
  insert into public.kc_club_tisch_tasche (tisch_id, person_id, attachment_id, name, mime, art, pos) values (t, p, a, 'Ablauf.pdf', 'application/pdf', 'pdf', 1);
  begin insert into public.kc_club_tisch_tasche (tisch_id, person_id, attachment_id, name, art, pos) values (t, p, a, 'nochmal.pdf', 'pdf', 2); exception when unique_violation then zweimal := true; end;
  begin insert into public.kc_club_tisch_tasche (tisch_id, person_id, attachment_id, name, art, pos) values (t, p || '-x', a, 'film.mp4', 'video', 1); exception when check_violation then falsche_art := true; end;
  select count(*) into anzahl from public.kc_club_tisch_tasche where tisch_id = t;
  delete from public.kc_club_tisch where id = t;
  select count(*) into nach_loeschen from public.kc_club_tisch_tasche where tisch_id = t;
  raise exception 'TESTBERICHT eingepackt=% | doppelt_verboten=% | nur_pdf_foto_musik=% | mit_tisch_weg=% | nur_server=%',
    anzahl, zweimal, falsche_art, nach_loeschen = 0,
    not has_table_privilege('anon', 'public.kc_club_tisch_tasche', 'select') and not has_table_privilege('authenticated', 'public.kc_club_tisch_tasche', 'select') and has_table_privilege('service_role', 'public.kc_club_tisch_tasche', 'insert');
end $$;
