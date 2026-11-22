-- KC-CLUB-ADVENT-GADGETS (Wunsch Hansi 22.11.2026): 4 Einzelstücke im Adventskalender (3.12. Ladekabel, 10.12. Flaschenöffner, 13.12. Plüsch-Biene,
-- 17.12. Ringlicht). Wer das Türchen am Tag öffnet, tippt bis 22 Uhr „🎲 Ich mache mit“; der Club-Server lost beim ersten Abruf nach 22 Uhr aus (ohne Zeitplan).
-- kc_club_advent_gadget_teilnahme: eine Zeile je Jahr, Tag und Person. kc_club_advent_gadget_gewinn: eine Zeile je Jahr und Tag (= nur einmal gezogen),
-- person_id null = nicht vergeben; unique (jahr, person_id) = niemand gewinnt zweimal im Jahr.
-- Nur der Club-Server (service_role); RLS an, keine Rechte für anon/authenticated (KC-SUPABASE-GRANTS). Gespiegelt und gesichert. Nur additiv.
-- Rückweg: drop table public.kc_club_advent_gadget_gewinn, public.kc_club_advent_gadget_teilnahme;
--          delete from public.kc_db_mirror_table_rules where table_name in ('kc_club_advent_gadget_teilnahme', 'kc_club_advent_gadget_gewinn');
--          delete from public.kc_neon_resume_tables where table_name in ('kc_club_advent_gadget_teilnahme', 'kc_club_advent_gadget_gewinn');
create table if not exists public.kc_club_advent_gadget_teilnahme (
  jahr integer not null check (jahr between 2026 and 2100),
  tag integer not null check (tag between 1 and 24),
  person_id text not null references public.kc_core_people(person_id),
  am timestamptz not null default now(),
  primary key (jahr, tag, person_id)
);
alter table public.kc_club_advent_gadget_teilnahme enable row level security;
revoke all on public.kc_club_advent_gadget_teilnahme from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_advent_gadget_teilnahme to service_role;

create table if not exists public.kc_club_advent_gadget_gewinn (
  jahr integer not null check (jahr between 2026 and 2100),
  tag integer not null check (tag between 1 and 24),
  gadget text not null check (length(gadget) between 1 and 60),
  person_id text references public.kc_core_people(person_id),
  teilnehmer integer not null default 0 check (teilnehmer >= 0),
  gezogen_am timestamptz not null default now(),
  primary key (jahr, tag)
);
create unique index if not exists kc_club_advent_gadget_gewinn_einmal on public.kc_club_advent_gadget_gewinn (jahr, person_id) where person_id is not null;
alter table public.kc_club_advent_gadget_gewinn enable row level security;
revoke all on public.kc_club_advent_gadget_gewinn from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_advent_gadget_gewinn to service_role;

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_advent_gadget_teilnahme', 'Club-App', 'normal', false, true, true, 'KC-CLUB-ADVENT-GADGETS: Adventskalender – wer bei der Gadget-Verlosung mitmacht'),
       ('kc_club_advent_gadget_gewinn', 'Club-App', 'normal', false, true, true, 'KC-CLUB-ADVENT-GADGETS: Adventskalender – Gewinner je Gadget-Tag')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_advent_gadget_teilnahme'), ('kc_club_advent_gadget_gewinn') on conflict (table_name) do nothing;
