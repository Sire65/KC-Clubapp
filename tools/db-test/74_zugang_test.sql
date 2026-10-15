-- KC-CLUB-ZUGANG (2.422.0): Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt.
-- Prüft: Spalte zugang mit Standard „mitglied“, „gast“/„aushilfe“ speicherbar, falscher Wert abgelehnt, Anmeldung liefert den Zugang mit.
do $$
declare h text := repeat('ef', 32); p text := 'KC-P-TEST-BIRGIT'; r jsonb; z text;
  standard_ok bool; gast_ok bool; aushilfe_ok bool; falsch_ok bool := false; anmeldung_ok bool;
begin
  delete from public.kc_club_rollen where person_id = p;
  insert into public.kc_club_rollen (person_id) values (p);
  select zugang into z from public.kc_club_rollen where person_id = p; standard_ok := z = 'mitglied';
  update public.kc_club_rollen set zugang = 'gast' where person_id = p;
  select zugang into z from public.kc_club_rollen where person_id = p; gast_ok := z = 'gast';
  begin update public.kc_club_rollen set zugang = 'chef' where person_id = p; exception when check_violation then falsch_ok := true; end;
  update public.kc_club_rollen set zugang = 'aushilfe' where person_id = p;
  select zugang into z from public.kc_club_rollen where person_id = p; aushilfe_ok := z = 'aushilfe';
  delete from public.kc_club_zugang where person_id = p;
  insert into public.kc_club_zugang (person_id, token_hash, aktiv) values (p, h, true);
  r := public.kc_club_anmeldung(h, '2.420.0');
  anmeldung_ok := r->'rollen'->>'zugang' = 'aushilfe';
  raise exception 'TESTBERICHT standard_mitglied=% | gast=% | aushilfe=% | falscher_wert_abgelehnt=% | anmeldung_liefert_zugang=%',
    standard_ok, gast_ok, aushilfe_ok, falsch_ok, anmeldung_ok;
end $$;
