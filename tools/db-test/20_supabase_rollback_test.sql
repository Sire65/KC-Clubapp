do $t$
declare
  adm uuid := (select user_id from public.kc_core_user_links where person_id = 'KC-P-002' and core_role = 'admin' and active limit 1);
  r jsonb; bericht text := ''; n int;
  procedure_dummy int;
begin
  -- Testdaten (werden am Ende mit allem zurückgerollt)
  insert into public.kc_core_people(person_id, org_id, display_name, given_name, family_name, street, postal_code, city, phone)
    values ('KC-P-ZZTEST1', 'KC_WERNE', 'Test Person', 'Test', 'Person', 'Altweg 1', '59368', 'Werne', '0170-1');
  insert into public.kc_core_club_memberships(org_id, person_id, member_number, membership_type, membership_status, joined_on)
    values ('KC_WERNE', 'KC-P-ZZTEST1', 'ZZ1', 'regular', 'active', '2000-01-01');
  insert into public.kc_club_aenderungen(id, person_id, art, neu, status, org_id, uebergabe, gilt_ab) values
    ('a0000000-0000-0000-0000-000000000001', 'KC-P-ZZTEST1', 'anschrift', '{}', 'freigegeben', 'KC_WERNE', '{"street":"Neuweg 2","postal_code":"59368","city":"Werne"}', null),
    ('a0000000-0000-0000-0000-000000000002', 'KC-P-ZZTEST1', 'festnetz', '{}', 'freigegeben', 'KC_WERNE', '{"landline":"02389-2"}', null),
    ('a0000000-0000-0000-0000-000000000003', 'KC-P-ZZTEST1', 'mitgliedschaft', '{}', 'freigegeben', 'KC_WERNE', '{"membership":"austritt"}', '2030-12-31'),
    ('a0000000-0000-0000-0000-000000000004', 'KC-P-ZZTEST1', 'mitgliedschaft', '{}', 'freigegeben', 'KC_WERNE', '{"membership":"ruhend"}', '2026-10-01'),
    ('a0000000-0000-0000-0000-000000000005', 'KC-P-ZZTEST1', 'handy', '{}', 'freigegeben', 'KC_WERNE', '{"phone":"0170-2"}', null);
  perform set_config('request.jwt.claim.sub', adm::text, true);
  execute 'set local role authenticated';
  r := public.kc_core_person_aenderung_uebernehmen('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'uebernehmen', '{"kern":{"street":"Anders","postal_code":"59368","city":"Werne"}}');
  bericht := bericht || ' | T1 geaendert=' || (r->>'grund');
  r := public.kc_core_person_aenderung_uebernehmen('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'uebernehmen', '{"kern":{"street":"Altweg 1","postal_code":"59368","city":"Werne"}}');
  bericht := bericht || ' | T2 anschrift ok=' || (r->>'ok');
  r := public.kc_core_person_aenderung_uebernehmen('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'uebernehmen', '{"kern":{"street":"Altweg 1","postal_code":"59368","city":"Werne"}}');
  bericht := bericht || ' | T3 wiederholt=' || (r->>'wiederholt') || '/' || (r->>'ok');
  r := public.kc_core_person_aenderung_uebernehmen('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'uebernehmen', '{"kern":{"street":"Neuweg 2","postal_code":"59368","city":"Werne"}}');
  bericht := bericht || ' | T4 fremd=' || (r->>'grund');
  r := public.kc_core_person_aenderung_uebernehmen('a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'uebernehmen', '{"manager":{"phone":"x"}}');
  bericht := bericht || ' | T5 festnetz=' || (r->>'grund');
  r := public.kc_core_person_aenderung_uebernehmen('a0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005', 'mitgliedschaft_bestaetigt', '{"kern":{"membership_status":"active","left_on":null}}');
  bericht := bericht || ' | T6 zu_frueh=' || (r->>'grund');
  r := public.kc_core_person_aenderung_uebernehmen('a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000006', 'mitgliedschaft_bestaetigt', '{"kern":{"membership_status":"active"}}');
  bericht := bericht || ' | T7 ruhend ok=' || (r->>'ok');
  r := public.kc_core_person_aenderung_uebernehmen('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000007', 'ablehnen', '{}', 'Test');
  bericht := bericht || ' | T8 ablehnen=' || (r->>'status');
  r := public.kc_core_person_aenderung_uebernehmen('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000002', 'uebernehmen', '{"kern":{"phone":"0170-1"}}');
  bericht := bericht || ' | T9 widerspruch=' || (r->>'grund');
  r := public.kc_core_person_aenderungen_offen('KC_WERNE');
  bericht := bericht || ' | T10 offen festnetz schreibbar=' || coalesce(jsonb_path_query_first(r, '$[*] ? (@.id == "a0000000-0000-0000-0000-000000000002").schreibbar')::text, '?');
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-00000000dead', true);
  execute 'set local role authenticated';
  begin
    r := public.kc_core_person_aenderung_uebernehmen('a0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000009', 'ablehnen', '{}', 'x');
    bericht := bericht || ' | T11 ohne Recht: KEIN FEHLER';
  exception when insufficient_privilege then bericht := bericht || ' | T11 ohne Recht=42501';
  end;
  begin
    r := public.kc_manager_section_speichern('KC_WERNE', 'members', '{}'::jsonb, 1);
    bericht := bericht || ' | T12 Abschnitt ohne Recht: KEIN FEHLER';
  exception when insufficient_privilege then bericht := bericht || ' | T12 Abschnitt ohne Recht=42501';
  end;
  execute 'reset role';
  select count(*) into n from public.kc_core_people_audit; bericht := bericht || ' | Audit=' || n;
  select street || '/' || (select membership_status from public.kc_core_club_memberships where person_id = 'KC-P-ZZTEST1') into r from public.kc_core_people where person_id = 'KC-P-ZZTEST1';
  bericht := bericht || ' | Person=' || coalesce(r::text, '?');
  select modus into bericht from (select bericht || ' | Schutzmodus=' || modus as modus from public.kc_manager_section_schutz) x;
  raise exception 'TESTBERICHT (alles wird zurückgerollt):%', bericht;
end
$t$;
