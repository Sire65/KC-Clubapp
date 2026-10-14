-- KC-CLUB-ANMELDUNG-SPARSAM: Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt.
-- Prüft mit der Test-Person: erstes Mal schreibt; innerhalb 30 s kein Schreiben; nach > 30 s wieder; neue App-Version schreibt;
-- „vorher“ = Stand VOR dem Schreiben; falscher/inaktiver Zugang → null.
do $$
declare h text := repeat('ab', 32); p text := 'KC-P-TEST-BIRGIT'; r jsonb; v_zul timestamptz; v_ver text;
  erst_ok bool; ruhig_ok bool; wieder_ok bool; version_ok bool; vorher_ok bool; falsch_ok bool; inaktiv_ok bool;
begin
  delete from public.kc_club_zugang where person_id = p;
  insert into public.kc_club_zugang (person_id, token_hash, aktiv) values (p, h, true);
  r := public.kc_club_anmeldung(h, '2.389.0');
  select zuletzt_gesehen, app_version into v_zul, v_ver from public.kc_club_zugang where person_id = p;
  erst_ok := r->'person'->>'person_id' = p and v_zul = now() and v_ver = '2.389.0' and (r->>'vorher') is null;
  update public.kc_club_zugang set zuletzt_gesehen = now() - interval '10 seconds' where person_id = p;
  r := public.kc_club_anmeldung(h, '2.389.0');
  select zuletzt_gesehen into v_zul from public.kc_club_zugang where person_id = p;
  ruhig_ok := v_zul = now() - interval '10 seconds' and r->'person'->>'person_id' = p;
  update public.kc_club_zugang set zuletzt_gesehen = now() - interval '11 minutes' where person_id = p;
  r := public.kc_club_anmeldung(h, '2.389.0');
  select zuletzt_gesehen into v_zul from public.kc_club_zugang where person_id = p;
  wieder_ok := v_zul = now(); vorher_ok := (r->>'vorher')::timestamptz = now() - interval '11 minutes';
  update public.kc_club_zugang set zuletzt_gesehen = now() - interval '5 seconds' where person_id = p;
  r := public.kc_club_anmeldung(h, '2.390.0');
  select app_version into v_ver from public.kc_club_zugang where person_id = p;
  version_ok := v_ver = '2.390.0';
  falsch_ok := public.kc_club_anmeldung(repeat('cd', 32), 'x') is null and public.kc_club_anmeldung('kein-hash', 'x') is null;
  update public.kc_club_zugang set aktiv = false where person_id = p;
  inaktiv_ok := public.kc_club_anmeldung(h, 'x') is null;
  raise exception 'TESTBERICHT erstes_mal=% | ruhig_30s=% | wieder_nach_pause=% | vorher_vor_schreiben=% | neue_version=% | falscher_zugang=% | inaktiv=%',
    erst_ok, ruhig_ok, wieder_ok, vorher_ok, version_ok, falsch_ok, inaktiv_ok;
end $$;
