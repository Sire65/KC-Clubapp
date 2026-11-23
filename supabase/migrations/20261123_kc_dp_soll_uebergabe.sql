-- KC-DP-SOLL-UEBERGABE (Hansi 23.11.2026: „Ein-Klick-Übergabe des in der Club-App berechneten Sollplans nach DP2“ und
-- „wenn der Sollplan sich nochmals ändert, muss der Abgleich erneut laufen“).
-- Die Club-App legt den berechneten Sollplan als VOLLSTÄNDIGEN Stand ab (eine Zeile je Übergabe, rows = alle Schichten mit stabilem
-- importKey 'CLUB-<datum>-<personId>'). DP2 holt die neueste offene Übergabe ab (kc_dp_soll_uebergabe_pending), vergleicht sie mit den schon
-- übernommenen Club-Schichten (neu/geändert/entfällt) und bestätigt (kc_dp_soll_uebergabe_ack: 'uebernommen' oder 'verworfen').
-- Erst „Übernehmen“ in DP2 ändert den DP2-Sollplan; die Veröffentlichung an die Kasse läuft danach wie immer über DP2 (kc_dp_plan_publish).
-- Datenweg wie der Wunsch-Eingang (20260929_kc_dp_wunsch_eingang_v1.sql): Club-Server (service_role) schreibt, DP2 nur über die beiden Funktionen
-- (angemeldet, aktive DP-Rolle admin/planner/duty_manager der Organisation). Bereitschaft wird NICHT übergeben. Nur additiv.
-- Rückweg: drop function public.kc_dp_soll_uebergabe_pending(text, text); drop function public.kc_dp_soll_uebergabe_ack(uuid, text, jsonb);
--          drop table public.kc_dp_soll_uebergabe; delete from public.kc_db_mirror_table_rules where table_name = 'kc_dp_soll_uebergabe';
--          delete from public.kc_neon_resume_tables where table_name = 'kc_dp_soll_uebergabe';
--          delete from public.kc_security_reviewed_exceptions where object_name in ('kc_dp_soll_uebergabe_pending', 'kc_dp_soll_uebergabe_ack');
create table if not exists public.kc_dp_soll_uebergabe (
  id uuid primary key default gen_random_uuid(),
  org_id text not null default 'KC_WERNE',
  event_id text not null default 'KC-WM-2026',
  stand timestamptz,                         -- Stand des berechneten Plans in der Club-App (dp_druck.stand)
  erstellt_von text,                         -- person_id des Admins (oder 'auto' beim automatischen Nachreichen)
  rows jsonb not null check (jsonb_typeof(rows) = 'array'),
  uebersprungen jsonb not null default '[]'::jsonb check (jsonb_typeof(uebersprungen) = 'array'), -- nicht übergebene Zeilen mit Grund (Person nicht eindeutig, Tag nicht veröffentlicht, ausgenommen) – DP2 löscht dazu nichts von selbst
  anzahl integer not null default 0 check (anzahl >= 0),
  pruefsumme text not null,                  -- SHA-256 über die geordneten Zeilen – gleicher Stand → gleiche Prüfsumme
  status text not null default 'offen' check (status in ('offen', 'uebernommen', 'verworfen')),
  uebernommen_am timestamptz,
  uebernommen_von uuid,
  ergebnis jsonb,                            -- Rückmeldung von DP2 (neu/geändert/entfällt/übersprungen)
  created_at timestamptz not null default now()
);
create index if not exists kc_dp_soll_uebergabe_offen on public.kc_dp_soll_uebergabe (org_id, event_id, created_at desc) where status = 'offen';
create index if not exists kc_dp_soll_uebergabe_neu on public.kc_dp_soll_uebergabe (org_id, event_id, created_at desc);
alter table public.kc_dp_soll_uebergabe enable row level security;
revoke all on public.kc_dp_soll_uebergabe from public, anon, authenticated;
grant select, insert, update, delete on public.kc_dp_soll_uebergabe to service_role;
comment on table public.kc_dp_soll_uebergabe is 'KC-DP-SOLL-UEBERGABE: Club-App übergibt den berechneten Sollplan als vollständigen Stand an DP2 (nur service_role; DP2 über kc_dp_soll_uebergabe_pending/_ack).';
insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_dp_soll_uebergabe', 'KC DP', 'sensitive', false, true, true, 'KC-DP-SOLL-UEBERGABE: Sollplan-Übergabe Club-App → DP2 (vollständiger Stand je Übergabe)')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_dp_soll_uebergabe') on conflict (table_name) do nothing;

