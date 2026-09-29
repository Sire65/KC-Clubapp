-- KC DP2 ↔ Club-App: Dienstwünsche aus der Club-App (Twinkey-Nachbau) – Vorbereitung 29.09.2026 (Freigabe Hansi)
-- Datenvertrag: DP2 bleibt Eigentümer der Dienstplanung. Die Club-App LIEFERT nur an (Wunsch-Eingang) und LIEST, was DP2
-- veröffentlicht (Tage/Kernzeit/Bedarf, Sollplan, Wunschphase). DP2 holt den Eingang ab, übernimmt ihn in seine
-- (verschlüsselten) Wünsche und bestätigt. Umsetzung in DP2: Codex nach docs/DP2_CODEX_AUFTRAG_WUNSCHEINGANG.md.
--
-- 1) kc_dp_days_published  + RPC kc_dp_days_publish(org, event, days)   – DP2 veröffentlicht Tage (Snapshot, wie Sollplan)
-- 2) kc_dp_wish_inbox      + RPCs kc_dp_wish_inbox_pending / _ack        – Club-App liefert, DP2 holt ab und bestätigt
-- 3) Datenvertrag (kc_core_data_contract) + Spiegel-Regeln

-- ---------- 1) Veröffentlichte Tage (DP2 → alle Leser) ----------
create table if not exists public.kc_dp_days_published (
  org_id text not null,
  project_id text not null default 'KC_DP',
  event_id text not null,
  work_date date not null,
  day_type text not null check (day_type in ('prep', 'market', 'after', 'other')),
  day_start numeric(4,2) not null check (day_start >= 0 and day_start <= 24),      -- Einsatzzeitraum von (Dezimalstunden, 11.5 = 11:30)
  day_end numeric(4,2) not null check (day_end > 0 and day_end <= 24),             -- Einsatzzeitraum bis
  core_start numeric(4,2) check (core_start >= 0 and core_start <= 24),           -- Kernzeit von (Markt geöffnet / Dienst muss abgedeckt sein)
  core_end numeric(4,2) check (core_end > 0 and core_end <= 24),                  -- Kernzeit bis (null = bis day_end)
  pre_open_minutes integer not null default 0 check (pre_open_minutes between 0 and 600),
  demand jsonb not null default '[]'::jsonb,   -- [{start,end,total,front,back}] Bedarf je Zeitabschnitt (front/back null = keine Aufteilung)
  program jsonb not null default '[]'::jsonb,  -- [{title,start,end,impact}] Programmpunkte (nur Anzeige)
  label text,                                   -- freie Anzeige, z. B. „Aufbau“
  status text not null default 'published' check (status in ('published', 'removed')),
  source text not null default 'dp2',
  source_version text not null,
  payload jsonb not null default '{}'::jsonb,
  checksum text not null,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, event_id, work_date),
  check (day_end > day_start),
  check (core_end is null or core_start is null or core_end > core_start)
);
alter table public.kc_dp_days_published enable row level security;
revoke all on public.kc_dp_days_published from anon;
drop policy if exists kc_dp_days_published_read on public.kc_dp_days_published;
create policy kc_dp_days_published_read on public.kc_dp_days_published for select to authenticated using (
  exists (select 1 from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = kc_dp_days_published.org_id and m.active is true)
  or exists (select 1 from public.kc_manager_memberships m where m.user_id = (select auth.uid()) and m.org_id = kc_dp_days_published.org_id and m.active is true and m.role = any (array['admin','superadmin'])));
comment on table public.kc_dp_days_published is 'KC DP2 veröffentlicht Tage einer Veranstaltung (Einsatzzeit, Kernzeit, Bedarf) im Klartext für Club-App/PC-Manager. Schreiben nur per kc_dp_days_publish.';

