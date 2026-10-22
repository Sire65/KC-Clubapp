-- KC-CLUB-FREMDZUGRIFF (Server/App 2.579.0, 22.10.2026, Wunsch Hansi „Fremde Anmeldeversuche: wann, mit welchem Schlüssel, Vermutung wer“):
-- 1. kc_club_fremdzugriff: jeder abgelehnte Anmeldeversuch (Schlüssel unbekannt, alter Link, Person gesperrt, Schlüssel kaputt) mit Zeit,
--    Kurzkennung des Schlüssels (die ersten 12 Zeichen seines SHA-256 – nie der Schlüssel selbst), Netz-Kennung (SHA-256 der IP, gekürzt),
--    Gerät/Browser und der Vermutung des Servers, wer es war. Nur der Club-Server (service_role). 90 Tage aufbewahrt (Wartung).
-- 2. kc_club_zugang_alt: Hash jedes ersetzten oder abgeschalteten Links (Trigger auf kc_club_zugang) – so erkennt der Server
--    „alter Link von Klaus“ statt nur „unbekannt“. Ein alter Hash öffnet nichts mehr; er dient nur der Zuordnung.
-- Rückweg: drop trigger kc_club_zugang_alt_merken on public.kc_club_zugang; drop function public.kc_club_zugang_alt_merken();
--          drop table public.kc_club_fremdzugriff; drop table public.kc_club_zugang_alt;
--          delete from public.kc_db_mirror_table_rules where table_name in ('kc_club_fremdzugriff', 'kc_club_zugang_alt');
--          delete from public.kc_neon_resume_tables where table_name in ('kc_club_fremdzugriff', 'kc_club_zugang_alt');
create table if not exists public.kc_club_fremdzugriff (
  id bigint generated always as identity primary key,
  zeit timestamptz not null default now(),
  grund text not null check (grund in ('unbekannt', 'alt', 'gesperrt', 'kaputt')),
  schluessel text,                      -- Kurzkennung: erste 12 Zeichen des SHA-256 (gleicher Wert = gleicher Schlüssel)
  person_vermutung text,                -- person_id, falls der Server jemanden vermutet
  vermutung text,                       -- Begründung („alter Link von …“, „gleiche Internetverbindung wie … vor 3 Min.“)
  netz text,                            -- SHA-256 der IP, gekürzt (gleicher Wert = gleiche Internetverbindung)
  geraet text, ua text, version text, land text,
  check (char_length(coalesce(vermutung, '')) <= 300 and char_length(coalesce(ua, '')) <= 200)
);
create index if not exists kc_club_fremdzugriff_zeit on public.kc_club_fremdzugriff (zeit desc);
alter table public.kc_club_fremdzugriff enable row level security;
revoke all on public.kc_club_fremdzugriff from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_fremdzugriff to service_role;
comment on table public.kc_club_fremdzugriff is 'KC-CLUB-FREMDZUGRIFF: abgelehnte Anmeldeversuche (ohne Schlüssel, nur Kurzkennung) – nur Club-Server.';

create table if not exists public.kc_club_zugang_alt (
  token_hash text primary key,
  person_id text not null,
  ersetzt_am timestamptz not null default now(),
  grund text not null default 'ersetzt' check (grund in ('ersetzt', 'abgeschaltet'))
);
create index if not exists kc_club_zugang_alt_person on public.kc_club_zugang_alt (person_id);
alter table public.kc_club_zugang_alt enable row level security;
revoke all on public.kc_club_zugang_alt from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_zugang_alt to service_role;
comment on table public.kc_club_zugang_alt is 'KC-CLUB-FREMDZUGRIFF: Hashes ersetzter/abgeschalteter Links (öffnen nichts) – nur zur Zuordnung von Anmeldeversuchen.';

create or replace function public.kc_club_zugang_alt_merken() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  begin
    if old.token_hash is not null and new.token_hash is distinct from old.token_hash then
      insert into public.kc_club_zugang_alt (token_hash, person_id, grund) values (old.token_hash, old.person_id, 'ersetzt')
        on conflict (token_hash) do update set ersetzt_am = now(), person_id = excluded.person_id, grund = 'ersetzt';
    elsif old.token_hash is not null and old.aktiv and not new.aktiv then
      insert into public.kc_club_zugang_alt (token_hash, person_id, grund) values (old.token_hash, old.person_id, 'abgeschaltet')
        on conflict (token_hash) do update set ersetzt_am = now(), person_id = excluded.person_id, grund = 'abgeschaltet';
    end if;
  exception when others then null; -- das Merken darf einen neuen Link nie verhindern
  end;
  return new;
end $$;
revoke all on function public.kc_club_zugang_alt_merken() from public, anon, authenticated;
drop trigger if exists kc_club_zugang_alt_merken on public.kc_club_zugang;
create trigger kc_club_zugang_alt_merken after update of token_hash, aktiv on public.kc_club_zugang
  for each row execute function public.kc_club_zugang_alt_merken();

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note) values
  ('kc_club_fremdzugriff', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-FREMDZUGRIFF: abgelehnte Anmeldeversuche (ohne Schlüssel)'),
  ('kc_club_zugang_alt', 'Club-App', 'secret', false, false, false, 'KC-CLUB-FREMDZUGRIFF: Hashes alter Links – bewusst nicht gespiegelt')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_fremdzugriff') on conflict (table_name) do nothing;
