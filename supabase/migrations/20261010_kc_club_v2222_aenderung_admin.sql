-- KC Club-App – Version 2.222.0 (Wunsch Hansi „Änderungsmeldung jetzt übernehmen“, wenn der KC Manager sie nicht abholt)
-- KC-CLUB-AENDERUNG-DIREKT: Die Club-App schreibt weiterhin NIE selbst in kc_core_people. Der Admin löst die Übernahme aus; ausgeführt wird
-- ausschließlich der vorhandene Kern kc_core_person_aenderung_uebernehmen (Rechte, erwartete Altwerte, Wertprüfung, Audit, Vorgangsnummer, Status)
-- – als der Admin selbst (seine verknüpfte Anmeldung, core_role = admin), nie als anonymer Dienst.
-- Nur der Club-Server (service_role) darf diese Hülle aufrufen.
-- Rückweg: drop function public.kc_club_aenderung_admin_uebernehmen(uuid, text);
create or replace function public.kc_club_aenderung_admin_uebernehmen(p_id uuid, p_admin_person text)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
set statement_timeout to '30s'
as $function$
declare
  a public.kc_club_aenderungen%rowtype;
  v_uid uuid;
  v_p jsonb;
  v_kern jsonb := '{}'::jsonb;
  k text;
  v_erg jsonb;
begin
  select * into a from public.kc_club_aenderungen where id = p_id;
  if not found then return jsonb_build_object('ok', false, 'grund', 'nicht_gefunden'); end if;
  select l.user_id into v_uid from public.kc_core_user_links l
    where l.person_id = p_admin_person and l.org_id = a.org_id and l.active and l.core_role = 'admin' limit 1;
  if v_uid is null then raise exception 'Direkt eintragen darf nur ein Admin' using errcode = '42501'; end if;
  select to_jsonb(p) into v_p from public.kc_core_people p where p.org_id = a.org_id and p.person_id = a.person_id;
  if v_p is null then return jsonb_build_object('ok', false, 'grund', 'person_unbekannt'); end if;
  -- erwartete Altwerte = aktueller Stand (der Admin sieht ihn in der Karte „bisher“); der Kern prüft trotzdem alles selbst
  for k in select jsonb_array_elements_text(public.kc_core_person_erwartet_schluessel(coalesce(a.uebergabe, '{}'::jsonb))->'kern') loop
    v_kern := v_kern || jsonb_build_object(k, v_p->k);
  end loop;
  perform set_config('request.jwt.claim.sub', v_uid::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
  v_erg := public.kc_core_person_aenderung_uebernehmen(p_id, gen_random_uuid(), 'uebernehmen', jsonb_build_object('kern', v_kern, 'manager', '{}'::jsonb), null, 'KC_MANAGER');
  perform set_config('request.jwt.claim.sub', '', true);
  perform set_config('request.jwt.claims', '', true);
  return v_erg;
end $function$;
revoke all on function public.kc_club_aenderung_admin_uebernehmen(uuid, text) from public, anon, authenticated;
grant execute on function public.kc_club_aenderung_admin_uebernehmen(uuid, text) to service_role;