create or replace function public.kc_dp_days_publish(p_org_id text, p_event_id text, p_days jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
declare
  v_row jsonb; v_up integer := 0; v_removed integer := 0; v_dates date[] := '{}'; v_date date;
begin
  if (select auth.uid()) is null then raise exception 'Anmeldung erforderlich'; end if;
  if not exists (select 1 from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = p_org_id and m.active is true
                 and m.role in ('admin', 'planner', 'duty_manager')) then
    raise exception 'Keine aktive dp2-Planungsberechtigung';
  end if;
  if coalesce(length(trim(p_event_id)), 0) = 0 or length(p_event_id) > 64 then raise exception 'Veranstaltungs-ID fehlt oder ist zu lang'; end if;
  if jsonb_typeof(p_days) <> 'array' or jsonb_array_length(p_days) > 400 then raise exception 'Tage als Liste mit höchstens 400 Einträgen übergeben'; end if;

  for v_row in select value from jsonb_array_elements(p_days) loop
    v_date := (v_row->>'date')::date;
    if v_date is null then raise exception 'Datum fehlt'; end if;
    v_dates := v_dates || v_date;
    insert into public.kc_dp_days_published (org_id, event_id, work_date, day_type, day_start, day_end, core_start, core_end, pre_open_minutes,
                                             demand, program, label, status, source, source_version, payload, checksum, published_at, updated_at)
    values (p_org_id, trim(p_event_id), v_date,
            case when v_row->>'type' in ('prep','market','after') then v_row->>'type' else 'other' end,
            (v_row->>'start')::numeric, (v_row->>'end')::numeric,
            nullif(v_row->>'open', '')::numeric, nullif(v_row->>'close', '')::numeric,
            greatest(0, least(600, coalesce((v_row->>'preOpenMinutes')::integer, 0))),
            coalesce(case when jsonb_typeof(v_row->'demand') = 'array' then v_row->'demand' end, '[]'::jsonb),
            coalesce(case when jsonb_typeof(v_row->'program') = 'array' then v_row->'program' end, '[]'::jsonb),
            nullif(trim(v_row->>'label'), ''), 'published', 'dp2', 'KC_DP_DAYS_PUBLISHED_V1/0.1.0', v_row,
            md5(concat_ws('|', p_org_id, p_event_id, v_row::text)), now(), now())
    on conflict (org_id, event_id, work_date) do update set
      day_type = excluded.day_type, day_start = excluded.day_start, day_end = excluded.day_end, core_start = excluded.core_start,
      core_end = excluded.core_end, pre_open_minutes = excluded.pre_open_minutes, demand = excluded.demand, program = excluded.program,
      label = excluded.label, status = 'published', source_version = excluded.source_version, payload = excluded.payload,
      checksum = excluded.checksum, published_at = excluded.published_at, updated_at = now();
    v_up := v_up + 1;
  end loop;
  -- Snapshot: Tage dieser Veranstaltung, die nicht mehr geliefert werden, gelten als entfernt
  update public.kc_dp_days_published set status = 'removed', updated_at = now()
   where org_id = p_org_id and event_id = trim(p_event_id) and status = 'published' and not (work_date = any (v_dates));
  get diagnostics v_removed = row_count;
  return jsonb_build_object('ok', true, 'received', jsonb_array_length(p_days), 'upserted', v_up, 'removed', v_removed, 'eventId', trim(p_event_id));
end;
$function$;
revoke all on function public.kc_dp_days_publish(text, text, jsonb) from public, anon;
grant execute on function public.kc_dp_days_publish(text, text, jsonb) to authenticated;
comment on function public.kc_dp_days_publish(text, text, jsonb) is 'KC DP2 → Tage/Kernzeit/Bedarf veröffentlichen (vollständiger Snapshot je org+event). Contract KC_DP_DAYS_PUBLISHED_V1.';

-- ---------- 2) Wunsch-Eingang (Club-App → DP2) ----------
-- Eine Zeile je Person und Veranstaltung = der AKTUELLE vollständige Wunschstand aus der Club-App (revision zählt hoch).
-- entries: KC_DP3_WISH_V1-Einträge [{date,start,end,wishType,wishZone,scope,comment}], wishType ∈ available|preferred|if_needed|unavailable,
--          scope 'day' nur bei unavailable (Sperrtag), Zeiten Dezimalstunden.
-- standby: {"YYYY-MM-DD":{"answer":"yes"|"no","slots":[{"start":17,"end":20,"wishZone":"B","reserve":false}]}}
create table if not exists public.kc_dp_wish_inbox (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  project_id text not null default 'KC_DP',
  event_id text not null,
  person_id text not null,
  source text not null default 'club_app' check (source in ('club_app')),
  contract text not null default 'KC_DP_WISH_INBOX_V1',
  revision integer not null default 1 check (revision > 0),
  status text not null default 'offen' check (status in ('offen', 'uebernommen', 'abgelehnt')),
  entries jsonb not null default '[]'::jsonb check (jsonb_typeof(entries) = 'array'),
  standby jsonb not null default '{}'::jsonb check (jsonb_typeof(standby) = 'object'),
  comment text,
  share_with_colleagues boolean,          -- Twinkey-Frage „Kollegen dürfen meine Zeiten als Vorlage sehen“ (null = nicht beantwortet)
  submitted_at timestamptz not null default now(),
  taken_at timestamptz,
  taken_by uuid,
  taken_revision integer,
  result jsonb,                           -- Rückmeldung von DP2 (added/replaced/skipped/problems)
  updated_at timestamptz not null default now(),
  unique (org_id, event_id, person_id, source)
);
create index if not exists kc_dp_wish_inbox_offen on public.kc_dp_wish_inbox (org_id, event_id) where status = 'offen';
alter table public.kc_dp_wish_inbox enable row level security;
revoke all on public.kc_dp_wish_inbox from anon, authenticated;
drop policy if exists kc_dp_wish_inbox_deny_direct on public.kc_dp_wish_inbox;
create policy kc_dp_wish_inbox_deny_direct on public.kc_dp_wish_inbox for all to anon, authenticated using (false) with check (false);
comment on table public.kc_dp_wish_inbox is 'Wunsch-Eingang: Club-App liefert je Person den aktuellen Dienstwunsch-Stand (Klartext, nur service_role/RPC). DP2 holt per kc_dp_wish_inbox_pending ab und bestätigt per kc_dp_wish_inbox_ack.';

