-- KC-DP-WUNSCH-SPERRE (01.10.2026, Freigabe Hansi „Claude macht die DB, Codex das Programm“; Vorbereitung DP2 Build 255):
-- Absicherung gegen zwei gleichzeitig importierende DP2-PCs. Bisher verhinderte kc_dp_wish_inbox_ack nur die doppelte
-- QUITTIERUNG (revision + status = 'offen'); beide PCs konnten den Eingang aber vorher schon lokal eintragen.
-- Neu: zeitlich begrenzte Reservierung je Eingang, BEVOR DP2 lokal einträgt.
--   1. Spalten claim_token/claimed_by/claimed_device/claimed_revision/claimed_until (nur additiv, Neon-Spiegel ergänzt sie
--      automatisch, KC-SPIEGEL-AUTO).
--   2. kc_dp_wish_inbox_claim(p_id, p_revision, p_device_id, p_minutes)   – reservieren / verlängern (1–30 Min., Standard 10)
--   3. kc_dp_wish_inbox_release(p_id, p_claim_token)                     – Reservierung freigeben (Abbruch/Rollback)
--   4. kc_dp_wish_inbox_ack_claimed(p_id, p_revision, p_status, p_result, p_claim_token)
--                                                                         – quittieren NUR mit eigener Reservierung
--   5. kc_dp_wish_inbox_ack (Build ≤ 254): Verhalten unverändert, AUSSER bei einer aktiven fremden Reservierung –
--      dann {ok:false, stale:false, claimed:true} statt Quittierung. Erfolgreiche Quittierung löscht die Reservierung.
--   6. kc_dp_wish_inbox_pending / _receipt: zusätzliche Felder claimActive, claimedUntil, claimedByMe (nur ergänzt);
--      _receipt zusätzlich takenClaim = Reservierung, mit der quittiert wurde (DP2 erkennt so nach Abbruch/Neustart
--      eindeutig, ob SEINE Quittierung durchging – auch wenn zwei PCs mit demselben Konto arbeiten).
-- Eine Reservierung gilt nur für die reservierte Revision: speichert das Mitglied in der Club-App neu (revision + 1),
-- ist sie automatisch wirkungslos. Abgelaufene Reservierungen darf jeder Planer-PC neu übernehmen.
-- Kollegenfreigabe: unverändert wie KC-DP-WUNSCH-FREIGABE (Kopieren wird nie erweitert), jetzt in einer internen
-- Hilfsfunktion, die beide Quittierungen nutzen.
-- Rückweg: kc_dp_wish_inbox_ack/_pending/_receipt aus 20260930_kc_dp_wunsch_eingang_freigabe.sql bzw.
-- 20260929_kc_dp_wunsch_eingang_v1.sql erneut einspielen, die neuen Funktionen droppen; Spalten können bleiben.

alter table public.kc_dp_wish_inbox
  add column if not exists claim_token uuid,
  add column if not exists claimed_by uuid,
  add column if not exists claimed_device text,
  add column if not exists claimed_revision integer,
  add column if not exists claimed_until timestamptz,
  add column if not exists taken_claim uuid;
comment on column public.kc_dp_wish_inbox.claim_token is 'KC-DP-WUNSCH-SPERRE: Reservierung eines DP2-PCs (nur gültig für claimed_revision = revision und claimed_until > now()).';

-- Interne Hilfsfunktion: Kollegenfreigabe aus dem Eingang (Logik unverändert aus KC-DP-WUNSCH-FREIGABE)
create or replace function public.kc_dp_wish_inbox_sharing_apply(p_org text, p_person text, p_share boolean)
returns void
language sql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
  insert into public.kc_dp_plan_sharing (org_id, person_id, plan_kind, allow_view, allow_copy)
  select p_org, p_person, k, p_share, false from unnest(array['can', 'wish', 'standby']) as k
  on conflict (org_id, person_id, plan_kind) do update
    set allow_view = excluded.allow_view,
        allow_copy = case when excluded.allow_view then public.kc_dp_plan_sharing.allow_copy else false end;
