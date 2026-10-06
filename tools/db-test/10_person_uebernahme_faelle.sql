\set ON_ERROR_STOP 0
\pset tuples_only on
\pset format unaligned
-- Testdaten (nur lokal)
insert into auth.users values ('00000000-0000-0000-0000-0000000000a1'),('00000000-0000-0000-0000-0000000000b2'),('00000000-0000-0000-0000-0000000000c3'),('00000000-0000-0000-0000-0000000000d4');
insert into kc_core_user_links values ('ORG','00000000-0000-0000-0000-0000000000a1','KC-P-ADM','admin',true),('ORG','00000000-0000-0000-0000-0000000000b2','KC-P-MGR','member',true),('ORG','00000000-0000-0000-0000-0000000000c3','KC-P-NIX','member',true);
insert into kc_core_app_access values ('ORG','KC-P-MGR','KC_MANAGER','manager',true);
insert into kc_manager_memberships(org_id,user_id,role) values ('ORG','00000000-0000-0000-0000-0000000000b2','manager'),('ORG','00000000-0000-0000-0000-0000000000a1','admin');
insert into kc_core_people(person_id,org_id,display_name,given_name,family_name,street,postal_code,city,phone,email,birth_date) values
 ('KC-P-T1','ORG','Erika Muster','Erika','Muster','Altweg 1','59368','Werne','0170-1',null,'1960-05-05'),
 ('KC-P-T2','ORG','Max (Koch)','Max','Probe',null,null,null,null,null,null);
insert into kc_core_club_memberships(org_id,person_id,member_number,membership_status,joined_on) values ('ORG','KC-P-T1','12','active','2000-01-01'),('ORG','KC-P-T2','13','active','2000-01-01');
insert into kc_manager_state_sections(org_id,section_key,payload,version,updated_by) values ('ORG','members','{"data":[]}',5,'00000000-0000-0000-0000-0000000000a1');
insert into kc_club_aenderungen(id,person_id,art,neu,status,org_id,uebergabe,gilt_ab) values
 ('10000000-0000-0000-0000-000000000001','KC-P-T1','anschrift','{}','freigegeben','ORG','{"street":"Neuweg 2","postal_code":"59368","city":"Werne"}',null),
 ('10000000-0000-0000-0000-000000000002','KC-P-T1','festnetz','{}','freigegeben','ORG','{"landline":"02389-222"}',null),
 ('10000000-0000-0000-0000-000000000003','KC-P-T1','mitgliedschaft','{}','freigegeben','ORG','{"membership":"austritt"}','2026-09-30'),
 ('10000000-0000-0000-0000-000000000004','KC-P-T2','mitgliedschaft','{}','freigegeben','ORG','{"membership":"austritt"}','2027-12-31'),
 ('10000000-0000-0000-0000-000000000005','KC-P-T2','mitgliedschaft','{}','freigegeben','ORG','{"membership":"ruhend"}','2026-10-01'),
 ('10000000-0000-0000-0000-000000000006','KC-P-T1','sonstiges','{}','freigegeben','ORG','{"hinweis":"bitte anrufen"}',null),
 ('10000000-0000-0000-0000-000000000007','KC-P-T1','name','{}','freigegeben','ORG','{"family_name":"Neu"}',null),
 ('10000000-0000-0000-0000-000000000008','KC-P-T2','name','{}','freigegeben','ORG','{"given_name":"Moritz"}',null),
 ('10000000-0000-0000-0000-000000000009','KC-P-T1','handy','{}','uebernommen','ORG','{"phone":"0170-9"}',null),
 ('10000000-0000-0000-0000-00000000000a','KC-P-T1','handy','{}','freigegeben','ORG','{"phone":"0170-2"}',null),
 ('10000000-0000-0000-0000-00000000000b','KC-P-T1','mail','{}','freigegeben','ORG','{"email":"kaputt"}',null);
create function t(label text, uid text, id text, vorgang text, ent text, erw jsonb, grund text default null, prog text default 'KC_MANAGER') returns text language plpgsql as $$
declare r jsonb; begin
  perform set_config('request.jwt.claim.sub', uid, true);
  execute 'set local role authenticated';
  begin r := public.kc_core_person_aenderung_uebernehmen(id::uuid, vorgang::uuid, ent, erw, grund, prog);
  exception when others then r := jsonb_build_object('FEHLER', sqlstate, 'msg', sqlerrm); end;
  execute 'reset role';
  return label || ' → ' || r::text; end $$;
