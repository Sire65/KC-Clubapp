-- KC-ZEITERFASSUNG-ZUGAENGE: Probelauf – Transaktion bricht am Ende absichtlich ab, nichts bleibt.
-- Prüft: ohne Anmeldung / fremder Benutzer → null; Manager-Admin → Liste der aktiven Mitglieder mit Code TTMMJJ,
-- ohne Klarnamen/Anschrift/Telefon/E-Mail/volles Datum; Codes eindeutig.
do $$
declare v_anon jsonb; v_fremd jsonb; v_mgr_user uuid; v_liste jsonb; v_anz int; v_codes int; v_format int; v_felder int; v_doppelt int; v_aktiv int;
begin
  perform set_config('request.jwt.claims', '', true);
  v_anon := public.kc_zeiterfassung_zugaenge();
  perform set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000000","role":"authenticated"}', true);
  v_fremd := public.kc_zeiterfassung_zugaenge();
  select user_id into v_mgr_user from public.kc_manager_memberships where active is true and role in ('admin','superadmin') and org_id = 'KC_WERNE' limit 1;
  perform set_config('request.jwt.claims', json_build_object('sub', v_mgr_user, 'role', 'authenticated')::text, true);
  v_liste := public.kc_zeiterfassung_zugaenge();
  select count(*) into v_aktiv from public.kc_core_personen where org_id = 'KC_WERNE' and aktiv is true and coalesce(trim(mitgliedsnummer), '') <> '';
  select count(*), count(e->>'geburtstagscode'), count(*) filter (where (e->>'geburtstagscode') ~ '^\d{6}$'),
         count(*) filter (where (select array_agg(k order by k) from jsonb_object_keys(e) k) <> array['geburtstagscode','mitgliedsart','mitgliedsnummer','pseudonym'])
    into v_anz, v_codes, v_format, v_felder from jsonb_array_elements(coalesce(v_liste, '[]'::jsonb)) e;
  select count(*) into v_doppelt from (select e->>'geburtstagscode' c from jsonb_array_elements(coalesce(v_liste, '[]'::jsonb)) e
    where e->>'geburtstagscode' is not null group by 1 having count(*) > 1) x;
  raise exception 'TESTBERICHT anon=% | fremd=% | anzahl_gleich_aktiv=% | codes_format_ok=% | nur_vier_felder=% | doppelte_codes=% | mit_code=%',
    coalesce(v_anon::text, 'null'), coalesce(v_fremd::text, 'null'), v_anz = v_aktiv, v_codes = v_format, v_felder = 0, v_doppelt, v_codes;
end $$;
