-- KC-DP-SOLL-BEREITSCHAFT (Hansi 24.11.2026: „Bereitschaft soll auch im Dienstplan stehen“).
-- Die Sollplan-Übergabe Club-App → DP2 (KC-DP-SOLL-UEBERGABE, 20261123_kc_dp_soll_uebergabe.sql) trägt zusätzlich die Bereitschaft als eigene Liste
-- (je Person und Tag: importKey 'CLUB-B-<datum>-<personId>', personId, date, start, end). DP2 legt sie als Bereitschaft an (nicht als Dienst, nicht auf die Kasse).
-- Nur additiv: neue Spalte mit leerer Liste als Vorgabe; kc_dp_soll_uebergabe_pending gibt sie zusätzlich als „bereitschaft“ zurück
-- (ältere DP2-Stände lesen das Feld nicht und arbeiten unverändert). Rechte und Prüfungen der Funktion bleiben gleich.
-- Rückweg: create or replace der Funktion aus 20261123_kc_dp_soll_uebergabe.sql; alter table public.kc_dp_soll_uebergabe drop column bereitschaft;
alter table public.kc_dp_soll_uebergabe add column if not exists bereitschaft jsonb not null default '[]'::jsonb;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'kc_dp_soll_uebergabe_bereitschaft_array') then
    alter table public.kc_dp_soll_uebergabe add constraint kc_dp_soll_uebergabe_bereitschaft_array check (jsonb_typeof(bereitschaft) = 'array');
  end if;
end $$;

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
      'rows', u.rows, 'bereitschaft', u.bereitschaft, 'uebersprungen', u.uebersprungen, 'createdAt', u.created_at, 'contract', 'KC_DP_SOLL_UEBERGABE_V1')
    from public.kc_dp_soll_uebergabe u where u.org_id = p_org_id and u.event_id = trim(p_event_id) and u.status = 'offen'
    order by u.created_at desc limit 1), '{}'::jsonb);
end;
$function$;
revoke all on function public.kc_dp_soll_uebergabe_pending(text, text) from public, anon;
grant execute on function public.kc_dp_soll_uebergabe_pending(text, text) to authenticated;

-- KC-SECURITY-DEFINER-REGISTER: unverändert direkt von DP2 aufgerufen (authenticated) → Eintrag aus 20261123 bleibt; wiederholbar sicherstellen.
insert into public.kc_security_reviewed_exceptions (object_schema, object_name, object_type, finding_code, decision, reason, reviewed_at, review_after, active)
select 'public', 'kc_dp_soll_uebergabe_pending', 'function', 'security_definer_authenticated_execute', 'accepted_required',
       'KC-DP-SOLL-UEBERGABE 23.11.2026 / KC-DP-SOLL-BEREITSCHAFT 24.11.2026: prüft auth.uid() und kc_dp_memberships admin/planner/duty_manager der Organisation p_org_id; liest nur die neueste offene Übergabe. Kein anon.',
       now(), now() + interval '6 months', true
 where not exists (select 1 from public.kc_security_reviewed_exceptions r
                    where r.object_schema = 'public' and r.object_name = 'kc_dp_soll_uebergabe_pending' and r.finding_code = 'security_definer_authenticated_execute' and r.active);
