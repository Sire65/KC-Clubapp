-- KICC-F-112 / KC-CLUB-ERSTATTUNG-STUNDEN (Wunsch Hansi 24.11.2026): Zeit mit der Erstattung einreichen.
-- Konzept: KC-Infrastructure-Control-Center docs/KONZEPT-CLUB-ERSTATTUNG-STUNDEN.md (Entscheidungen: sofort gutschreiben, immer, „Besorgungen & Fahrten“).
-- 1. kc_dp_hour_reports: neue Quelle 'erstattung' (Club-App legt die Zeile beim Einreichen gleich als 'bestaetigt' an – keine Freigabe in DP2),
--    Verknüpfung erstattung_id zum Antrag (kc_club_erstattung). Lehnt der Kassenwart den Antrag ab, setzt der Club-Server die Zeile auf 'zurueckgezogen'.
-- 2. kc_dp_special_events: wiederkehrend 'laufend' = ständiger Einsatz der Veranstaltung (jeder vergangene Tag), z. B. „Besorgungen & Fahrten“.
-- 3. DP2 bucht automatisch: kc_dp_hour_reports_auto (was zu buchen/auszubuchen ist), kc_dp_hour_report_auto_ack (gebucht/ausgebucht),
--    kc_dp_hour_report_storno (Planer nimmt eine automatisch gebuchte Meldung mit Grund zurück → Mitglied wird von der Club-App informiert).
-- Rein additiv. Rückweg:
--   drop function public.kc_dp_hour_report_storno(uuid, text); drop function public.kc_dp_hour_report_auto_ack(uuid, text);
--   drop function public.kc_dp_hour_reports_auto(text, text); alter table public.kc_dp_hour_reports drop column erstattung_id;
--   Check-Regeln wieder auf ('club_app','dp2') bzw. ('markttage') setzen (vorher Zeilen mit 'erstattung'/'laufend' entfernen).

