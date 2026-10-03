-- KC Club-App – Version 1.57.0 (Wunsch Hansi 03.10.2026)
-- KC-CLUB-ONLINE-PUSH  Admin bekommt auch bei geschlossener App eine Push „🟢 Klaus ist jetzt online“, wenn ein Mitglied nach
--   mindestens 10 Min. Pause wieder in die App kommt. Dafür liefert kc_club_anmeldung zusätzlich „vorher“ = wann die Person
--   (über alle ihre Zugänge) davor zuletzt da war. Bestehende Felder bleiben (rückwärtsverträglich).
--   Neue Communicator-Regel club_online: nur Push (keine Mail), Ruhezeit regelt der Club-Server selbst.
-- Rückweg: kc_club_anmeldung aus 20261002_kc_club_v1510_erstmals.sql einspielen; Regel club_online löschen.
create or replace function public.kc_club_anmeldung(p_hash text, p_version text default null)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'pg_catalog'
as $function$
declare v_pid text; v_vorher timestamptz;
begin
  if p_hash !~ '^[0-9a-f]{64}$' then return null; end if;
  select max(z2.zuletzt_gesehen) into v_vorher
    from public.kc_club_zugang z1 join public.kc_club_zugang z2 on z2.person_id = z1.person_id
   where z1.token_hash = p_hash and z1.aktiv;
  update public.kc_club_zugang set zuletzt_gesehen = now(), erstmals_gesehen = coalesce(erstmals_gesehen, now()),
         app_version = coalesce(left(p_version, 20), app_version)
   where token_hash = p_hash and aktiv
   returning person_id into v_pid;
  if v_pid is null then return null; end if;
  return (select jsonb_build_object(
    'person', (select to_jsonb(x) from (select person_id, display_name, given_name, preferred_name, active from public.kc_core_people where person_id = v_pid) x),
    'rollen', (select to_jsonb(r) from public.kc_club_rollen r where r.person_id = v_pid),
    'vorher', v_vorher));
end;
$function$;

insert into kc_communication_event_rules (source_program, event_key, display_name, channels, channel_mode, template_id, quiet_hours_mode, recipient_rule)
select 'kc-club', 'club_online', 'Club-App – Mitglied ist online (nur Push, Admin)', array['push'], 'fallback', 'kc_club_v1', 'ignore', '{"type":"event"}'::jsonb
where not exists (select 1 from kc_communication_event_rules r where r.source_program = 'kc-club' and r.event_key = 'club_online');
