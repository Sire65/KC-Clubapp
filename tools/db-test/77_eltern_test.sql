-- KC-CLUB-ELTERN (2.431.0): Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt.
-- Prüft: Eintrag für ein Kind (vorhandene Testperson), Telefon- und Schlüssel-Format, Schlüssel eindeutig, für Browser-Rollen gesperrt.
do $$
-- vorhandene Testperson: kind ist an kc_core_people gebunden (wie Probelauf 72/74/76)
declare p text := 'KC-P-TEST-BIRGIT'; h text := repeat('ab', 32); n int;
  anlegen_ok bool; telefon_falsch_ok bool := false; schluessel_doppelt_ok bool := false; schluessel_falsch_ok bool := false; gesperrt_ok bool; rls_ok bool;
begin
  insert into public.kc_club_eltern (kind, name, telefon, token_hash) values (p, 'Testmama', '+491701234567', h);
  select count(*) into n from public.kc_club_eltern where kind = p and token_hash = h and aktiv; anlegen_ok := n = 1;
  begin insert into public.kc_club_eltern (kind, name, telefon, token_hash) values (p, 'X', '0170 abc', repeat('cd', 32)); exception when check_violation then telefon_falsch_ok := true; end;
  begin insert into public.kc_club_eltern (kind, name, telefon, token_hash) values (p, 'Y', '01701234567', h); exception when unique_violation then schluessel_doppelt_ok := true; end;
  begin insert into public.kc_club_eltern (kind, name, telefon, token_hash) values (p, 'Z', '01701234567', 'kurz'); exception when check_violation then schluessel_falsch_ok := true; end;
  gesperrt_ok := not has_table_privilege('anon', 'public.kc_club_eltern', 'SELECT') and not has_table_privilege('authenticated', 'public.kc_club_eltern', 'SELECT');
  select relrowsecurity into rls_ok from pg_class where oid = 'public.kc_club_eltern'::regclass;
  raise exception 'TESTBERICHT anlegen=% | telefon_falsch_abgelehnt=% | schluessel_doppelt_abgelehnt=% | schluessel_falsch_abgelehnt=% | gesperrt=% | rls=%',
    anlegen_ok, telefon_falsch_ok, schluessel_doppelt_ok, schluessel_falsch_ok, gesperrt_ok, rls_ok;
end $$;