$function$;
revoke all on function public.kc_dp_wish_inbox_sharing_apply(text, text, boolean) from public, anon, authenticated;

-- 2) Reservieren / verlängern
create or replace function public.kc_dp_wish_inbox_claim(p_id uuid, p_revision integer, p_device_id text, p_minutes integer default 10)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
declare
  v public.kc_dp_wish_inbox%rowtype; v_uid uuid := (select auth.uid());
  v_dev text := left(nullif(trim(p_device_id), ''), 128); v_min integer := greatest(1, least(30, coalesce(p_minutes, 10)));
  v_aktiv boolean; v_meine boolean; v_token uuid; v_bis timestamptz;
begin
  if v_uid is null then raise exception 'Anmeldung erforderlich'; end if;
  if v_dev is null then raise exception 'Geräte-Kennung fehlt'; end if;
  select * into v from public.kc_dp_wish_inbox where id = p_id for update;
  if v.id is null then raise exception 'Eingang nicht gefunden'; end if;
  if not exists (select 1 from public.kc_dp_memberships m where m.user_id = v_uid and m.org_id = v.org_id and m.active is true
                 and m.role in ('admin', 'planner', 'duty_manager')) then
    raise exception 'Keine aktive dp2-Planungsberechtigung';
  end if;
  if v.status <> 'offen' then
    return jsonb_build_object('ok', false, 'reason', 'not_open', 'stale', true, 'id', p_id, 'status', v.status, 'revision', v.revision);
  end if;
  if v.revision <> p_revision then
    return jsonb_build_object('ok', false, 'reason', 'stale', 'stale', true, 'id', p_id, 'status', v.status, 'revision', v.revision);
  end if;
  v_aktiv := v.claim_token is not null and v.claimed_until > now() and v.claimed_revision = v.revision;
  v_meine := v.claimed_by = v_uid and v.claimed_device = v_dev;
  if v_aktiv and not v_meine then
    return jsonb_build_object('ok', false, 'reason', 'claimed', 'stale', false, 'id', p_id, 'revision', v.revision,
                              'claimedUntil', v.claimed_until, 'claimedByMe', v.claimed_by = v_uid);
  end if;
  v_token := case when v_aktiv then v.claim_token else gen_random_uuid() end;
  v_bis := now() + make_interval(mins => v_min);
  update public.kc_dp_wish_inbox set claim_token = v_token, claimed_by = v_uid, claimed_device = v_dev,
         claimed_revision = p_revision, claimed_until = v_bis
   where id = p_id;
  return jsonb_build_object('ok', true, 'id', p_id, 'revision', p_revision, 'claimToken', v_token, 'claimedUntil', v_bis, 'renewed', v_aktiv);
end;
$function$;
revoke all on function public.kc_dp_wish_inbox_claim(uuid, integer, text, integer) from public, anon;
grant execute on function public.kc_dp_wish_inbox_claim(uuid, integer, text, integer) to authenticated;
comment on function public.kc_dp_wish_inbox_claim(uuid, integer, text, integer) is 'KC-DP-WUNSCH-SPERRE: Eingang für einen DP2-PC reservieren (vor dem lokalen Eintragen). Gleicher Benutzer + Gerät verlängert. Nur Planungsrollen.';

-- 3) Reservierung freigeben
create or replace function public.kc_dp_wish_inbox_release(p_id uuid, p_claim_token uuid)
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
  update public.kc_dp_wish_inbox set claim_token = null, claimed_by = null, claimed_device = null, claimed_revision = null, claimed_until = null
   where id = p_id and p_claim_token is not null and claim_token = p_claim_token;
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', true, 'id', p_id, 'released', v_n = 1);
end;
$function$;
revoke all on function public.kc_dp_wish_inbox_release(uuid, uuid) from public, anon;
grant execute on function public.kc_dp_wish_inbox_release(uuid, uuid) to authenticated;
comment on function public.kc_dp_wish_inbox_release(uuid, uuid) is 'KC-DP-WUNSCH-SPERRE: eigene Reservierung freigeben (nur mit passendem Token). Nur Planungsrollen.';

