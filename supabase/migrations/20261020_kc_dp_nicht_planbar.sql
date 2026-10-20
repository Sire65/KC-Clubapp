-- 2.508.0 KC-DP-NICHT-PLANBAR (Wunsch Hansi: DP2 soll dieselbe Liste „Nicht für den Dienstplan“ lesen wie die Club-App, statt Personen fest
-- im Programm zu führen – heute K.nonPlanningPersonIds in DP2). Nur lesend; nur für aktive DP2-Planungsrollen (admin/planner/duty_manager)
-- der angefragten Organisation; liefert nur Personen dieser Organisation. Quelle: kc_club_dienst_ausnahmen (Club-App-Registry).
-- Rückweg: drop function public.kc_dp_nicht_planbar(text);
create or replace function public.kc_dp_nicht_planbar(p_org text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'pg_catalog', 'public', 'pg_temp'
as $function$
begin
  if (select auth.uid()) is null then raise exception 'Anmeldung erforderlich'; end if;
  if not exists (select 1 from public.kc_dp_memberships m where m.user_id = (select auth.uid()) and m.org_id = p_org and m.active is true
                 and m.role in ('admin', 'planner', 'duty_manager')) then
    raise exception 'Keine aktive dp2-Planungsberechtigung';
  end if;
  return jsonb_build_object(
    'vertrag', 'KC_DP_NICHT_PLANBAR_V1',
    'personIds', coalesce((select jsonb_agg(a.person_id order by a.person_id)
                             from public.kc_club_dienst_ausnahmen a
                             join public.kc_core_people p on p.person_id = a.person_id and p.org_id = p_org), '[]'::jsonb),
    'stand', now());
end;
$function$;
revoke all on function public.kc_dp_nicht_planbar(text) from public, anon;
grant execute on function public.kc_dp_nicht_planbar(text) to authenticated;
