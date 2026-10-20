-- KC-CLUB-ABLAGEKORB (2.511.0): Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt.
do $$
declare a uuid; ok_status bool := false; ok_zuviel bool := false; rls bool; fremd bool;
begin
  insert into public.kc_club_ablagekorb (von, titel, text, anlagen) values ('KC-P-ZZTEST1', 'Test', 'Hallo', '[{"id":"00000000-0000-0000-0000-000000000001","name":"a.jpg"}]') returning id into a;
  update public.kc_club_ablagekorb set status = 'erledigt', ergebnis = 'Fotoalbum', erledigt_von = 'KC-P-002', erledigt_am = now() where id = a;
  begin insert into public.kc_club_ablagekorb (von, status) values ('KC-P-ZZTEST1', 'quatsch'); exception when check_violation then ok_status := true; end;
  begin insert into public.kc_club_ablagekorb (von, anlagen) values ('KC-P-ZZTEST1', (select jsonb_agg(i) from generate_series(1, 11) i)); exception when check_violation then ok_zuviel := true; end;
  select relrowsecurity into rls from pg_class where oid = 'public.kc_club_ablagekorb'::regclass;
  fremd := has_table_privilege('anon', 'public.kc_club_ablagekorb', 'select') or has_table_privilege('authenticated', 'public.kc_club_ablagekorb', 'select');
  raise exception 'TESTBERICHT angelegt=% | erledigt=% | status_geprueft=% | hoechstens_10=% | rls=% | kein_zugriff_ohne_server=% | spiegelregel=%',
    a is not null, (select status = 'erledigt' and ergebnis = 'Fotoalbum' from public.kc_club_ablagekorb where id = a), ok_status, ok_zuviel, rls, not fremd,
    exists (select 1 from public.kc_db_mirror_table_rules where table_name = 'kc_club_ablagekorb');
end $$;