-- 4) Quittieren mit Reservierung (Build ≥ 255)
create or replace function public.kc_dp_wish_inbox_ack_claimed(p_id uuid, p_revision integer, p_status text, p_result jsonb, p_claim_token uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
declare v public.kc_dp_wish_inbox%rowtype; v_freigabe boolean := false;
begin
  if (select auth.uid()) is null then raise exception 'Anmeldung erforderlich'; end if;
  if p_claim_token is null then raise exception 'Reservierung fehlt'; end if;
  select * into v from public.kc_dp_wish_inbox where id = p_id for update;
  if v.id is null then raise exception 'Eingang nicht gefunden'; end if;
  if not exists (select 1 from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = v.org_id and m.active is true
                 and m.role in ('admin', 'planner', 'duty_manager')) then
    raise exception 'Keine aktive dp2-Planungsberechtigung';
  end if;
  if p_status not in ('uebernommen', 'abgelehnt') then raise exception 'Status muss uebernommen oder abgelehnt sein'; end if;
  if v.status <> 'offen' or v.revision <> p_revision then
    return jsonb_build_object('ok', false, 'stale', true, 'reason', case when v.status <> 'offen' then 'not_open' else 'stale' end,
                              'id', p_id, 'revision', p_revision, 'status', p_status);
  end if;
  -- Abgelaufen, aber von niemandem neu reserviert → gilt noch. Von einem anderen PC übernommen → verloren.
  if v.claim_token is distinct from p_claim_token or v.claimed_revision is distinct from p_revision then
    return jsonb_build_object('ok', false, 'stale', false, 'reason', 'claim_lost', 'id', p_id, 'revision', p_revision, 'status', p_status,
                              'claimedUntil', v.claimed_until);
  end if;
  update public.kc_dp_wish_inbox set status = p_status, taken_at = now(), taken_by = (select auth.uid()), taken_revision = p_revision,
         result = coalesce(p_result, '{}'::jsonb), updated_at = now(), taken_claim = p_claim_token,
         claim_token = null, claimed_by = null, claimed_device = null, claimed_revision = null, claimed_until = null
   where id = p_id;
  if p_status = 'uebernommen' and v.share_with_colleagues is not null then
    perform public.kc_dp_wish_inbox_sharing_apply(v.org_id, v.person_id, v.share_with_colleagues);
    v_freigabe := true;
  end if;
  return jsonb_build_object('ok', true, 'stale', false, 'id', p_id, 'revision', p_revision, 'status', p_status,
                            'sharingApplied', v_freigabe, 'shareWithColleagues', case when v_freigabe then v.share_with_colleagues end);
end;
$function$;
revoke all on function public.kc_dp_wish_inbox_ack_claimed(uuid, integer, text, jsonb, uuid) from public, anon;
grant execute on function public.kc_dp_wish_inbox_ack_claimed(uuid, integer, text, jsonb, uuid) to authenticated;
comment on function public.kc_dp_wish_inbox_ack_claimed(uuid, integer, text, jsonb, uuid) is 'KC-DP-WUNSCH-SPERRE: quittieren nur mit eigener Reservierung (reason: stale | not_open | claim_lost). Kollegenfreigabe wie kc_dp_wish_inbox_ack. Nur Planungsrollen.';

-- 5) Bisherige Quittierung (Build ≤ 254): respektiert aktive fremde Reservierungen, sonst unverändert
create or replace function public.kc_dp_wish_inbox_ack(p_id uuid, p_revision integer, p_status text, p_result jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
declare v_org text; v_person text; v_share boolean; v_n integer; v_freigabe boolean := false; v_bis timestamptz;
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
         result = coalesce(p_result, '{}'::jsonb), updated_at = now(), taken_claim = null,
         claim_token = null, claimed_by = null, claimed_device = null, claimed_revision = null, claimed_until = null
   where id = p_id and revision = p_revision and status = 'offen'
     and not (claim_token is not null and claimed_until > now() and claimed_revision = revision)
   returning org_id, person_id, share_with_colleagues into v_org, v_person, v_share;
  get diagnostics v_n = row_count;
  if v_n = 0 then
    select claimed_until into v_bis from public.kc_dp_wish_inbox
     where id = p_id and revision = p_revision and status = 'offen'
       and claim_token is not null and claimed_until > now() and claimed_revision = revision;
    if v_bis is not null then
      return jsonb_build_object('ok', false, 'stale', false, 'claimed', true, 'reason', 'claimed', 'id', p_id, 'revision', p_revision,
                                'status', p_status, 'claimedUntil', v_bis);
    end if;
  end if;
  if v_n = 1 and p_status = 'uebernommen' and v_share is not null then
    perform public.kc_dp_wish_inbox_sharing_apply(v_org, v_person, v_share);
    v_freigabe := true;
  end if;
  return jsonb_build_object('ok', v_n = 1, 'stale', v_n = 0, 'id', p_id, 'revision', p_revision, 'status', p_status,
                            'sharingApplied', v_freigabe, 'shareWithColleagues', case when v_freigabe then v_share end);
end;
$function$;
revoke all on function public.kc_dp_wish_inbox_ack(uuid, integer, text, jsonb) from public, anon;
grant execute on function public.kc_dp_wish_inbox_ack(uuid, integer, text, jsonb) to authenticated;

-- 6) Abholen + Beleg: Reservierungsstand ergänzt (bisherige Felder unverändert)
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
      'submittedAt', i.submitted_at,
      'claimActive', i.claim_token is not null and i.claimed_until > now() and i.claimed_revision = i.revision,
      'claimedUntil', case when i.claim_token is not null and i.claimed_until > now() and i.claimed_revision = i.revision then i.claimed_until end,
      'claimedByMe', i.claim_token is not null and i.claimed_until > now() and i.claimed_revision = i.revision and i.claimed_by = (select auth.uid()))
      order by i.submitted_at)
    from public.kc_dp_wish_inbox i where i.org_id = p_org_id and i.event_id = trim(p_event_id) and i.status = 'offen'), '[]'::jsonb);
