-- KC-CLUB-RUNDER-TISCH (Server/App 2.760.0, Stufe RT1, 30.10.2026, Wunsch Hansi „Runder Tisch: jedes Mitglied lädt ein, jeder darf dazukommen,
-- höchstens 18, nicht zu lange speichern“). Spezifikation: docs/RUNDER_TISCH.md.
-- kc_club_tisch: ein Tisch (Thema, Beginn, Dauer, Plätze, Gastgeber, Tisch-Chat). Bleibt nach dem Aufräumen als Kurzprotokoll stehen
--   (Thema, Datum, Gastgeber, Anzahl) – der Tisch-Chat wird nach 30 Tagen gelöscht, Dateien darin nach 7 Tagen (Wartung im Club-Server).
-- kc_club_tisch_teilnahme: Zusage und „am Tisch“ (dabei_seit, zuletzt_da = Herzschlag der App alle 60 s, verlassen_am).
-- kc_club_tisch_beitreten: Platz nehmen bzw. Herzschlag – die Platzgrenze gilt unter Zeilensperre, der 19. bekommt nie einen Platz.
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated (KC-SUPABASE-GRANTS).
-- Rückweg: drop function public.kc_club_tisch_beitreten(uuid, text, integer, integer);
--          drop table public.kc_club_tisch_teilnahme; drop table public.kc_club_tisch;
--          delete from public.kc_db_mirror_table_rules where table_name in ('kc_club_tisch', 'kc_club_tisch_teilnahme');
--          delete from public.kc_neon_resume_tables where table_name in ('kc_club_tisch', 'kc_club_tisch_teilnahme');
create table if not exists public.kc_club_tisch (
  id uuid primary key default gen_random_uuid(),
  org_id text not null default 'KC_WERNE',
  thema text not null check (char_length(thema) between 1 and 80),
  beschreibung text check (char_length(coalesce(beschreibung, '')) <= 300),
  beginn timestamptz not null,
  dauer_min integer not null check (dauer_min in (30, 60, 90)),
  verlaengert_min integer not null default 0 check (verlaengert_min between 0 and 60),
  ende timestamptz not null,                  -- beginn + dauer + verlängert (bzw. früher geschlossen) – vom Club-Server gepflegt
  plaetze integer not null default 18 check (plaetze between 4 and 18),
  gastgeber text not null,
  thread_id uuid references public.kc_communication_threads(id) on delete set null,
  status text not null default 'geplant' check (status in ('geplant', 'abgesagt')),
  geschlossen_am timestamptz,
  erinnert_am timestamptz,
  medien_geloescht_am timestamptz,
  text_geloescht_am timestamptz,
  teilnehmer_anzahl integer,                  -- beim Aufräumen festgehalten (Kurzprotokoll)
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  check (ende > beginn)
);
create index if not exists kc_club_tisch_ende on public.kc_club_tisch (org_id, ende);
create index if not exists kc_club_tisch_gastgeber on public.kc_club_tisch (gastgeber, ende);
alter table public.kc_club_tisch enable row level security;
revoke all on public.kc_club_tisch from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_tisch to service_role;
comment on table public.kc_club_tisch is 'KC-CLUB-RUNDER-TISCH: Runder Tisch (Thema, Zeit, Plätze, Tisch-Chat) – nur Club-Server. Chat 30 Tage, Dateien 7 Tage nach Ende.';

create table if not exists public.kc_club_tisch_teilnahme (
  tisch_id uuid not null references public.kc_club_tisch(id) on delete cascade,
  person_id text not null,
  zusage text check (zusage in ('ja', 'nein')),
  zusage_am timestamptz,
  dabei_seit timestamptz,
  zuletzt_da timestamptz,
  verlassen_am timestamptz,
  primary key (tisch_id, person_id)
);
create index if not exists kc_club_tisch_teilnahme_person on public.kc_club_tisch_teilnahme (person_id);
alter table public.kc_club_tisch_teilnahme enable row level security;
revoke all on public.kc_club_tisch_teilnahme from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_tisch_teilnahme to service_role;
comment on table public.kc_club_tisch_teilnahme is 'KC-CLUB-RUNDER-TISCH: Zusage und Platz am Runden Tisch (Herzschlag zuletzt_da) – nur Club-Server.';

-- Platz nehmen / Herzschlag. Ergebnis: ok (neu am Tisch) | da (saß schon, Herzschlag) | voll | zu_frueh | vorbei | abgesagt | fehlt
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
  select * into v_z from public.kc_club_tisch_teilnahme where tisch_id = p_tisch and person_id = p_person;
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
  -- Tisch-Chat: wer Platz nimmt, ist dabei (bleibt Teilnehmer, bis der Chat nach 30 Tagen gelöscht wird)
  if v_t.thread_id is not null and not exists (select 1 from public.kc_communication_thread_participants where thread_id = v_t.thread_id and person_id = p_person) then
    insert into public.kc_communication_thread_participants (thread_id, person_id) values (v_t.thread_id, p_person);
  end if;
  return 'ok';
end;
$$;
revoke all on function public.kc_club_tisch_beitreten(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.kc_club_tisch_beitreten(uuid, text, integer, integer) to service_role;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_tisch', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-RUNDER-TISCH: Runder Tisch'),
       ('kc_club_tisch_teilnahme', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-RUNDER-TISCH: Zusage und Platz am Runden Tisch')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_tisch'), ('kc_club_tisch_teilnahme') on conflict (table_name) do nothing;
