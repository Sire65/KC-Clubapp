-- KC-CLUB-ANMELDUNG-SPARSAM (2.389.0, Auftrag Hansi „alle Sachen, die zu viele Datenbank-Abfragen machen und die DB überlasten, raus“):
-- Messung 14.10.2026: kc_club_anmeldung war mit Abstand der größte Posten (rund ein Drittel der gesamten Datenbank-Zeit; zuletzt im
-- Mittel 600 ms statt 36 ms). Grund: JEDER Aufruf schrieb „zuletzt gesehen“ – mehrere gleichzeitige Anfragen derselben Person warteten
-- aufeinander (Zeilensperre) und jede Schreibung erzeugt Last für Spiegel/Realtime.
-- Jetzt: nur lesen; geschrieben wird höchstens alle 30 s (oder beim ersten Mal / bei neuer App-Version). Die Online-Anzeige rechnet
-- mit 150 s – sie bleibt genau. „vorher“ (für den Online-Push nach 10 Min. Pause) wird wie bisher VOR dem Schreiben gelesen.
-- Rückweg: Fassung aus 20261002_kc_club_v1510_erstmals.sql erneut einspielen.
create or replace function public.kc_club_anmeldung(p_hash text, p_version text default null)
returns jsonb language plpgsql security definer set search_path to 'public', 'pg_catalog' as $function$
declare v_pid text; v_vorher timestamptz; v_zul timestamptz; v_erst timestamptz; v_ver text;
begin
  if p_hash !~ '^[0-9a-f]{64}$' then return null; end if;
  select z1.person_id, z1.zuletzt_gesehen, z1.erstmals_gesehen, z1.app_version into v_pid, v_zul, v_erst, v_ver
    from public.kc_club_zugang z1 where z1.token_hash = p_hash and z1.aktiv limit 1;
  if v_pid is null then return null; end if;
  select max(z2.zuletzt_gesehen) into v_vorher from public.kc_club_zugang z2 where z2.person_id = v_pid;
  if v_zul is null or v_zul < now() - interval '30 seconds' or v_erst is null
     or (p_version is not null and left(p_version, 20) is distinct from v_ver) then
    update public.kc_club_zugang set zuletzt_gesehen = now(), erstmals_gesehen = coalesce(erstmals_gesehen, now()),
           app_version = coalesce(left(p_version, 20), app_version)
     where token_hash = p_hash and aktiv;
  end if;
  return (select jsonb_build_object(
    'person', (select to_jsonb(x) from (select person_id, display_name, given_name, preferred_name, active from public.kc_core_people where person_id = v_pid) x),
    'rollen', (select to_jsonb(r) from public.kc_club_rollen r where r.person_id = v_pid),
    'vorher', v_vorher));
end;
$function$;
revoke all on function public.kc_club_anmeldung(text, text) from public, anon, authenticated;
grant execute on function public.kc_club_anmeldung(text, text) to service_role;
