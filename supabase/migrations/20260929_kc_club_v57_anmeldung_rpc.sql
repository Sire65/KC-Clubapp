-- Club-App 0.56.1 – KC-CLUB-ANMELDECACHE, Teil 2: Anmeldung in EINER Datenbank-Runde
-- Messung aus der EU (pg_net → Edge Function): Anmeldung ~90–120 ms je Anfrage, weil Zugang und danach Person+Rollen in zwei
-- Runden gelesen wurden und der Speicher der Edge-Instanzen selten trifft. Diese Funktion prüft den Token-Hash, setzt
-- „zuletzt gesehen“/App-Version und liefert Person und Rollen in einem Aufruf. Nur service_role (Edge Function).
create or replace function public.kc_club_anmeldung(p_hash text, p_version text default null)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public', 'pg_catalog'
as $$
declare v_pid text;
begin
  if p_hash !~ '^[0-9a-f]{64}$' then return null; end if;
  update public.kc_club_zugang set zuletzt_gesehen = now(), app_version = coalesce(left(p_version, 20), app_version)
   where token_hash = p_hash and aktiv
   returning person_id into v_pid;
  if v_pid is null then return null; end if;
  return (select jsonb_build_object(
    'person', (select to_jsonb(x) from (select person_id, display_name, given_name, preferred_name, active from public.kc_core_people where person_id = v_pid) x),
    'rollen', (select to_jsonb(r) from public.kc_club_rollen r where r.person_id = v_pid)));
end;
$$;
revoke all on function public.kc_club_anmeldung(text, text) from public, anon, authenticated;
grant execute on function public.kc_club_anmeldung(text, text) to service_role;
