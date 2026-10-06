-- KC-CORE-PERSON-UEBERNAHME V1 (Wunsch Hansi, abgestimmt mit Codex – Antworten 1–6 vom 06.10.2026)
-- Teil 1 KC-MANAGER-SECTION-SCHUTZ: Manager-Abschnitte (kc_manager_state_sections) nur noch mit passender Version speichern.
--   • kc_manager_section_speichern(org, section, payload, erwartete_version): Compare-and-swap in EINER Anweisung (WHERE version = erwartet)
--   • Trigger kc_manager_state_sections_version_guard: jede Änderung muss version = alt + 1 setzen.
--     Stufe „melden“ (Start): Verstöße nur ins Protokoll; Stufe „erzwingen“: Abbruch mit 40001. Umschalten nur nach Freigabe Hansi + Codex.
-- Teil 2 KC-CORE-PERSON-UEBERNAHME: freigegebene Änderungsmeldungen aus der Club-App atomar übernehmen
--   • kc_core_person_aenderung_uebernehmen(...): Kernwerte (kc_core_people / kc_core_club_memberships) schreiben, Audit, Status – ein Datenbankvorgang
--   • Vorgangsnummer (UUID, Primärschlüssel) für jede Entscheidung, auch Ablehnung; Wiederholung liefert das gespeicherte Ergebnis unverändert
--   • Festnetz (Manager-Mitgliederliste) bleibt gesperrt („manager_schutz_fehlt“), bis der Speicherschutz erzwungen wird
--   • kc_core_person_aenderungen_offen liefert zusätzlich erwartet_schluessel (rückwärtskompatibel)
-- Die Club-App ruft keine dieser Funktionen auf (sie schreibt nie kc_core_people).
-- Rückweg: siehe Ende der Datei.

-- ---------------------------------------------------------------- Teil 1: Speicherschutz Manager-Abschnitte
create table if not exists public.kc_manager_section_schutz (
  id smallint primary key default 1 check (id = 1),
  modus text not null default 'melden' check (modus in ('melden', 'erzwingen')),
  geaendert_am timestamptz not null default now(),
  geaendert_von text
);
insert into public.kc_manager_section_schutz (id, modus, geaendert_von) values (1, 'melden', 'migration v1') on conflict (id) do nothing;
alter table public.kc_manager_section_schutz enable row level security;
revoke all on public.kc_manager_section_schutz from public, anon, authenticated;

create table if not exists public.kc_manager_section_schutz_log (
  id bigserial primary key,
  org_id text not null,
  section_key text not null,
  alt_version bigint,
  neu_version bigint,
  user_id uuid,
  modus text not null,
  zeit timestamptz not null default now()
);
create index if not exists kc_manager_section_schutz_log_zeit_idx on public.kc_manager_section_schutz_log (zeit desc);
alter table public.kc_manager_section_schutz_log enable row level security;
revoke all on public.kc_manager_section_schutz_log from public, anon, authenticated;

create or replace function public.kc_manager_state_sections_version_guard()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_modus text;
begin
  if new.version is distinct from old.version + 1 then
    select modus into v_modus from public.kc_manager_section_schutz where id = 1;
    v_modus := coalesce(v_modus, 'melden');
    insert into public.kc_manager_section_schutz_log (org_id, section_key, alt_version, neu_version, user_id, modus)
      values (old.org_id, old.section_key, old.version, new.version, auth.uid(), v_modus);
    if v_modus = 'erzwingen' then
      raise exception 'Abschnitt % wurde inzwischen geändert (Version %) – bitte neu laden', old.section_key, old.version
        using errcode = '40001';
    end if;
  end if;
  return new;
end;
$function$;
revoke all on function public.kc_manager_state_sections_version_guard() from public, anon, authenticated;
drop trigger if exists trg_kc_manager_state_sections_version_guard on public.kc_manager_state_sections;
create trigger trg_kc_manager_state_sections_version_guard
  before update on public.kc_manager_state_sections
  for each row execute function public.kc_manager_state_sections_version_guard();

-- Compare-and-swap: speichert nur, wenn die Version noch der erwarteten entspricht. p_erwartete_version null = Neuanlage.
create or replace function public.kc_manager_section_speichern(p_org_id text, p_section_key text, p_payload jsonb, p_erwartete_version bigint)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_uid uuid := auth.uid();
  v_version bigint;
  v_zeit timestamptz;
  v_aktuell bigint;
