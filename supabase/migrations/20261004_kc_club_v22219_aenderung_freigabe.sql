-- KC Club-App – Version 2.22.19 (Wunsch Hansi)
-- KC-CLUB-AENDERUNG-FREIGABE: Änderungsmeldungen laufen jetzt so: Eingangskorb → „zur Kenntnis genommen“ (wer, wann) → Freigabe
--   (Admin oder Clubsprecher) → liegt als Übergabe für die KC-Programme bereit (Felder im Format der zentralen Personendaten
--   kc_core_people: street, postal_code, city, phone, email, given_name, family_name, birth_date; Festnetz als landline) →
--   der KC Manager (später weitere Programme) holt sie ab, trägt sie ein und meldet „übernommen“ zurück → Mitglied bekommt Bescheid.
--   Die Club-App schreibt NICHT selbst in kc_core_people (dort pflegt der KC Manager – keine zwei Schreiber).
--   Bankverbindung, Kleidergröße, Notfallkontakt gehen NICHT an andere Programme.
-- Zugriff für Programme nur über die beiden Funktionen (security definer, Prüfung: Admin der Organisation oder KC_MANAGER manager/admin).
-- Rückweg: drop function kc_core_person_aenderungen_offen(text); drop function kc_core_person_aenderung_quittieren(uuid, text, text, jsonb);
--          alter table kc_club_aenderungen drop column org_id, … (neue Spalten); Status-Check auf ('offen','erledigt','zurueckgezogen') zurück.
alter table kc_club_aenderungen
  add column if not exists org_id text not null default 'KC_WERNE',
  add column if not exists kenntnis jsonb not null default '[]'::jsonb,   -- [{ "person_id": …, "am": … }]
  add column if not exists freigegeben_von text,
  add column if not exists freigegeben_am timestamptz,
  add column if not exists uebergabe jsonb,                               -- Felder für die KC-Programme (nur nach Freigabe)
  add column if not exists uebernommen_am timestamptz,
  add column if not exists uebernommen_von text,                          -- Programm + Benutzer, der übernommen hat
  add column if not exists uebernahme_ergebnis jsonb,
  add column if not exists rueckfrage text check (rueckfrage is null or char_length(rueckfrage) <= 500),
  add column if not exists mitglied_informiert_am timestamptz;
alter table kc_club_aenderungen drop constraint if exists kc_club_aenderungen_status_check;
alter table kc_club_aenderungen add constraint kc_club_aenderungen_status_check
  check (status in ('offen', 'freigegeben', 'uebernommen', 'abgelehnt', 'rueckfrage', 'erledigt', 'zurueckgezogen'));
create index if not exists kc_club_aenderungen_uebergabe on kc_club_aenderungen (org_id, status, freigegeben_am) where status = 'freigegeben';

-- Für KC-Programme: freigegebene, noch nicht übernommene Änderungen der Organisation
create or replace function public.kc_core_person_aenderungen_offen(p_org_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
begin
  if auth.uid() is null or not (kc_private.kc_core_is_admin(p_org_id) or kc_private.kc_core_has_app_access(p_org_id, 'KC_MANAGER', array['manager', 'admin'])) then
    raise exception 'Keine Berechtigung für Personen-Änderungen' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', a.id, 'person_id', a.person_id, 'art', a.art, 'felder', a.uebergabe, 'gilt_ab', a.gilt_ab,
      'gemeldet_am', a.erstellt_am, 'freigegeben_am', a.freigegeben_am) order by a.freigegeben_am)
    from kc_club_aenderungen a
    where a.org_id = p_org_id and a.status = 'freigegeben' and a.uebergabe is not null), '[]'::jsonb);
end $function$;

-- Für KC-Programme: „übernommen“ oder „abgelehnt“ zurückmelden (nur einmal, nur solange freigegeben)
create or replace function public.kc_core_person_aenderung_quittieren(p_id uuid, p_status text, p_programm text, p_ergebnis jsonb default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_org text; v_n int;
begin
  if auth.uid() is null then raise exception 'Keine Berechtigung für Personen-Änderungen' using errcode = '42501'; end if;
  select org_id into v_org from kc_club_aenderungen where id = p_id;
  if v_org is null then return jsonb_build_object('ok', false, 'grund', 'nicht_gefunden'); end if;
  if auth.uid() is null or not (kc_private.kc_core_is_admin(v_org) or kc_private.kc_core_has_app_access(v_org, 'KC_MANAGER', array['manager', 'admin'])) then
    raise exception 'Keine Berechtigung für Personen-Änderungen' using errcode = '42501';
  end if;
  if p_status not in ('uebernommen', 'abgelehnt') then raise exception 'Status muss uebernommen oder abgelehnt sein'; end if;
  update kc_club_aenderungen set status = p_status, uebernommen_am = now(),
      uebernommen_von = left(coalesce(nullif(trim(p_programm), ''), 'Programm'), 40) || ':' || auth.uid()::text,
      uebernahme_ergebnis = case when p_ergebnis is null or length(p_ergebnis::text) > 4000 then null else p_ergebnis end
    where id = p_id and status = 'freigegeben';
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', v_n = 1, 'status', case when v_n = 1 then p_status else (select status from kc_club_aenderungen where id = p_id) end);
end $function$;
revoke all on function public.kc_core_person_aenderungen_offen(text) from public, anon;
revoke all on function public.kc_core_person_aenderung_quittieren(uuid, text, text, jsonb) from public, anon;
grant execute on function public.kc_core_person_aenderungen_offen(text) to authenticated, service_role;
grant execute on function public.kc_core_person_aenderung_quittieren(uuid, text, text, jsonb) to authenticated, service_role;
