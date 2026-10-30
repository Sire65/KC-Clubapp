-- KC-CLUB-RUNDER-TISCH-GRUPPE (Server/App 2.762.0, 30.10.2026, Wunsch Hansi „auch für Gruppen wie Leitung, Innovation usw. können Tische, Seminare und
-- Besprechungen anberaumt werden“). Spezifikation: docs/RUNDER_TISCH.md (Abschnitt 14). Nur additiv.
-- gruppe_id: feste Chat-Gruppe (kc_club_gruppen.thread_id). Dann sehen, sagen zu und nehmen Platz nur die Mitglieder dieser Gruppe (+ wer leitet).
-- Kein Fremdschlüssel: wird die Gruppe gelöscht, bleibt der Tisch geschlossen (niemand mehr außer Gastgeber/Admin sieht ihn) statt für alle offen.
-- Rückweg: alter table public.kc_club_tisch drop column gruppe_id; Funktion aus 20261030_kc_club_v2761_tisch_arten.sql neu einspielen.
alter table public.kc_club_tisch add column if not exists gruppe_id uuid;
create index if not exists kc_club_tisch_gruppe on public.kc_club_tisch (gruppe_id) where gruppe_id is not null;

create or replace function public.kc_club_tisch_beitreten(p_tisch uuid, p_person text, p_frisch_sek integer, p_vorlauf_min integer)
returns text
language plpgsql
set search_path = public
as $$
declare v_t public.kc_club_tisch%rowtype; v_z public.kc_club_tisch_teilnahme%rowtype; v_sitzen integer;
begin
  select * into v_t from public.kc_club_tisch where id = p_tisch for update;  -- Sperre: gleichzeitige Anfragen kommen nacheinander dran
  if not found then return 'fehlt'; end if;
  if v_t.status = 'abgesagt' then return 'abgesagt'; end if;
  if now() >= v_t.ende then return 'vorbei'; end if;
  if now() < v_t.beginn - make_interval(mins => p_vorlauf_min) then return 'zu_frueh'; end if;
  -- 2.762.0: Tisch einer Gruppe – nur Mitglieder dieser Gruppe (wer leitet, immer)
  if v_t.gruppe_id is not null and p_person <> v_t.gastgeber
     and not exists (select 1 from public.kc_communication_thread_participants where thread_id = v_t.gruppe_id and person_id = p_person) then return 'gruppe'; end if;
  select * into v_z from public.kc_club_tisch_teilnahme where tisch_id = p_tisch and person_id = p_person;
  -- 2.761.0: Seminar nur mit Anmeldung (der Referent/Gastgeber immer)
  if v_t.art = 'seminar' and p_person <> v_t.gastgeber and (not found or coalesce(v_z.zusage, '') <> 'ja') then return 'anmeldung'; end if;
  if found and v_z.dabei_seit is not null and v_z.verlassen_am is null and v_z.zuletzt_da > now() - make_interval(secs => p_frisch_sek) then
    update public.kc_club_tisch_teilnahme set zuletzt_da = now() where tisch_id = p_tisch and person_id = p_person;
    return 'da';
  end if;
  select count(*) into v_sitzen from public.kc_club_tisch_teilnahme
    where tisch_id = p_tisch and person_id <> p_person and dabei_seit is not null and verlassen_am is null and zuletzt_da > now() - make_interval(secs => p_frisch_sek);
  if v_sitzen >= v_t.plaetze then return 'voll'; end if;
  insert into public.kc_club_tisch_teilnahme (tisch_id, person_id, dabei_seit, zuletzt_da, verlassen_am)
    values (p_tisch, p_person, now(), now(), null)
    on conflict (tisch_id, person_id) do update set dabei_seit = coalesce(public.kc_club_tisch_teilnahme.dabei_seit, now()), zuletzt_da = now(), verlassen_am = null;
  if v_t.thread_id is not null and not exists (select 1 from public.kc_communication_thread_participants where thread_id = v_t.thread_id and person_id = p_person) then
    insert into public.kc_communication_thread_participants (thread_id, person_id) values (v_t.thread_id, p_person);
  end if;
  return 'ok';
end;
$$;
revoke all on function public.kc_club_tisch_beitreten(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.kc_club_tisch_beitreten(uuid, text, integer, integer) to service_role;