begin
  if v_uid is null or not exists (
    select 1 from public.kc_manager_memberships m
    where m.org_id = p_org_id and m.user_id = v_uid and m.active and m.role in ('operator', 'manager', 'admin')) then
    raise exception 'Keine Berechtigung für diesen Bereich' using errcode = '42501';
  end if;
  if p_section_key is null or p_section_key !~ '^[a-z][a-zA-Z0-9_]{1,79}$' then
    return jsonb_build_object('ok', false, 'grund', 'abschnitt_ungueltig');
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    return jsonb_build_object('ok', false, 'grund', 'inhalt_ungueltig');
  end if;
  if p_erwartete_version is null then
    insert into public.kc_manager_state_sections (org_id, section_key, payload, version, updated_at, updated_by)
      values (p_org_id, p_section_key, p_payload, 1, now(), v_uid)
      on conflict (org_id, section_key) do nothing
      returning version, updated_at into v_version, v_zeit;
  else
    update public.kc_manager_state_sections
      set payload = p_payload, version = p_erwartete_version + 1, updated_at = now(), updated_by = v_uid
      where org_id = p_org_id and section_key = p_section_key and version = p_erwartete_version
      returning version, updated_at into v_version, v_zeit;
  end if;
  if v_version is null then
    select version into v_aktuell from public.kc_manager_state_sections where org_id = p_org_id and section_key = p_section_key;
    return jsonb_build_object('ok', false, 'grund', case when v_aktuell is null then 'nicht_vorhanden' else 'konflikt' end,
      'aktuelle_version', v_aktuell, 'erwartete_version', p_erwartete_version);
  end if;
  return jsonb_build_object('ok', true, 'version', v_version, 'updated_at', v_zeit);
end;
$function$;
revoke all on function public.kc_manager_section_speichern(text, text, jsonb, bigint) from public, anon;
grant execute on function public.kc_manager_section_speichern(text, text, jsonb, bigint) to authenticated;

-- ---------------------------------------------------------------- Teil 2: Personenübernahme
create table if not exists public.kc_core_people_audit (
  id bigserial primary key,
  org_id text not null,
  person_id text not null,
  aenderung_id uuid,
  vorgang uuid,
  ziel text not null,
  feld text not null,
  alt jsonb,
  neu jsonb,
  programm text not null,
  user_id uuid,
  zeit timestamptz not null default now()
);
create index if not exists kc_core_people_audit_person_idx on public.kc_core_people_audit (org_id, person_id, zeit desc);
alter table public.kc_core_people_audit enable row level security;
revoke all on public.kc_core_people_audit from public, anon, authenticated;

create table if not exists public.kc_core_person_vorgaenge (
  vorgang uuid primary key,
  aenderung_id uuid not null,
  entscheidung text not null,
  programm text not null,
  user_id uuid,
  ergebnis jsonb,
  zeit timestamptz not null default now()
);
alter table public.kc_core_person_vorgaenge enable row level security;
revoke all on public.kc_core_person_vorgaenge from public, anon, authenticated;

-- Welche bisherigen Werte der Manager mitschicken muss (je Ziel). Leere Liste = keine Datenänderung möglich.
create or replace function public.kc_core_person_erwartet_schluessel(p_uebergabe jsonb)
returns jsonb
language sql
immutable
set search_path to 'pg_catalog'
as $function$
  select case
    when p_uebergabe ? 'landline' then jsonb_build_object('kern', '[]'::jsonb, 'manager', '["phone"]'::jsonb)
    when p_uebergabe ? 'membership' then jsonb_build_object('kern',
      case when p_uebergabe->>'membership' = 'austritt' then '["membership_status","left_on"]'::jsonb else '["membership_status"]'::jsonb end,
      'manager', '[]'::jsonb)
    else jsonb_build_object('kern', coalesce((select jsonb_agg(k order by k) from jsonb_object_keys(p_uebergabe) k where k <> 'hinweis'), '[]'::jsonb),
      'manager', '[]'::jsonb)
  end
$function$;
revoke all on function public.kc_core_person_erwartet_schluessel(jsonb) from public, anon;
grant execute on function public.kc_core_person_erwartet_schluessel(jsonb) to authenticated;