end;
$function$;
revoke all on function public.kc_dp_wish_inbox_pending(text, text) from public, anon;
grant execute on function public.kc_dp_wish_inbox_pending(text, text) to authenticated;

create or replace function public.kc_dp_wish_inbox_receipt(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
declare v public.kc_dp_wish_inbox%rowtype; v_aktiv boolean;
begin
  if (select auth.uid()) is null then raise exception 'Anmeldung erforderlich'; end if;
  select * into v from public.kc_dp_wish_inbox where id = p_id;
  if v.id is null then return jsonb_build_object('found', false, 'id', p_id); end if;
  if not exists (select 1 from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = v.org_id and m.active is true
                 and m.role in ('admin', 'planner', 'duty_manager')) then
    raise exception 'Keine aktive dp2-Planungsberechtigung';
  end if;
  v_aktiv := v.claim_token is not null and v.claimed_until > now() and v.claimed_revision = v.revision;
  return jsonb_build_object('found', true, 'id', v.id, 'status', v.status, 'revision', v.revision, 'takenRevision', v.taken_revision,
                            'takenAt', v.taken_at, 'takenByMe', v.taken_by is not null and v.taken_by = (select auth.uid()),
                            'claimActive', v_aktiv, 'claimedUntil', case when v_aktiv then v.claimed_until end,
                            'claimedByMe', v_aktiv and v.claimed_by = (select auth.uid()), 'takenClaim', v.taken_claim);
end;
$function$;
revoke all on function public.kc_dp_wish_inbox_receipt(uuid) from public, anon;
grant execute on function public.kc_dp_wish_inbox_receipt(uuid) to authenticated;
comment on function public.kc_dp_wish_inbox_receipt(uuid) is 'KC-DP-WUNSCH-FREIGABE/-SPERRE: lesender Übernahmebeleg (status, revision, takenRevision, takenByMe, takenClaim, claimActive, claimedUntil, claimedByMe). Nur Planungsrollen.';
