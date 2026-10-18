-- KC-CLUB-WUNSCHLISTE: Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt.
do $$
declare a uuid; n1 int; n2 int; ok_status bool := false; ok_bereich bool := false; rls bool; anon bool;
begin
  insert into public.kc_club_wunschliste (text, wichtig) values ('Test-Wunsch', true) returning id, nr into a, n1;
  insert into public.kc_club_wunschliste (text) values ('Zweiter') returning nr into n2;
  update public.kc_club_wunschliste set status = 'erledigt', antwort = 'gemacht', version = '2.440.0', erledigt_am = now() where id = a;
  begin insert into public.kc_club_wunschliste (text, status) values ('x', 'quatsch'); exception when check_violation then ok_status := true; end;
  begin insert into public.kc_club_wunschliste (text, bereich) values ('x', 'Irgendwas'); exception when check_violation then ok_bereich := true; end;
  select relrowsecurity into rls from pg_class where oid = 'public.kc_club_wunschliste'::regclass;
  anon := has_table_privilege('anon', 'public.kc_club_wunschliste', 'select') or has_table_privilege('authenticated', 'public.kc_club_wunschliste', 'select');
  raise exception 'TESTBERICHT nummer_steigt=% | status_geprueft=% | bereich_geprueft=% | rls=% | kein_zugriff_ohne_server=% | erledigt=%',
    n2 > n1, ok_status, ok_bereich, rls, not anon, (select status = 'erledigt' and version = '2.440.0' from public.kc_club_wunschliste where id = a);
end $$;