-- Offene Liste: unverändert, zusätzlich erwartet_schluessel und schreibbar (Festnetz in V1 immer false – Manager-Ziel folgt mit eigener Freigabe)
create or replace function public.kc_core_person_aenderungen_offen(p_org_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $function$
begin
  if auth.uid() is null or not (kc_private.kc_core_is_admin(p_org_id) or kc_private.kc_core_has_app_access(p_org_id, 'KC_MANAGER', array['manager', 'admin'])) then
    raise exception 'Keine Berechtigung für Personen-Änderungen' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', a.id, 'person_id', a.person_id, 'art', a.art, 'felder', a.uebergabe, 'gilt_ab', a.gilt_ab,
      'gemeldet_am', a.erstellt_am, 'freigegeben_am', a.freigegeben_am,
      'erwartet_schluessel', public.kc_core_person_erwartet_schluessel(a.uebergabe),
      'schreibbar', not (a.uebergabe ? 'landline')) order by a.freigegeben_am)
    from public.kc_club_aenderungen a
    where a.org_id = p_org_id and a.status = 'freigegeben' and a.uebergabe is not null), '[]'::jsonb);
end;
$function$;

create or replace function public.kc_core_person_aenderung_uebernehmen(
  p_id uuid, p_vorgang uuid, p_entscheidung text, p_erwartet jsonb default '{}'::jsonb, p_grund text default null, p_programm text default 'KC_MANAGER')
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
set statement_timeout to '30s'
as $function$
declare
  c_kern constant text[] := array['given_name', 'family_name', 'email', 'phone', 'street', 'postal_code', 'city', 'birth_date'];
  v_uid uuid := auth.uid();
  v_org text;
  v_admin boolean;
  v_v public.kc_core_person_vorgaenge%rowtype;
  v_n integer;
  a public.kc_club_aenderungen%rowtype;
  p public.kc_core_people%rowtype;
  m public.kc_core_club_memberships%rowtype;
  u jsonb;
  v_heute date := (now() at time zone 'Europe/Berlin')::date;
  v_erw jsonb;
  v_kern jsonb;
  v_mgr jsonb;
  v_soll jsonb;
  k text;
  v_fehlt text[] := '{}';
  v_extra text[] := '{}';
  v_abw text[] := '{}';
  v_aktuell jsonb := '{}'::jsonb;
  v_ist text;
  v_felder jsonb := '[]'::jsonb;
  v_erg jsonb;
  v_disp text;
  v_disp_alt text;
  v_neu_wert text;
  v_datum date;
  v_status text;
