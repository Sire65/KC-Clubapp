-- KICC-F-113 Phase 2 / KC-CLUB-STUNDENKONTO (Wunsch Hansi 24.11.2026, „erst einspielen und dann Schritt 2“ am 25.11.2026):
-- DP2 veröffentlicht die geprüften Ist-Zeilen seines Kontoauszugs je Person, damit „⏱️ Mein Stundenkonto“ in der Club-App dieselben Zahlen zeigt
-- wie der DP2-Kontoauszug (eine Wahrheit – keine zweite Rechnung in der Club-App). Konzept: KICC docs/KONZEPT-CLUB-STUNDENKONTO.md.
-- Schreiben nur DP2 über kc_dp_konto_publish (Planungsrolle); lesen nur der Club-Server (service_role) – jedes Mitglied sieht dort nur sich,
-- Clubleitung/Planer andere (protokolliert). Gesamtstand je Veranstaltung: fehlende Zeilen werden weich auf 'removed' gesetzt.
-- Unveränderte Zeilen (gleiche Prüfsumme) werden nicht neu geschrieben – kein unnötiger Datenverkehr.
-- Rein additiv. Rückweg: drop function public.kc_dp_konto_publish(text, text, jsonb); drop table public.kc_dp_konto_published;

create table if not exists public.kc_dp_konto_published (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  event_id text not null check (char_length(event_id) between 1 and 80),
  entry_key text not null check (char_length(entry_key) between 1 and 120),      -- DP2-Ist-ID (actualShifts.id)
  person_id text not null check (char_length(person_id) between 1 and 80),
  work_date date not null,
  start_h numeric(5,2) check (start_h is null or (start_h >= 0 and start_h < 24)),
  end_h numeric(5,2) check (end_h is null or (end_h > 0 and end_h <= 36)),
  break_minutes integer not null default 0 check (break_minutes between 0 and 1440),
  minutes integer not null check (minutes between 0 and 2160),                    -- gezählte Minuten wie im DP2-Kontoauszug
  art text not null check (art in ('stand', 'sonder', 'erstattung')),
  anlass text check (anlass is null or char_length(anlass) <= 120),
  taetigkeit text check (taetigkeit is null or char_length(taetigkeit) <= 40),
  special_event_id text check (special_event_id is null or char_length(special_event_id) <= 80),
  hour_report_id text check (hour_report_id is null or char_length(hour_report_id) <= 80),
  quelle text check (quelle is null or char_length(quelle) <= 40),
  korrigiert boolean not null default false,
  abgeschlossen boolean not null default false,                                    -- Istplan bis zu diesem Tag abgeschlossen
  status text not null default 'published' check (status in ('published', 'removed')),
  checksum text not null check (char_length(checksum) between 1 and 200),
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, event_id, entry_key)
);
create index if not exists kc_dp_konto_published_person on public.kc_dp_konto_published (org_id, person_id, work_date) where status = 'published';

alter table public.kc_dp_konto_published enable row level security;
revoke all on table public.kc_dp_konto_published from public, anon, authenticated;
grant select, insert, update, delete on public.kc_dp_konto_published to service_role;
-- Keine Policy: RLS an + alle Rechte entzogen = kein direkter Zugriff (nur service_role und die Funktion unten).
comment on table public.kc_dp_konto_published is 'KICC-F-113: Kontoauszug-Zeilen aus DP2 (geprüftes Ist je Person). Schreiben nur DP2 per kc_dp_konto_publish; lesen nur kc-club (service_role). Contract KC_DP_KONTO_V1.';

