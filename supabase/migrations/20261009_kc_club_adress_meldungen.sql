-- KC-CLUB-BUERO-ADRESSEN (2.125.0, Wunsch Hansi 09.10.2026: „Im Büro fehlt eine Adressverwaltung – mit KC Verwaltung zusammenarbeiten“, Weg B)
-- Grundsatz: KC Verwaltung bleibt das Original der Adressen (Abschnitt „addresses“ in kc_manager_state_sections) – KEINE zweite Adresskartei.
--   • Die Club-App LIEST die Adressen dort (nur über ihren Server, nur Büro).
--   • Neue/geänderte/zu entfernende Adressen meldet das Büro hier in kc_club_adress_meldungen (Status „offen“).
--   • KC Verwaltung holt offene Meldungen mit kc_club_adress_meldungen_offen() ab, übernimmt sie in ihre Adressverwaltung
--     (normaler Speicherweg der Verwaltung) und quittiert mit kc_club_adress_meldung_erledigen() („uebernommen“ / „abgelehnt“).
-- Nur neue Objekte (Tabelle, zwei Funktionen, Datenvertrag-Zeilen) – keine bestehenden Daten werden geändert.
-- Rückweg: drop function public.kc_club_adress_meldung_erledigen(uuid, text, text); drop function public.kc_club_adress_meldungen_offen(text);
--          drop table public.kc_club_adress_meldungen; delete from public.kc_core_data_contract where data_area in ('adressen', 'adress_meldungen');

create table if not exists public.kc_club_adress_meldungen (
  id uuid primary key default gen_random_uuid(),
  org_id text not null default 'KC_WERNE',
  art text not null check (art in ('neu', 'aendern', 'entfernen')),
  adresse_id text,                                -- id der Adresse in KC Verwaltung (bei aendern/entfernen)
  daten jsonb not null default '{}'::jsonb,       -- Felder im Format der KC Verwaltung (firstName, lastName, company, street, zip, city …)
  grund text,                                     -- kurze Begründung des Büros
  von_person text not null,                       -- KC-P-… (wer gemeldet hat)
  status text not null default 'offen' check (status in ('offen', 'uebernommen', 'abgelehnt', 'zurueckgezogen')),
  erstellt_am timestamptz not null default now(),
  erledigt_am timestamptz,
  erledigt_von uuid,                              -- Benutzer der KC Verwaltung (auth.uid)
  antwort text,                                   -- z. B. Ablehnungsgrund aus KC Verwaltung
  check ((art = 'neu') = (adresse_id is null))
);
create index if not exists kc_club_adress_meldungen_status_idx on public.kc_club_adress_meldungen (status, erstellt_am);
create index if not exists kc_club_adress_meldungen_von_idx on public.kc_club_adress_meldungen (von_person);
alter table public.kc_club_adress_meldungen enable row level security;
revoke all on public.kc_club_adress_meldungen from public, anon, authenticated; -- Zugriff nur: Club-App-Server (service_role) + die zwei Funktionen unten

-- Offene Meldungen für KC Verwaltung (angemeldeter Benutzer mit aktiver Rolle operator/manager/admin – wie kc_manager_section_speichern)
create or replace function public.kc_club_adress_meldungen_offen(p_org_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'pg_catalog', 'public'
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not exists (
    select 1 from public.kc_manager_memberships m
    where m.org_id = p_org_id and m.user_id = v_uid and m.active and m.role in ('operator', 'manager', 'admin')) then
    raise exception 'Keine Berechtigung für diesen Bereich' using errcode = '42501';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', a.id, 'art', a.art, 'adresse_id', a.adresse_id, 'daten', a.daten, 'grund', a.grund,
      'von', coalesce(p.display_name, a.von_person), 'erstellt_am', a.erstellt_am) order by a.erstellt_am)
    from public.kc_club_adress_meldungen a
    left join public.kc_core_people p on p.person_id = a.von_person
    where a.org_id = p_org_id and a.status = 'offen'), '[]'::jsonb);
end;
$$;

-- Quittung aus KC Verwaltung: nur offen → uebernommen/abgelehnt; Wiederholung liefert den gespeicherten Stand (kein Fehler, keine Doppelung)
create or replace function public.kc_club_adress_meldung_erledigen(p_id uuid, p_status text, p_antwort text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
declare
  v_uid uuid := auth.uid();
  v_org text;
  v_alt text;
begin
  select org_id, status into v_org, v_alt from public.kc_club_adress_meldungen where id = p_id;
  if v_org is null then return jsonb_build_object('ok', false, 'grund', 'nicht_gefunden'); end if;
  if v_uid is null or not exists (
    select 1 from public.kc_manager_memberships m
    where m.org_id = v_org and m.user_id = v_uid and m.active and m.role in ('operator', 'manager', 'admin')) then
    raise exception 'Keine Berechtigung für diesen Bereich' using errcode = '42501';
  end if;
  if p_status not in ('uebernommen', 'abgelehnt') then return jsonb_build_object('ok', false, 'grund', 'status_ungueltig'); end if;
  if v_alt <> 'offen' then return jsonb_build_object('ok', v_alt = p_status, 'status', v_alt, 'wiederholt', true); end if;
  update public.kc_club_adress_meldungen
    set status = p_status, erledigt_am = now(), erledigt_von = v_uid, antwort = left(nullif(trim(coalesce(p_antwort, '')), ''), 300)
    where id = p_id and status = 'offen';
  return jsonb_build_object('ok', true, 'status', p_status);
end;
$$;

revoke all on function public.kc_club_adress_meldungen_offen(text) from public, anon;
revoke all on function public.kc_club_adress_meldung_erledigen(uuid, text, text) from public, anon;
grant execute on function public.kc_club_adress_meldungen_offen(text) to authenticated;
grant execute on function public.kc_club_adress_meldung_erledigen(uuid, text, text) to authenticated;

-- Datenvertrag (Registry statt Absprache im Kopf): wer besitzt Adressen, wer darf lesen/melden
insert into public.kc_core_data_contract (data_area, app_id, is_owner, may_read, may_write, tables_hint, note, contract_version) values
  ('adressen', 'KC_KNG', true, true, true, 'kc_manager_state_sections (section_key addresses)', 'KC Verwaltung ist das Original aller Adressen (Mitglieder-Abgleich + externe: Lieferant, Sponsor, Presse, Behörde …)', 'KC_CORE_V1'),
  ('adressen', 'KC_CLUBAPP', false, true, false, 'kc_manager_state_sections (section_key addresses)', 'Büro liest externe Adressen über den Club-App-Server; Mitglieder weiter aus kc_core_people mit Kontakt-Freigaben; ändert nie selbst', 'KC_CORE_V1'),
  ('adress_meldungen', 'KC_CLUBAPP', true, true, true, 'kc_club_adress_meldungen', 'Büro meldet neue/geänderte/zu entfernende Adressen (Status offen)', 'KC_CORE_V1'),
  ('adress_meldungen', 'KC_KNG', false, true, true, 'kc_club_adress_meldungen', 'KC Verwaltung holt offene Meldungen ab (kc_club_adress_meldungen_offen), übernimmt sie selbst und quittiert (kc_club_adress_meldung_erledigen)', 'KC_CORE_V1')
on conflict do nothing;