begin
  -- 0. Eingaben (ohne Vorgangs-Speicherung: deterministisch, Wiederholung ergibt dasselbe)
  if v_uid is null then raise exception 'Keine Berechtigung für Personen-Änderungen' using errcode = '42501'; end if;
  if p_programm is distinct from 'KC_MANAGER' then return jsonb_build_object('ok', false, 'grund', 'programm_unzulaessig'); end if;
  if p_id is null or p_vorgang is null then return jsonb_build_object('ok', false, 'grund', 'eingabe_fehlt'); end if;
  if p_entscheidung is null or p_entscheidung not in ('uebernehmen', 'mitgliedschaft_bestaetigt', 'ablehnen', 'erledigt_ohne_aenderung') then
    return jsonb_build_object('ok', false, 'grund', 'entscheidung_unbekannt');
  end if;
  if p_entscheidung in ('ablehnen', 'erledigt_ohne_aenderung') and nullif(trim(coalesce(p_grund, '')), '') is null then
    return jsonb_build_object('ok', false, 'grund', 'grund_fehlt');
  end if;
  if p_erwartet is null or jsonb_typeof(p_erwartet) <> 'object' then return jsonb_build_object('ok', false, 'grund', 'erwartet_ungueltig'); end if;

  -- 1. Rechte (auch vor jeder Ausgabe eines gespeicherten Ergebnisses)
  select org_id into v_org from public.kc_club_aenderungen where id = p_id;
  if v_org is null then return jsonb_build_object('ok', false, 'grund', 'nicht_gefunden'); end if;
  v_admin := kc_private.kc_core_is_admin(v_org);
  if not (v_admin or kc_private.kc_core_has_app_access(v_org, 'KC_MANAGER', array['manager', 'admin'])) then
    raise exception 'Keine Berechtigung für Personen-Änderungen' using errcode = '42501';
  end if;
  if p_entscheidung = 'mitgliedschaft_bestaetigt' and not v_admin then
    raise exception 'Mitgliedschaft bestätigen darf nur ein Admin' using errcode = '42501';
  end if;

  -- 2. Vorgangsnummer reservieren (Primärschlüssel: gleichzeitige Aufrufe mit derselben Nummer warten hier aufeinander)
  insert into public.kc_core_person_vorgaenge (vorgang, aenderung_id, entscheidung, programm, user_id)
    values (p_vorgang, p_id, p_entscheidung, p_programm, v_uid)
    on conflict (vorgang) do nothing;
  get diagnostics v_n = row_count;
  if v_n = 0 then
    select * into v_v from public.kc_core_person_vorgaenge where vorgang = p_vorgang;
    if v_v.aenderung_id <> p_id or v_v.entscheidung <> p_entscheidung then
      return jsonb_build_object('ok', false, 'grund', 'vorgang_widerspruch');
    end if;
    -- gespeichertes Ergebnis unverändert zurück (ok:false bleibt ok:false); wiederholt:true heißt nur „schon bearbeitet“
    return coalesce(v_v.ergebnis, jsonb_build_object('ok', false, 'grund', 'vorgang_unvollstaendig')) || jsonb_build_object('wiederholt', true);
  end if;

  -- 3. Meldung sperren
  select * into a from public.kc_club_aenderungen where id = p_id for update;
  u := coalesce(a.uebergabe, '{}'::jsonb);
  if a.status <> 'freigegeben' then
    v_erg := case when a.status in ('uebernommen', 'abgelehnt', 'erledigt')
      then jsonb_build_object('ok', false, 'grund', 'bereits_erledigt', 'status', a.status, 'eigener_vorgang', false)
      else jsonb_build_object('ok', false, 'grund', 'nicht_offen', 'status', a.status) end;
  elsif jsonb_typeof(u) <> 'object' or u = '{}'::jsonb then
    v_erg := jsonb_build_object('ok', false, 'grund', 'nichts_zu_uebergeben');

  -- 4a. Ablehnen
  elsif p_entscheidung = 'ablehnen' then
    v_erg := jsonb_build_object('ok', true, 'status', 'abgelehnt', 'felder', '[]'::jsonb);
    update public.kc_club_aenderungen set status = 'abgelehnt', uebernommen_am = now(), uebernommen_von = 'KC_MANAGER:' || v_uid::text,
      uebernahme_ergebnis = jsonb_build_object('vorgang', p_vorgang, 'entscheidung', p_entscheidung, 'grund', left(trim(p_grund), 500))
      where id = p_id;

  -- 4b. Nur Hinweis: ohne Datenänderung erledigen
  elsif p_entscheidung = 'erledigt_ohne_aenderung' then
    if exists (select 1 from jsonb_object_keys(u) x where x <> 'hinweis') then
      v_erg := jsonb_build_object('ok', false, 'grund', 'entscheidung_unpassend');
    else
      v_erg := jsonb_build_object('ok', true, 'status', 'uebernommen', 'felder', '[]'::jsonb, 'ohne_aenderung', true);
      update public.kc_club_aenderungen set status = 'uebernommen', uebernommen_am = now(), uebernommen_von = 'KC_MANAGER:' || v_uid::text,
        uebernahme_ergebnis = jsonb_build_object('vorgang', p_vorgang, 'entscheidung', p_entscheidung, 'ohne_aenderung', true, 'grund', left(trim(p_grund), 500))
        where id = p_id;
    end if;

  -- 4c. Übernehmen / Mitgliedschaft bestätigen
  else
    v_erw := public.kc_core_person_erwartet_schluessel(u);
    v_kern := coalesce(p_erwartet->'kern', '{}'::jsonb);
    v_mgr := coalesce(p_erwartet->'manager', '{}'::jsonb);
    if u ? 'landline' then
      if coalesce((select modus = 'erzwingen' from public.kc_manager_section_schutz where id = 1), false) then
        v_erg := jsonb_build_object('ok', false, 'grund', 'manager_ziel_nicht_freigeschaltet'); -- Stufe 2 folgt mit eigener Freigabe
      else
        v_erg := jsonb_build_object('ok', false, 'grund', 'manager_schutz_fehlt');
      end if;
    elsif not exists (select 1 from jsonb_object_keys(u) x where x <> 'hinweis') then
      v_erg := jsonb_build_object('ok', false, 'grund', 'entscheidung_unpassend'); -- nur Hinweis: ablehnen oder erledigt_ohne_aenderung
    elsif exists (select 1 from jsonb_object_keys(u) x where x <> 'hinweis' and x <> 'membership' and not (x = any(c_kern))) then
      v_erg := jsonb_build_object('ok', false, 'grund', 'feld_unzulaessig',
        'felder', (select jsonb_agg(x) from jsonb_object_keys(u) x where x <> 'hinweis' and x <> 'membership' and not (x = any(c_kern))));
    elsif (u ? 'membership') <> (p_entscheidung = 'mitgliedschaft_bestaetigt') then
      v_erg := jsonb_build_object('ok', false, 'grund', case when u ? 'membership' then 'entscheidung_noetig' else 'entscheidung_unpassend' end);
    elsif u ? 'membership' and u->>'membership' not in ('austritt', 'ruhend') then
      v_erg := jsonb_build_object('ok', false, 'grund', 'wert_unzulaessig', 'felder', '["membership"]'::jsonb);
    elsif a.gilt_ab is not null and a.gilt_ab > v_heute then
      v_erg := jsonb_build_object('ok', false, 'grund', 'zu_frueh', 'gilt_ab', a.gilt_ab);
    elsif jsonb_typeof(v_kern) <> 'object' or jsonb_typeof(v_mgr) <> 'object'
       or exists (select 1 from jsonb_object_keys(p_erwartet) x where x not in ('kern', 'manager')) then
      v_erg := jsonb_build_object('ok', false, 'grund', 'erwartet_ungueltig');
    else
      -- erwartete Schlüssel je Ziel genau prüfen
      select coalesce(array_agg(x), '{}') into v_fehlt from jsonb_array_elements_text(v_erw->'kern') x where not v_kern ? x;
      select coalesce(array_agg(x), '{}') into v_extra from jsonb_object_keys(v_kern) x where not (v_erw->'kern') ? x;
      if cardinality(v_fehlt) > 0 then
        v_erg := jsonb_build_object('ok', false, 'grund', 'erwartet_unvollstaendig', 'ziel', 'kern', 'felder', to_jsonb(v_fehlt));
      elsif cardinality(v_extra) > 0 then
        v_erg := jsonb_build_object('ok', false, 'grund', 'erwartet_unbekannt', 'ziel', 'kern', 'felder', to_jsonb(v_extra));
      elsif v_mgr <> '{}'::jsonb then
        v_erg := jsonb_build_object('ok', false, 'grund', 'erwartet_unbekannt', 'ziel', 'manager',
          'felder', (select jsonb_agg(x) from jsonb_object_keys(v_mgr) x));
      end if;
    end if;

    if v_erg is null and u ? 'membership' then
      -- Mitgliedschaft (nur Admin, oben geprüft)
      select * into m from public.kc_core_club_memberships where org_id = a.org_id and person_id = a.person_id for update;
      if not found then
        v_erg := jsonb_build_object('ok', false, 'grund', 'person_unbekannt');
      else
        foreach k in array array(select jsonb_array_elements_text(v_erw->'kern')) loop
          v_ist := case k when 'membership_status' then m.membership_status when 'left_on' then m.left_on::text end;
          if nullif(trim(coalesce(v_ist, '')), '') is distinct from nullif(trim(coalesce(v_kern->>k, '')), '') then
            v_abw := v_abw || k; v_aktuell := v_aktuell || jsonb_build_object(k, v_ist);
          end if;
        end loop;
        if cardinality(v_abw) > 0 then
          v_erg := jsonb_build_object('ok', false, 'grund', 'geaendert', 'ziel', 'kern', 'felder', to_jsonb(v_abw), 'aktuell', v_aktuell);
        elsif u->>'membership' = 'austritt' and a.gilt_ab is null then
          v_erg := jsonb_build_object('ok', false, 'grund', 'gilt_ab_fehlt');
        elsif u->>'membership' = 'austritt' and m.joined_on is not null and a.gilt_ab < m.joined_on then
          v_erg := jsonb_build_object('ok', false, 'grund', 'wert_unzulaessig', 'felder', '["left_on"]'::jsonb);
        else
          v_status := case when u->>'membership' = 'austritt' then 'former' else 'inactive' end;
          update public.kc_core_club_memberships
            set membership_status = v_status, left_on = case when v_status = 'former' then a.gilt_ab else left_on end, updated_at = now()
            where org_id = a.org_id and person_id = a.person_id;
          v_felder := v_felder || jsonb_build_object('feld', 'membership_status', 'ziel', 'kc_core_club_memberships', 'alt', m.membership_status, 'neu', v_status);
          insert into public.kc_core_people_audit (org_id, person_id, aenderung_id, vorgang, ziel, feld, alt, neu, programm, user_id)
            values (a.org_id, a.person_id, p_id, p_vorgang, 'kc_core_club_memberships', 'membership_status', to_jsonb(m.membership_status), to_jsonb(v_status), p_programm, v_uid);
          if v_status = 'former' then
            v_felder := v_felder || jsonb_build_object('feld', 'left_on', 'ziel', 'kc_core_club_memberships', 'alt', m.left_on, 'neu', a.gilt_ab);
            insert into public.kc_core_people_audit (org_id, person_id, aenderung_id, vorgang, ziel, feld, alt, neu, programm, user_id)
              values (a.org_id, a.person_id, p_id, p_vorgang, 'kc_core_club_memberships', 'left_on', to_jsonb(m.left_on), to_jsonb(a.gilt_ab), p_programm, v_uid);
          end if;
        end if;
      end if;

    elsif v_erg is null then
      -- Kern-Personendaten
      select * into p from public.kc_core_people where org_id = a.org_id and person_id = a.person_id for update;
      if not found then
        v_erg := jsonb_build_object('ok', false, 'grund', 'person_unbekannt');
      else
        v_soll := to_jsonb(p);
        foreach k in array array(select jsonb_array_elements_text(v_erw->'kern')) loop
          v_ist := v_soll->>k;
          if nullif(trim(coalesce(v_ist, '')), '') is distinct from nullif(trim(coalesce(v_kern->>k, '')), '') then
            v_abw := v_abw || k; v_aktuell := v_aktuell || jsonb_build_object(k, v_ist);
          end if;
        end loop;
        if cardinality(v_abw) > 0 then
          v_erg := jsonb_build_object('ok', false, 'grund', 'geaendert', 'ziel', 'kern', 'felder', to_jsonb(v_abw), 'aktuell', v_aktuell);
        else
          -- neue Werte prüfen
          v_abw := '{}';
          foreach k in array array(select jsonb_array_elements_text(v_erw->'kern')) loop
            v_neu_wert := nullif(trim(coalesce(u->>k, '')), '');
            if (k in ('given_name', 'family_name') and v_neu_wert is null) or length(coalesce(v_neu_wert, '')) > 200
               or (k = 'email' and v_neu_wert is not null and v_neu_wert !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then
              v_abw := v_abw || k;
            elsif k = 'birth_date' and v_neu_wert is not null then
              begin v_datum := v_neu_wert::date; exception when others then v_abw := v_abw || k; end;
              if v_datum is not null and (v_datum > v_heute or v_datum < date '1900-01-01') then v_abw := v_abw || k; end if;
            end if;
          end loop;
          if cardinality(v_abw) > 0 then
            v_erg := jsonb_build_object('ok', false, 'grund', 'wert_unzulaessig', 'felder', to_jsonb(v_abw));
          else
            v_disp_alt := p.display_name;
            v_disp := null;
            if (u ? 'given_name' or u ? 'family_name')
               and trim(coalesce(p.display_name, '')) = trim(concat_ws(' ', nullif(trim(coalesce(p.given_name, '')), ''), nullif(trim(coalesce(p.family_name, '')), ''))) then
              v_disp := trim(concat_ws(' ', coalesce(nullif(trim(coalesce(u->>'given_name', '')), ''), p.given_name),
                                             coalesce(nullif(trim(coalesce(u->>'family_name', '')), ''), p.family_name)));
            end if;
            update public.kc_core_people set
              given_name  = case when u ? 'given_name'  then nullif(trim(coalesce(u->>'given_name', '')), '')  else given_name end,
              family_name = case when u ? 'family_name' then nullif(trim(coalesce(u->>'family_name', '')), '') else family_name end,
              email       = case when u ? 'email'       then nullif(trim(coalesce(u->>'email', '')), '')       else email end,
              phone       = case when u ? 'phone'       then nullif(trim(coalesce(u->>'phone', '')), '')       else phone end,
              street      = case when u ? 'street'      then nullif(trim(coalesce(u->>'street', '')), '')      else street end,
              postal_code = case when u ? 'postal_code' then nullif(trim(coalesce(u->>'postal_code', '')), '') else postal_code end,
              city        = case when u ? 'city'        then nullif(trim(coalesce(u->>'city', '')), '')        else city end,
              birth_date  = case when u ? 'birth_date'  then nullif(trim(coalesce(u->>'birth_date', '')), '')::date else birth_date end,
              display_name = coalesce(v_disp, display_name),
              updated_at = now()
              where org_id = a.org_id and person_id = a.person_id;
            foreach k in array array(select jsonb_array_elements_text(v_erw->'kern')) loop
              v_felder := v_felder || jsonb_build_object('feld', k, 'ziel', 'kc_core_people', 'alt', v_soll->k, 'neu', nullif(trim(coalesce(u->>k, '')), ''));
              insert into public.kc_core_people_audit (org_id, person_id, aenderung_id, vorgang, ziel, feld, alt, neu, programm, user_id)
                values (a.org_id, a.person_id, p_id, p_vorgang, 'kc_core_people', k, v_soll->k, to_jsonb(nullif(trim(coalesce(u->>k, '')), '')), p_programm, v_uid);
            end loop;
            if v_disp is not null and v_disp is distinct from v_disp_alt then
              v_felder := v_felder || jsonb_build_object('feld', 'display_name', 'ziel', 'kc_core_people', 'alt', v_disp_alt, 'neu', v_disp);
              insert into public.kc_core_people_audit (org_id, person_id, aenderung_id, vorgang, ziel, feld, alt, neu, programm, user_id)
                values (a.org_id, a.person_id, p_id, p_vorgang, 'kc_core_people', 'display_name', to_jsonb(v_disp_alt), to_jsonb(v_disp), p_programm, v_uid);
            end if;
          end if;
        end if;
      end if;
    end if;

    if v_erg is null then
      v_erg := jsonb_build_object('ok', true, 'status', 'uebernommen', 'felder', v_felder,
        'display_name_unveraendert', (u ? 'given_name' or u ? 'family_name') and v_disp is null);
      update public.kc_club_aenderungen set status = 'uebernommen', uebernommen_am = now(), uebernommen_von = 'KC_MANAGER:' || v_uid::text,
        uebernahme_ergebnis = jsonb_build_object('vorgang', p_vorgang, 'entscheidung', p_entscheidung, 'felder', v_felder)
        where id = p_id;
    end if;
  end if;

  update public.kc_core_person_vorgaenge set ergebnis = v_erg where vorgang = p_vorgang;
  return v_erg;
end;
$function$;
revoke all on function public.kc_core_person_aenderung_uebernehmen(uuid, uuid, text, jsonb, text, text) from public, anon;
grant execute on function public.kc_core_person_aenderung_uebernehmen(uuid, uuid, text, jsonb, text, text) to authenticated;

-- Rückweg (nur nach Freigabe):
--   drop trigger trg_kc_manager_state_sections_version_guard on public.kc_manager_state_sections;
--   drop function public.kc_manager_state_sections_version_guard(); drop function public.kc_manager_section_speichern(text, text, jsonb, bigint);
--   drop function public.kc_core_person_aenderung_uebernehmen(uuid, uuid, text, jsonb, text, text); drop function public.kc_core_person_erwartet_schluessel(jsonb);
--   kc_core_person_aenderungen_offen aus 20261004_kc_club_v22219_aenderung_freigabe.sql erneut einspielen;
--   Tabellen kc_core_people_audit, kc_core_person_vorgaenge, kc_manager_section_schutz(_log) bleiben als Beleg erhalten.
