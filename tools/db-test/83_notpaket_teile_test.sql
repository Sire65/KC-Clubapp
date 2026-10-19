-- KC-CLUB-NOTPAKET-NUR-GEAENDERTE (Server 2.491.0): Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt.
do $$
declare z jsonb; rls bool; fremd bool; f_fremd bool; zwei bool := false;
begin
  z := public.kc_club_notpaket_zaehler();
  insert into public.kc_club_notpaket_vorrat (id, paket_gz, zaehler, voll_am) values (1, 'eA==', z, now())
    on conflict (id) do update set paket_gz = excluded.paket_gz, zaehler = excluded.zaehler;
  begin insert into public.kc_club_notpaket_vorrat (id) values (2); exception when check_violation then zwei := true; end;
  select relrowsecurity into rls from pg_class where oid = 'public.kc_club_notpaket_vorrat'::regclass;
  fremd := has_table_privilege('anon', 'public.kc_club_notpaket_vorrat', 'select') or has_table_privilege('authenticated', 'public.kc_club_notpaket_vorrat', 'select');
  f_fremd := has_function_privilege('anon', 'public.kc_club_notpaket_zaehler()', 'execute') or has_function_privilege('authenticated', 'public.kc_club_notpaket_zaehler()', 'execute');
  raise exception 'TESTBERICHT zaehler_tabellen=% | chat_dabei=% | teilnehmer_dabei=% | zugang=% | tag=% | eine_zeile=% | rls=% | kein_zugriff_ohne_server=% | funktion_nur_server=% | nicht_gespiegelt=%',
    (select count(*) from jsonb_object_keys(z->'tabellen')) between 20 and 24,
    jsonb_array_length(z->'tabellen'->'kc_communication_messages') = 3,
    (z->'tabellen'->'kc_communication_thread_participants'->>1) = '0',
    length(z->>'zugang') = 32, (z->>'tag') = to_char(now() at time zone 'Europe/Berlin', 'YYYY-MM-DD'),
    zwei, rls, not fremd, not f_fremd,
    (select not mirror_enabled and not backup_enabled from public.kc_db_mirror_table_rules where table_name = 'kc_club_notpaket_vorrat');
end $$;
