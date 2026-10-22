-- KC-CLUB-DIENST-STEMPEL (Server/App 2.590.0, 22.10.2026, Wunsch Hansi, Konzept „Dienst-Anmeldung in der Club-App“, Stufe 1):
-- Gemeinsames Buchungsbuch für Kommen/Gehen. Heute schreibt nur die Club-App (Quelle 'app') und der Admin ('planer'); die Kasse
-- (Stechuhr KC_TIME_CLOCK_V1) soll in Stufe 2 dasselbe Buch nutzen (Quelle 'kasse', kasse_event_id = ihre Ereignis-ID, doppelt sicher).
-- Eine Zeile je Kommen oder Gehen; nie überschrieben: eine Korrektur ist eine neue Zeile (korrektur_von), die alte wird storniert.
-- kc_dp_stempel_paare: Kommen + Gehen als Ist-Zeile – zum Lesen für den Dienstplan (Stufe 2, Codex). Noch schreibt nichts in
-- kc_dp_timeclock_actuals; der Dienstplan bekommt bis zur Freigabe also keine Test-Buchungen.
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated (KC-SUPABASE-GRANTS).
-- Rückweg: drop view public.kc_dp_stempel_paare; drop table public.kc_dp_stempel;
--          delete from public.kc_db_mirror_table_rules where table_name = 'kc_dp_stempel';
--          delete from public.kc_neon_resume_tables where table_name = 'kc_dp_stempel';
create table if not exists public.kc_dp_stempel (
  id uuid primary key default gen_random_uuid(),
  org_id text not null default 'KC_WERNE',
  event_id text,                         -- Veranstaltung (z. B. KC-WM-2026), falls bekannt
  person_id text not null,
  member_no text,                        -- Mitgliedsnummer (KC-00xx) – kennt auch die Kasse
  art text not null check (art in ('in', 'out')),
  zeit timestamptz not null,             -- gebuchte Zeit (wie effectiveAt der Kasse)
  erfasst_am timestamptz not null default now(), -- Zeit der Eingabe (wie recordedAt der Kasse)
  quelle text not null check (quelle in ('app', 'kasse', 'planer')),
  geraet text,                           -- Gerät/Kasse in Worten
  dienst_ref text,                       -- geplanter Dienst (kc_dp_plan_published.source_shift_id)
  dienst_start timestamptz, dienst_ende timestamptz, -- Plan zum Zeitpunkt der Buchung (für Abweichung ohne Nachschlagen)
  grund text check (char_length(coalesce(grund, '')) <= 120),
  pause_min integer check (pause_min between 0 and 240),
  vor_ort boolean,                       -- Standort im Umkreis eines Dienst-Orts: ja/nein, null = nicht geprüft (Standort selbst wird nie gespeichert)
  spontan boolean not null default false,
  nachgetragen boolean not null default false,
  korrektur_von uuid references public.kc_dp_stempel(id),
  storniert_am timestamptz, storniert_von text,
  erstellt_von text not null,
  kasse_event_id text unique,            -- Stufe 2: ID des Kassen-Ereignisses (doppelt melden = einmal gebucht)
  schema text not null default 'KC_TIME_CLOCK_V1'
);
create index if not exists kc_dp_stempel_person on public.kc_dp_stempel (person_id, zeit desc);
create index if not exists kc_dp_stempel_zeit on public.kc_dp_stempel (org_id, zeit desc);
alter table public.kc_dp_stempel enable row level security;
revoke all on public.kc_dp_stempel from public, anon, authenticated;
grant select, insert, update, delete on public.kc_dp_stempel to service_role;
comment on table public.kc_dp_stempel is 'KC-CLUB-DIENST-STEMPEL: gemeinsames Buchungsbuch Kommen/Gehen (App, Kasse, Planer) – nur Club-Server.';

create or replace view public.kc_dp_stempel_paare with (security_invoker = true) as
with b as (
  select s.*, lead(s.art) over w as n_art, lead(s.zeit) over w as n_zeit, lead(s.id) over w as n_id, lead(s.pause_min) over w as n_pause,
         lead(s.grund) over w as n_grund, lead(s.quelle) over w as n_quelle, lag(s.art) over w as v_art
  from public.kc_dp_stempel s where s.storniert_am is null
  window w as (partition by s.org_id, s.person_id order by s.zeit, s.erfasst_am)
)
select org_id, event_id, person_id, member_no, id as kommen_id, case when n_art = 'out' then n_id end as gehen_id,
       zeit as kommen, case when n_art = 'out' then n_zeit end as gehen, case when n_art = 'out' then coalesce(n_pause, 0) end as pause_min,
       dienst_ref, (timezone('Europe/Berlin', zeit))::date as work_date,
       case when n_art = 'out' then 'complete' else 'missing_end' end as status,
       quelle as quelle_kommen, case when n_art = 'out' then n_quelle end as quelle_gehen, grund as grund_kommen, case when n_art = 'out' then n_grund end as grund_gehen,
       vor_ort, spontan
from b where art = 'in'
union all
select org_id, event_id, person_id, member_no, null, id, null, zeit, coalesce(pause_min, 0), dienst_ref, (timezone('Europe/Berlin', zeit))::date,
       'missing_start', null, quelle, null, grund, vor_ort, spontan
from b where art = 'out' and v_art is distinct from 'in';
revoke all on public.kc_dp_stempel_paare from public, anon, authenticated;
grant select on public.kc_dp_stempel_paare to service_role;
comment on view public.kc_dp_stempel_paare is 'KC-CLUB-DIENST-STEMPEL: Kommen+Gehen als Ist-Zeile (complete / missing_end / missing_start) – zum Lesen für den Dienstplan.';

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_dp_stempel', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-DIENST-STEMPEL: Kommen/Gehen-Buchungen (App, Kasse, Planer)')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_dp_stempel') on conflict (table_name) do nothing;