-- 1. Quelle 'erstattung' + Verknüpfung
do $$
declare c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.kc_dp_hour_reports'::regclass and contype = 'c' and pg_get_constraintdef(oid) ~ '\msource\M' loop
    execute format('alter table public.kc_dp_hour_reports drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.kc_dp_hour_reports add constraint kc_dp_hour_reports_source_check check (source in ('club_app', 'dp2', 'erstattung'));
alter table public.kc_dp_hour_reports add column if not exists erstattung_id uuid;
create index if not exists kc_dp_hour_reports_erstattung on public.kc_dp_hour_reports (erstattung_id) where erstattung_id is not null;
create index if not exists kc_dp_hour_reports_auto on public.kc_dp_hour_reports (org_id, event_id) where source = 'erstattung';

-- 2. ständiger Einsatz
do $$
declare c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.kc_dp_special_events'::regclass and contype = 'c' and pg_get_constraintdef(oid) ~ '\mwiederkehrend\M' loop
    execute format('alter table public.kc_dp_special_events drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.kc_dp_special_events add constraint kc_dp_special_events_wiederkehrend_check check (wiederkehrend is null or wiederkehrend in ('markttage', 'laufend'));

-- 3a. DP2 holt ab, was automatisch zu buchen (bestätigt, noch ohne Ist) oder auszubuchen ist (zurückgezogen/abgelehnt, Ist noch vorhanden).
create or replace function public.kc_dp_hour_reports_auto(p_org_id text, p_event_id text)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
begin
  if (select auth.uid()) is null then raise exception 'Anmeldung erforderlich'; end if;
  if not exists (select 1 from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = p_org_id and m.active is true
                 and m.role in ('admin','planner','duty_manager')) then
    raise exception 'Keine aktive dp2-Planungsberechtigung';
  end if;
  return coalesce((select jsonb_agg(jsonb_build_object(
      'id', r.id, 'sammel_id', r.sammel_id, 'event_id', r.event_id, 'special_event_id', r.special_event_id,
      'special_event_title', r.special_event_title, 'person_id', r.person_id, 'gemeldet_von', r.gemeldet_von,
      'work_date', r.work_date, 'start_h', r.start_h, 'end_h', r.end_h, 'break_minutes', r.break_minutes,
      'taetigkeit', r.taetigkeit, 'fahrt_rolle', r.fahrt_rolle, 'bemerkung', r.bemerkung, 'status', r.status, 'verspaetet', r.verspaetet,
      'source', r.source, 'erstattung_id', r.erstattung_id, 'actual_id', r.actual_id, 'ablehngrund', r.ablehngrund,
      'gemeldet_am', r.gemeldet_am, 'version', r.version) order by r.gemeldet_am)
    from public.kc_dp_hour_reports r
   where r.org_id = p_org_id and r.event_id = trim(p_event_id) and r.source = 'erstattung'
     and ((r.status = 'bestaetigt' and r.actual_id is null) or (r.status in ('zurueckgezogen', 'abgelehnt') and r.actual_id is not null))
  ), '[]'::jsonb);
end;
$function$;
revoke all on function public.kc_dp_hour_reports_auto(text, text) from public, anon;
grant execute on function public.kc_dp_hour_reports_auto(text, text) to authenticated;

-- 3b. DP2 meldet zurück: gebucht (p_actual_id gesetzt, nur bei 'bestaetigt' ohne Ist) oder ausgebucht (p_actual_id null, nur bei zurückgezogen/abgelehnt).
create or replace function public.kc_dp_hour_report_auto_ack(p_id uuid, p_actual_id text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
declare v_org text; v_n integer;
begin
  if (select auth.uid()) is null then raise exception 'Anmeldung erforderlich'; end if;
  select org_id into v_org from public.kc_dp_hour_reports where id = p_id and source = 'erstattung';
  if v_org is null then raise exception 'Meldung nicht gefunden'; end if;
  if not exists (select 1 from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = v_org and m.active is true
                 and m.role in ('admin','planner','duty_manager')) then
    raise exception 'Keine aktive dp2-Planungsberechtigung';
  end if;
  if coalesce(length(trim(p_actual_id)), 0) > 0 then
    update public.kc_dp_hour_reports set actual_id = left(trim(p_actual_id), 120), version = version + 1, updated_at = now()
     where id = p_id and status = 'bestaetigt' and actual_id is null;
  else
    update public.kc_dp_hour_reports set actual_id = null, version = version + 1, updated_at = now()
     where id = p_id and status in ('zurueckgezogen', 'abgelehnt') and actual_id is not null;
  end if;
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', v_n = 1, 'stale', v_n = 0, 'id', p_id);
end;
$function$;
revoke all on function public.kc_dp_hour_report_auto_ack(uuid, text) from public, anon;
grant execute on function public.kc_dp_hour_report_auto_ack(uuid, text) to authenticated;

-- 3c. Planer nimmt eine automatisch gebuchte Meldung zurück (Grund Pflicht). benachrichtigt_am = null → Club-App informiert das Mitglied.
-- actual_id wird gleich mit geleert: DP2 löscht die Ist-Zeit im selben Schritt (erst Quelle, dann lokal – kein Mischstand).
create or replace function public.kc_dp_hour_report_storno(p_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
declare v_org text; v_n integer; v_version integer;
begin
  if (select auth.uid()) is null then raise exception 'Anmeldung erforderlich'; end if;
  select org_id into v_org from public.kc_dp_hour_reports where id = p_id and source = 'erstattung';
  if v_org is null then raise exception 'Meldung nicht gefunden'; end if;
  if not exists (select 1 from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = v_org and m.active is true
                 and m.role in ('admin','planner','duty_manager')) then
    raise exception 'Keine aktive dp2-Planungsberechtigung';
  end if;
  if coalesce(length(trim(p_reason)), 0) = 0 then raise exception 'Für eine Rücknahme ist ein Grund erforderlich'; end if;
  update public.kc_dp_hour_reports
     set status = 'abgelehnt', ablehngrund = left(trim(p_reason), 500), entschieden_von = (select auth.uid()), entschieden_am = now(),
         actual_id = null, benachrichtigt_am = null, version = version + 1, updated_at = now()
   where id = p_id and status = 'bestaetigt'
  returning version into v_version;
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', v_n = 1, 'stale', v_n = 0, 'id', p_id, 'version', v_version);
end;
$function$;
revoke all on function public.kc_dp_hour_report_storno(uuid, text) from public, anon;
grant execute on function public.kc_dp_hour_report_storno(uuid, text) to authenticated;

-- KC-SECURITY-DEFINER-REGISTER: DP2 ruft die drei Funktionen direkt auf (angemeldet, Planungsrolle)
insert into public.kc_security_reviewed_exceptions (object_schema, object_name, object_type, finding_code, decision, reason, reviewed_at, review_after, active)
select 'public', v.name, 'function', 'security_definer_authenticated_execute', 'accepted_required', 'KICC-F-112 24.11.2026: ' || v.grund, now(), now() + interval '6 months', true
  from (values
    ('kc_dp_hour_reports_auto', 'verlangt auth.uid() und aktive DP-Rolle admin/planner/duty_manager für p_org_id; liefert nur Meldungen mit Quelle erstattung. Kein anon.'),
    ('kc_dp_hour_report_auto_ack', 'verlangt auth.uid() und aktive DP-Planungsrolle der Organisation der Meldung; setzt nur actual_id bei Quelle erstattung (gebucht/ausgebucht). Kein anon.'),
    ('kc_dp_hour_report_storno', 'verlangt auth.uid() und aktive DP-Planungsrolle der Organisation der Meldung; nur bestätigte Meldungen mit Quelle erstattung, Grund Pflicht. Kein anon.')
  ) as v(name, grund)
 where not exists (select 1 from public.kc_security_reviewed_exceptions r
                    where r.object_schema = 'public' and r.object_name = v.name and r.finding_code = 'security_definer_authenticated_execute' and r.active);

comment on column public.kc_dp_hour_reports.erstattung_id is 'KICC-F-112: Erstattungsantrag (kc_club_erstattung), mit dem die Zeit eingereicht wurde (Quelle erstattung, sofort bestätigt).';
