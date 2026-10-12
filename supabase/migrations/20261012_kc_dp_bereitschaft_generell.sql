-- KC-DP-BEREITSCHAFT-GENERELL (12.10.2026, Wunsch Hansi; DP2 Build 268): Mitglieder beantworten am Anfang einmal
-- „Bist du generell bereit, auch Bereitschaftsdienste zu übernehmen?“. Die Club-App speichert die Antwort im Wunsch-Eingang,
-- DP2 holt sie mit kc_dp_wish_inbox_pending ab (neues Feld standbyGeneral – nur ergänzt, bestehende Felder unverändert).
-- null = nicht beantwortet (alter Stand) → DP2 ändert nichts.
-- Rückweg: kc_dp_wish_inbox_pending aus 20261001_kc_dp_wunsch_eingang_sperre.sql erneut einspielen; die Spalte kann bleiben.
alter table public.kc_dp_wish_inbox add column if not exists standby_general boolean;
comment on column public.kc_dp_wish_inbox.standby_general is 'KC-DP-BEREITSCHAFT-GENERELL: true = generell bereit für Bereitschaft (Tagesfrage), false = nein (keine Tagesfrage), null = nicht beantwortet.';

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
      'standbyGeneral', i.standby_general,
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