create or replace function public.kc_dp_konto_publish(p_org_id text, p_event_id text, p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
declare v_event text := trim(coalesce(p_event_id, '')); v_neu integer; v_weg integer;
begin
  if (select auth.uid()) is null then raise exception 'Anmeldung erforderlich'; end if;
  if not exists (select 1 from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = p_org_id and m.active is true
                 and m.role in ('admin','planner','duty_manager')) then
    raise exception 'Keine aktive dp2-Planungsberechtigung';
  end if;
  if char_length(v_event) not between 1 and 80 then raise exception 'Veranstaltung fehlt'; end if;
  if jsonb_typeof(p_rows) is distinct from 'array' then raise exception 'Zeilen müssen eine Liste sein'; end if;
  if jsonb_array_length(p_rows) > 20000 then raise exception 'Zu viele Zeilen'; end if;

  with neu as (
    select r.* from jsonb_to_recordset(p_rows) as r(entry_key text, person_id text, work_date date, start_h numeric, end_h numeric, break_minutes integer,
      minutes integer, art text, anlass text, taetigkeit text, special_event_id text, hour_report_id text, quelle text, korrigiert boolean, abgeschlossen boolean, checksum text)
  ), auf as (
    insert into public.kc_dp_konto_published as k (org_id, event_id, entry_key, person_id, work_date, start_h, end_h, break_minutes, minutes, art, anlass, taetigkeit,
      special_event_id, hour_report_id, quelle, korrigiert, abgeschlossen, status, checksum, published_at, updated_at)
    select p_org_id, v_event, left(n.entry_key, 120), left(n.person_id, 80), n.work_date, n.start_h, n.end_h, coalesce(n.break_minutes, 0), n.minutes, n.art,
      left(n.anlass, 120), left(n.taetigkeit, 40), left(n.special_event_id, 80), left(n.hour_report_id, 80), left(n.quelle, 40),
      coalesce(n.korrigiert, false), coalesce(n.abgeschlossen, false), 'published', left(n.checksum, 200), now(), now()
    from neu n
    on conflict (org_id, event_id, entry_key) do update set
      person_id = excluded.person_id, work_date = excluded.work_date, start_h = excluded.start_h, end_h = excluded.end_h, break_minutes = excluded.break_minutes,
      minutes = excluded.minutes, art = excluded.art, anlass = excluded.anlass, taetigkeit = excluded.taetigkeit, special_event_id = excluded.special_event_id,
      hour_report_id = excluded.hour_report_id, quelle = excluded.quelle, korrigiert = excluded.korrigiert, abgeschlossen = excluded.abgeschlossen,
      status = 'published', checksum = excluded.checksum, published_at = now(), updated_at = now()
    where k.checksum is distinct from excluded.checksum or k.status <> 'published'
    returning 1
  )
  select count(*) into v_neu from auf;

  update public.kc_dp_konto_published k set status = 'removed', updated_at = now()
   where k.org_id = p_org_id and k.event_id = v_event and k.status = 'published'
     and not exists (select 1 from jsonb_array_elements(p_rows) e where e->>'entry_key' = k.entry_key);
  get diagnostics v_weg = row_count;
  return jsonb_build_object('ok', true, 'geschrieben', v_neu, 'entfernt', v_weg, 'zeilen', jsonb_array_length(p_rows));
end;
$function$;
revoke all on function public.kc_dp_konto_publish(text, text, jsonb) from public, anon;
grant execute on function public.kc_dp_konto_publish(text, text, jsonb) to authenticated;

-- KC-SECURITY-DEFINER-REGISTER: DP2 ruft die Funktion direkt auf (angemeldet, Planungsrolle)
insert into public.kc_security_reviewed_exceptions (object_schema, object_name, object_type, finding_code, decision, reason, reviewed_at, review_after, active)
select 'public', 'kc_dp_konto_publish', 'function', 'security_definer_authenticated_execute', 'accepted_required',
  'KICC-F-113 25.11.2026: verlangt auth.uid() und aktive DP-Rolle admin/planner/duty_manager für p_org_id; schreibt nur kc_dp_konto_published dieser Organisation/Veranstaltung, höchstens 20000 Zeilen. Kein anon.',
  now(), now() + interval '6 months', true
 where not exists (select 1 from public.kc_security_reviewed_exceptions r
                    where r.object_schema = 'public' and r.object_name = 'kc_dp_konto_publish' and r.finding_code = 'security_definer_authenticated_execute' and r.active);

-- Datenvertrag + Spiegel/Sicherung (wie die anderen kc_dp_*-Tabellen)
insert into public.kc_core_data_contract (data_area, app_id, is_owner, may_read, may_write, tables_hint, note, contract_version, created_at, updated_at)
values
  ('stundenkonto', 'KC_DP', true, true, true, 'kc_dp_konto_published', 'DP2 veröffentlicht die geprüften Ist-Zeilen des Kontoauszugs je Person (kc_dp_konto_publish)', 'KC_DP_KONTO_V1', now(), now()),
  ('stundenkonto', 'KC_CLUBAPP', false, true, false, 'kc_dp_konto_published', 'Club-App zeigt sie in „Mein Stundenkonto“ (nur lesen, über kc-club)', 'KC_DP_KONTO_V1', now(), now())
on conflict (data_area, app_id) do nothing;
insert into public.kc_db_mirror_table_rules(table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note, updated_at) values
  ('kc_dp_konto_published', 'KC DP', 'sensitive', false, true, true, 'Kontoauszug-Zeilen DP2 → Club-App (Stundenkonto) – gespiegelt und gesichert', now())
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables(table_name, captured_at)
select 'kc_dp_konto_published', now() where not exists (select 1 from public.kc_neon_resume_tables x where x.table_name = 'kc_dp_konto_published');