-- DP2 holt offene Eingänge ab (nur Planungsrolle)
create or replace function public.kc_dp_wish_inbox_pending(p_org_id text, p_event_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
begin
  if (select auth.uid()) is null then raise exception 'Anmeldung erforderlich'; end if;
  if not exists (select 1 from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = p_org_id and m.active is true
                 and m.role in ('admin', 'planner', 'duty_manager')) then
    raise exception 'Keine aktive dp2-Planungsberechtigung';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', i.id, 'personId', i.person_id, 'eventId', i.event_id, 'source', i.source, 'contract', i.contract,
      'revision', i.revision, 'entries', i.entries, 'standby', i.standby, 'comment', i.comment, 'shareWithColleagues', i.share_with_colleagues,
      'submittedAt', i.submitted_at) order by i.submitted_at)
    from public.kc_dp_wish_inbox i where i.org_id = p_org_id and i.event_id = trim(p_event_id) and i.status = 'offen'), '[]'::jsonb);
end;
$function$;
revoke all on function public.kc_dp_wish_inbox_pending(text, text) from public, anon;
grant execute on function public.kc_dp_wish_inbox_pending(text, text) to authenticated;

-- DP2 bestätigt: nur wenn die abgeholte Revision noch aktuell ist (sonst hat das Mitglied inzwischen neu gespeichert → bleibt offen)
create or replace function public.kc_dp_wish_inbox_ack(p_id uuid, p_revision integer, p_status text, p_result jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
declare v_org text; v_n integer;
begin
  if (select auth.uid()) is null then raise exception 'Anmeldung erforderlich'; end if;
  select org_id into v_org from public.kc_dp_wish_inbox where id = p_id;
  if v_org is null then raise exception 'Eingang nicht gefunden'; end if;
  if not exists (select 1 from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = v_org and m.active is true
                 and m.role in ('admin', 'planner', 'duty_manager')) then
    raise exception 'Keine aktive dp2-Planungsberechtigung';
  end if;
  if p_status not in ('uebernommen', 'abgelehnt') then raise exception 'Status muss uebernommen oder abgelehnt sein'; end if;
  update public.kc_dp_wish_inbox set status = p_status, taken_at = now(), taken_by = (select auth.uid()), taken_revision = p_revision,
         result = coalesce(p_result, '{}'::jsonb), updated_at = now()
   where id = p_id and revision = p_revision and status = 'offen';
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', v_n = 1, 'stale', v_n = 0, 'id', p_id, 'revision', p_revision, 'status', p_status);
end;
$function$;
revoke all on function public.kc_dp_wish_inbox_ack(uuid, integer, text, jsonb) from public, anon;
grant execute on function public.kc_dp_wish_inbox_ack(uuid, integer, text, jsonb) to authenticated;

-- ---------- 3) Datenvertrag + Spiegel ----------
insert into public.kc_core_data_contract (data_area, app_id, is_owner, may_read, may_write, tables_hint, note, contract_version, created_at, updated_at)
values
  ('dienstplanung', 'KC_CLUBAPP', false, true, false, 'kc_dp_plan_published, kc_dp_days_published, kc_dp_wish_phase_settings',
   'Club-App liest veröffentlichten Sollplan („Meine Dienste“), Tage/Kernzeit und Wunschphase; schreibt NICHT in DP2-Daten', 'KC_CORE_V1', now(), now()),
  ('dienstwunsch_eingang', 'KC_CLUBAPP', true, true, true, 'kc_dp_wish_inbox',
   'Club-App liefert Dienstwünsche (Twinkey-Nachbau) je Person als aktuellen Stand an', 'KC_DP_WISH_INBOX_V1', now(), now()),
  ('dienstwunsch_eingang', 'KC_DP', false, true, true, 'kc_dp_wish_inbox',
   'DP2 holt ab (kc_dp_wish_inbox_pending), übernimmt in eigene Wünsche/Bereitschaft und bestätigt (kc_dp_wish_inbox_ack)', 'KC_DP_WISH_INBOX_V1', now(), now())
on conflict (data_area, app_id) do nothing;

insert into public.kc_db_mirror_table_rules(table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note, updated_at) values
  ('kc_dp_days_published', 'KC DP', 'normal', false, true, true, 'DP2 veröffentlichte Tage/Kernzeit/Bedarf – gespiegelt und gesichert', now()),
  ('kc_dp_wish_inbox', 'KC DP', 'sensitive', false, true, true, 'Wunsch-Eingang Club-App → DP2 (aktueller Wunschstand je Person) – gespiegelt und gesichert', now())
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables(table_name, captured_at)
select t, now() from unnest(array['kc_dp_days_published', 'kc_dp_wish_inbox']) t
where not exists (select 1 from public.kc_neon_resume_tables x where x.table_name = t);