\set A '00000000-0000-0000-0000-0000000000a1'
\set M '00000000-0000-0000-0000-0000000000b2'
\set N '00000000-0000-0000-0000-0000000000c3'
select t('01 offen-Liste (Manager)', :'M', '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000000','x','{}');
begin; select set_config('request.jwt.claim.sub', :'M', true); set local role authenticated; select '01b offen: '||jsonb_path_query_array(kc_core_person_aenderungen_offen('ORG'),'$[*] ? (@.art=="festnetz" || @.art=="mitgliedschaft").erwartet_schluessel')::text; select '01c schreibbar festnetz: '||jsonb_path_query_array(kc_core_person_aenderungen_offen('ORG'),'$[*] ? (@.art=="festnetz").schreibbar')::text; commit;
select t('02 kein Recht', :'N', '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','uebernehmen','{"kern":{"street":"Altweg 1","postal_code":"59368","city":"Werne"}}');
select t('03 programm falsch', :'M', '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','uebernehmen','{}',null,'X');
select t('04 erwartet unvollständig', :'M', '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003','uebernehmen','{"kern":{"street":"Altweg 1","city":"Werne"}}');
select t('04b gleiche Nr. wiederholt (ok:false bleibt)', :'M', '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003','uebernehmen','{"kern":{"street":"Altweg 1","city":"Werne"}}');
select t('05 erwartet unbekannt', :'M', '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000004','uebernehmen','{"kern":{"street":"Altweg 1","postal_code":"59368","city":"Werne","phone":null}}');
select t('05b manager-Ziel unbekannt', :'M', '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000014','uebernehmen','{"kern":{"street":"Altweg 1","postal_code":"59368","city":"Werne"},"manager":{"street":"x"}}');
select t('06 geändert', :'M', '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000005','uebernehmen','{"kern":{"street":"Anders 9","postal_code":"59368","city":"Werne"}}');
select t('07 Anschrift OK', :'M', '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000006','uebernehmen','{"kern":{"street":"Altweg 1","postal_code":"59368","city":"Werne"}}');
select t('07b Wiederholung gleich', :'M', '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000006','uebernehmen','{"kern":{"street":"Altweg 1","postal_code":"59368","city":"Werne"}}');
select t('07c gleiche Nr. andere Entscheidung', :'M', '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000006','ablehnen','{}','x');
select t('07d gleiche Nr. andere Meldung', :'M', '10000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000006','uebernehmen','{"kern":{"family_name":"Muster"}}');
select t('07e neue Nr. auf erledigte Meldung', :'M', '10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000007','uebernehmen','{"kern":{"street":"Neuweg 2","postal_code":"59368","city":"Werne"}}');
select t('08 Festnetz gesperrt', :'M', '10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000008','uebernehmen','{"manager":{"phone":"02389-111"}}');
select t('09 Austritt als Manager', :'M', '10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000009','mitgliedschaft_bestaetigt','{"kern":{"membership_status":"active","left_on":null}}');
select t('09b Austritt mit uebernehmen', :'A', '10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000010','uebernehmen','{"kern":{"membership_status":"active","left_on":null}}');
select t('09c Austritt Admin OK', :'A', '10000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000011','mitgliedschaft_bestaetigt','{"kern":{"membership_status":"active","left_on":null}}');
select t('10 Austritt zu früh', :'A', '10000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000012','mitgliedschaft_bestaetigt','{"kern":{"membership_status":"active","left_on":null}}');
select t('11 ruhend OK', :'A', '10000000-0000-0000-0000-000000000005','20000000-0000-0000-0000-000000000013','mitgliedschaft_bestaetigt','{"kern":{"membership_status":"active"}}');
select t('12 Hinweis übernehmen', :'M', '10000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000015','uebernehmen','{}');
select t('12b Hinweis ohne Grund', :'M', '10000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000016','erledigt_ohne_aenderung','{}');
select t('12c Hinweis erledigt', :'M', '10000000-0000-0000-0000-000000000006','20000000-0000-0000-0000-000000000016','erledigt_ohne_aenderung','{}','angerufen');
select t('13 Name (Anzeigename folgt)', :'M', '10000000-0000-0000-0000-000000000007','20000000-0000-0000-0000-000000000017','uebernehmen','{"kern":{"family_name":"Muster"}}');
select t('14 Name (Anzeigename eigen, bleibt)', :'M', '10000000-0000-0000-0000-000000000008','20000000-0000-0000-0000-000000000018','uebernehmen','{"kern":{"given_name":"Max"}}');
select t('15 alt quittiert', :'M', '10000000-0000-0000-0000-000000000009','20000000-0000-0000-0000-000000000019','uebernehmen','{"kern":{"phone":"0170-1"}}');
select t('16 Ablehnen', :'M', '10000000-0000-0000-0000-00000000000a','20000000-0000-0000-0000-000000000020','ablehnen','{}','Nummer unbekannt');
select t('16b Ablehnen wiederholt', :'M', '10000000-0000-0000-0000-00000000000a','20000000-0000-0000-0000-000000000020','ablehnen','{}','Nummer unbekannt');
select t('17 E-Mail ungültig', :'M', '10000000-0000-0000-0000-00000000000b','20000000-0000-0000-0000-000000000021','uebernehmen','{"kern":{"email":null}}');
-- Ergebnisse in den Daten
select 'P1: '||display_name||' | '||street||' | '||family_name from kc_core_people where person_id='KC-P-T1';
select 'P2: '||display_name||' | '||given_name from kc_core_people where person_id='KC-P-T2';
select 'MS: '||person_id||' '||membership_status||' '||coalesce(left_on::text,'-') from kc_core_club_memberships order by 1;
select 'ST: '||right(id::text,1)||' '||status from kc_club_aenderungen order by id;
select 'AUDIT: '||count(*) from kc_core_people_audit;
select 'VORG: '||count(*)||' ohne Ergebnis: '||count(*) filter (where ergebnis is null) from kc_core_person_vorgaenge;