-- DP2 holt die neueste offene Übergabe ab (nur Planungsrolle). Leeres Objekt = nichts offen.
create or replace function public.kc_dp_soll_uebergabe_pending(p_org_id text, p_event_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
begin
  if (select auth.uid()) is null then raise exception 'Anmeldung erforderlich'; end if;
  if not exists (select 1 from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = p_org_id and m.active is true
                 and m.role in ('admin', 'planner', 'duty_manager')) then
    raise exception 'Keine aktive dp2-Planungsberechtigung';
  end if;
  return coalesce((select jsonb_build_object('id', u.id, 'eventId', u.event_id, 'stand', u.stand, 'anzahl', u.anzahl, 'pruefsumme', u.pruefsumme,
      'rows', u.rows, 'uebersprungen', u.uebersprungen, 'createdAt', u.created_at, 'contract', 'KC_DP_SOLL_UEBERGABE_V1')
    from public.kc_dp_soll_uebergabe u where u.org_id = p_org_id and u.event_id = trim(p_event_id) and u.status = 'offen'
    order by u.created_at desc limit 1), '{}'::jsonb);
end;
$function$;
revoke all on function public.kc_dp_soll_uebergabe_pending(text, text) from public, anon;
grant execute on function public.kc_dp_soll_uebergabe_pending(text, text) to authenticated;

-- DP2 bestätigt: nur eine noch offene Übergabe (sonst stale – z. B. inzwischen durch einen neueren Stand verworfen).
create or replace function public.kc_dp_soll_uebergabe_ack(p_id uuid, p_status text, p_ergebnis jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
declare v_org text; v_n integer;
begin
  if (select auth.uid()) is null then raise exception 'Anmeldung erforderlich'; end if;
  select org_id into v_org from public.kc_dp_soll_uebergabe where id = p_id;
  if v_org is null then raise exception 'Übergabe nicht gefunden'; end if;
  if not exists (select 1 from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = v_org and m.active is true
                 and m.role in ('admin', 'planner', 'duty_manager')) then
    raise exception 'Keine aktive dp2-Planungsberechtigung';
  end if;
  if p_status not in ('uebernommen', 'verworfen') then raise exception 'Status muss uebernommen oder verworfen sein'; end if;
  if p_ergebnis is not null and length(p_ergebnis::text) > 20000 then raise exception 'Ergebnis zu groß'; end if;
  update public.kc_dp_soll_uebergabe set status = p_status, uebernommen_am = now(), uebernommen_von = (select auth.uid()),
         ergebnis = coalesce(p_ergebnis, '{}'::jsonb)
   where id = p_id and status = 'offen';
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', v_n = 1, 'stale', v_n = 0, 'id', p_id, 'status', p_status);
end;
$function$;
revoke all on function public.kc_dp_soll_uebergabe_ack(uuid, text, jsonb) from public, anon;
grant execute on function public.kc_dp_soll_uebergabe_ack(uuid, text, jsonb) to authenticated;

-- KC-SECURITY-DEFINER-REGISTER: DP2 ruft beide Funktionen direkt auf (authenticated) → Prüfregister (wiederholbar).
insert into public.kc_security_reviewed_exceptions (object_schema, object_name, object_type, finding_code, decision, reason, reviewed_at, review_after, active)
select 'public', v.name, 'function', 'security_definer_authenticated_execute', 'accepted_required', 'KC-DP-SOLL-UEBERGABE 23.11.2026: ' || v.grund, now(), now() + interval '6 months', true
  from (values
    ('kc_dp_soll_uebergabe_pending', 'prüft auth.uid() und kc_dp_memberships admin/planner/duty_manager der Organisation p_org_id; liest nur die neueste offene Übergabe. Kein anon.'),
    ('kc_dp_soll_uebergabe_ack', 'prüft auth.uid() und kc_dp_memberships admin/planner/duty_manager der Organisation der Übergabe; Status nur uebernommen/verworfen, nur offene Zeilen. Kein anon.')
  ) as v(name, grund)
 where not exists (select 1 from public.kc_security_reviewed_exceptions r
                    where r.object_schema = 'public' and r.object_name = v.name and r.finding_code = 'security_definer_authenticated_execute' and r.active);
