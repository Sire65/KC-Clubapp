-- KC-CLUB-RUNDER-TISCH-GAST (Server/App 2.776.0, Stufe RT4, 30.10.2026, Wunsch Hansi „externe Gäste, z. B. Experten – jedes Mitglied darf Gäste
-- einladen“). Spezifikation: docs/RUNDER_TISCH.md, Abschnitte 4 und 18.
-- kc_club_tisch_gast: ein Tischgast (Name, Rolle) mit persönlichem Link NUR für diesen einen Tisch. Gespeichert wird nur der Fingerabdruck des Links
--   (link_hash, sha256) und – ab dem ersten Öffnen – der Fingerabdruck des Geräts (geraet_hash): der Link gilt nur auf diesem einen Gerät.
--   Gültig von 30 Min. vor Beginn bis Tischende (prüft der Club-Server). Zurückziehen: zurueckgezogen_am. Löschen 7 Tage nach Tischende (Wartung).
-- kc_club_tisch_gast_beitreten: Platz nehmen bzw. Herzschlag des Gastes – Platzgrenze unter Zeilensperre wie bei Mitgliedern
--   (kc_club_tisch_beitreten bleibt unverändert). Der Gast wird NICHT Teilnehmer des Tisch-Chats (keine Chat-Inhalte für Gäste).
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated (KC-SUPABASE-GRANTS).
-- Rückweg: drop function public.kc_club_tisch_gast_beitreten(uuid, integer, integer); drop table public.kc_club_tisch_gast;
--          delete from public.kc_club_tisch_teilnahme where person_id like 'TG-%';
--          delete from public.kc_db_mirror_table_rules where table_name = 'kc_club_tisch_gast';
--          delete from public.kc_neon_resume_tables where table_name = 'kc_club_tisch_gast';
create table if not exists public.kc_club_tisch_gast (
  id uuid primary key default gen_random_uuid(),
  tisch_id uuid not null references public.kc_club_tisch(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 60),
  rolle text check (rolle is null or char_length(rolle) <= 60),
  link_hash text not null unique check (link_hash ~ '^[0-9a-f]{64}$'),
  geraet_hash text check (geraet_hash is null or geraet_hash ~ '^[0-9a-f]{64}$'),
  eingeladen_von text not null,
  erstellt_am timestamptz not null default now(),
  erster_zugriff_am timestamptz,
  zurueckgezogen_am timestamptz
);
create index if not exists kc_club_tisch_gast_tisch on public.kc_club_tisch_gast (tisch_id);
alter table public.kc_club_tisch_gast enable row level security;
revoke all on public.kc_club_tisch_gast from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_tisch_gast to service_role;
comment on table public.kc_club_tisch_gast is 'KC-CLUB-RUNDER-TISCH-GAST: externe Tischgäste – Link nur als Fingerabdruck, ein Gerät, nur ein Tisch. Nur Club-Server.';

create or replace function public.kc_club_tisch_gast_beitreten(p_gast uuid, p_frisch_sek integer, p_vorlauf_min integer)
returns text
language plpgsql
set search_path = public
as $$
declare v_g public.kc_club_tisch_gast%rowtype; v_t public.kc_club_tisch%rowtype; v_z public.kc_club_tisch_teilnahme%rowtype; v_pid text; v_sitzen integer;
begin
  select * into v_g from public.kc_club_tisch_gast where id = p_gast;
  if not found or v_g.zurueckgezogen_am is not null then return 'fehlt'; end if;
  select * into v_t from public.kc_club_tisch where id = v_g.tisch_id for update;  -- Sperre: gleichzeitige Anfragen kommen nacheinander dran
  if not found then return 'fehlt'; end if;
  if v_t.status = 'abgesagt' then return 'abgesagt'; end if;
  if now() >= v_t.ende then return 'vorbei'; end if;
  if now() < v_t.beginn - make_interval(mins => p_vorlauf_min) then return 'zu_frueh'; end if;
  v_pid := 'TG-' || p_gast::text;
  select * into v_z from public.kc_club_tisch_teilnahme where tisch_id = v_t.id and person_id = v_pid;
  if found and v_z.dabei_seit is not null and v_z.verlassen_am is null and v_z.zuletzt_da > now() - make_interval(secs => p_frisch_sek) then
    update public.kc_club_tisch_teilnahme set zuletzt_da = now() where tisch_id = v_t.id and person_id = v_pid;
    return 'da';
  end if;
  select count(*) into v_sitzen from public.kc_club_tisch_teilnahme
    where tisch_id = v_t.id and person_id <> v_pid and dabei_seit is not null and verlassen_am is null and zuletzt_da > now() - make_interval(secs => p_frisch_sek);
  if v_sitzen >= v_t.plaetze then return 'voll'; end if;
  insert into public.kc_club_tisch_teilnahme (tisch_id, person_id, dabei_seit, zuletzt_da, verlassen_am)
    values (v_t.id, v_pid, now(), now(), null)
    on conflict (tisch_id, person_id) do update set dabei_seit = coalesce(public.kc_club_tisch_teilnahme.dabei_seit, now()), zuletzt_da = now(), verlassen_am = null;
  return 'ok';
end;
$$;
revoke all on function public.kc_club_tisch_gast_beitreten(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.kc_club_tisch_gast_beitreten(uuid, integer, integer) to service_role;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_tisch_gast', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-RUNDER-TISCH-GAST: externe Tischgäste (nur Fingerabdrücke)')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_tisch_gast') on conflict (table_name) do nothing;
