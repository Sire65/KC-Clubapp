-- KC-DP-WUNSCH-FREIGABE (30.09.2026, Freigabe Hansi „A mit Sondererlaubnis“, Plan genehmigt; Übergabe aus DP2 Build 250 RC / Codex):
-- 1. kc_dp_wish_inbox_ack übernimmt bei erfolgreicher, revisionsgleicher Übernahme ("uebernommen") die Kollegenfreigabe
--    des Mitglieds aus dem Eingang – im selben Datenbankvorgang wie die Quittierung. Maßgeblich ist ausschließlich
--    inbox.org_id + inbox.person_id (nie eine übergebene Personen-ID) und nur, wenn share_with_colleagues nicht null ist.
--    Nein → allow_view und allow_copy aus; Ja → allow_view an, eine vorhandene Kopier-Erlaubnis bleibt unverändert.
--    Direkte Schreibrechte auf kc_dp_plan_sharing (RLS: nur das Mitglied selbst) bleiben unverändert.
-- 2. kc_dp_wish_inbox_receipt: nur lesender Übernahmebeleg für verlorene ACK-Antworten. Nur Planungsrollen.
-- Rückweg: ack-Fassung aus 20260929_kc_dp_wunsch_eingang_v1.sql erneut einspielen, Beleg-Funktion droppen.
create or replace function public.kc_dp_wish_inbox_ack(p_id uuid, p_revision integer, p_status text, p_result jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
declare v_org text; v_person text; v_share boolean; v_n integer; v_freigabe boolean := false;
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
   where id = p_id and revision = p_revision and status = 'offen'
   returning org_id, person_id, share_with_colleagues into v_org, v_person, v_share;
  get diagnostics v_n = row_count;
  if v_n = 1 and p_status = 'uebernommen' and v_share is not null then
    insert into public.kc_dp_plan_sharing (org_id, person_id, plan_kind, allow_view, allow_copy)
    select v_org, v_person, k, v_share, false from unnest(array['can', 'wish', 'standby']) as k
    on conflict (org_id, person_id, plan_kind) do update
      set allow_view = excluded.allow_view,
          allow_copy = case when excluded.allow_view then public.kc_dp_plan_sharing.allow_copy else false end;
    v_freigabe := true;
  end if;
  return jsonb_build_object('ok', v_n = 1, 'stale', v_n = 0, 'id', p_id, 'revision', p_revision, 'status', p_status,
                            'sharingApplied', v_freigabe, 'shareWithColleagues', case when v_freigabe then v_share end);
end;
$function$;
revoke all on function public.kc_dp_wish_inbox_ack(uuid, integer, text, jsonb) from public, anon;
grant execute on function public.kc_dp_wish_inbox_ack(uuid, integer, text, jsonb) to authenticated;

create or replace function public.kc_dp_wish_inbox_receipt(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
declare v public.kc_dp_wish_inbox%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'Anmeldung erforderlich'; end if;
  select * into v from public.kc_dp_wish_inbox where id = p_id;
  if v.id is null then return jsonb_build_object('found', false, 'id', p_id); end if;
  if not exists (select 1 from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = v.org_id and m.active is true
                 and m.role in ('admin', 'planner', 'duty_manager')) then
    raise exception 'Keine aktive dp2-Planungsberechtigung';
  end if;
  return jsonb_build_object('found', true, 'id', v.id, 'status', v.status, 'revision', v.revision, 'takenRevision', v.taken_revision,
                            'takenAt', v.taken_at, 'takenByMe', v.taken_by is not null and v.taken_by = (select auth.uid()));
end;
$function$;
revoke all on function public.kc_dp_wish_inbox_receipt(uuid) from public, anon;
grant execute on function public.kc_dp_wish_inbox_receipt(uuid) to authenticated;
comment on function public.kc_dp_wish_inbox_receipt(uuid) is 'KC-DP-WUNSCH-FREIGABE: lesender Übernahmebeleg (status, revision, takenRevision, takenByMe) für verlorene ACK-Antworten. Nur Planungsrollen.';
