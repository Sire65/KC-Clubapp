-- KC-CLUB-RT-KANAL-WECHSEL (2.426.0): Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt.
-- Prüft: Zählnummer 0 = bisheriger Kanalname (nichts bricht), nach kc_club_rt_neu neuer Name (= Formel mit „:1“), ohne Zugang wie bisher,
-- die Funktionen sind für Browser-Rollen gesperrt.
do $$
-- vorhandene Testperson: der Zugang ist in der echten Datenbank an kc_core_people gebunden (wie Probelauf 72/74)
declare p text := 'KC-P-TEST-BIRGIT'; g text; alt text; k0 text; k1 text; k2 text; ohne text;
  gleich_ok bool; wechsel_ok bool; formel_ok bool; zweimal_ok bool; ohne_ok bool; gesperrt_ok bool;
begin
  select decrypted_secret into g from vault.decrypted_secrets where name = 'kc_club_rt_geheimnis';
  delete from public.kc_club_zugang where person_id = p;
  insert into public.kc_club_zugang (person_id, token_hash, aktiv) values (p, repeat('ab', 32), true);
  alt := 'kc-club-' || left(encode(extensions.hmac(p, g, 'sha256'), 'hex'), 32);
  k0 := public.kc_club_rt_kanal(p); gleich_ok := k0 = alt;
  perform public.kc_club_rt_neu(p);
  k1 := public.kc_club_rt_kanal(p); wechsel_ok := k1 <> k0;
  formel_ok := k1 = 'kc-club-' || left(encode(extensions.hmac(p || ':1', g, 'sha256'), 'hex'), 32);
  perform public.kc_club_rt_neu(p);
  k2 := public.kc_club_rt_kanal(p); zweimal_ok := k2 <> k1 and k2 <> k0;
  ohne := public.kc_club_rt_kanal('KC-P-TEST-OHNE-ZUGANG');
  ohne_ok := ohne = 'kc-club-' || left(encode(extensions.hmac('KC-P-TEST-OHNE-ZUGANG', g, 'sha256'), 'hex'), 32);
  gesperrt_ok := not has_function_privilege('anon', 'public.kc_club_rt_neu(text)', 'EXECUTE') and not has_function_privilege('authenticated', 'public.kc_club_rt_kanal(text)', 'EXECUTE');
  raise exception 'TESTBERICHT bisheriger_name=% | neuer_name=% | formel=% | zweiter_wechsel=% | ohne_zugang_wie_bisher=% | gesperrt=%',
    gleich_ok, wechsel_ok, formel_ok, zweimal_ok, ohne_ok, gesperrt_ok;
end $$;
