-- KC-CLUB-ANRUFBEANTWORTER (Server/App 2.568.0, 21.10.2026, Wunsch Hansi „Anrufbeantworter einschalten … Nachricht hinterlassen … abgehört“):
-- 1. Anklopfen bekommt den Status 'anrufbeantworter' (der Angeklopfte hat den Anrufbeantworter eingeschaltet).
-- 2. Tabelle kc_club_anrufbeantworter: wer wem eine Tonaufnahme (Anlage in kc_communication_attachments) aufgesprochen hat,
--    wann sie abgehört, wann die Quittung dem Absender gezeigt und wann sie vom Empfänger gelöscht wurde. Nur der Club-Server (service_role).
-- 3. Signal (nur Art „ab“, nie Inhalt): neue Nachricht → Empfänger, abgehört → Absender. Sparbremse wie immer in kc_club_rt_klingeln.
-- Rückweg: drop trigger kc_club_rt_ab on public.kc_club_anrufbeantworter; drop function public.kc_club_rt_ab_trigger();
--          drop table public.kc_club_anrufbeantworter; delete from public.kc_db_mirror_table_rules where table_name = 'kc_club_anrufbeantworter';
--          delete from public.kc_neon_resume_tables where table_name = 'kc_club_anrufbeantworter';
--          (Status 'anrufbeantworter' darf in der Prüfung bleiben – die alte App setzt ihn nie.)
alter table public.kc_club_anklopfen drop constraint if exists kc_club_anklopfen_status_check;
alter table public.kc_club_anklopfen add constraint kc_club_anklopfen_status_check
  check (status in ('offen', 'angenommen', 'spaeter', 'abgebrochen', 'anrufbeantworter'));

create table if not exists public.kc_club_anrufbeantworter (
  id uuid primary key default gen_random_uuid(),
  von text not null,
  an text not null,
  anlage_id uuid not null,              -- Tonaufnahme (kc_communication_attachments.id); beim Löschen mit entfernt
  sekunden int not null check (sekunden between 1 and 905),
  klopf_id uuid,                        -- aus welchem Anklopfen (falls)
  erstellt_am timestamptz not null default now(),
  gehoert_am timestamptz,               -- zum ersten Mal abgespielt
  quittung_am timestamptz,              -- Absender hat „abgehört am …“ gesehen
  geloescht_am timestamptz,             -- Empfänger hat gelöscht (Aufnahme ist dann weg)
  check (von <> an)
);
create index if not exists kc_club_anrufbeantworter_an on public.kc_club_anrufbeantworter (an, erstellt_am desc);
create index if not exists kc_club_anrufbeantworter_von on public.kc_club_anrufbeantworter (von, erstellt_am desc);
alter table public.kc_club_anrufbeantworter enable row level security;
revoke all on public.kc_club_anrufbeantworter from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_anrufbeantworter to service_role;
comment on table public.kc_club_anrufbeantworter is 'KC-CLUB-ANRUFBEANTWORTER: aufgesprochene Nachrichten (Anlage) mit Abgehört-Quittung – nur Club-Server.';

insert into public.kc_db_mirror_table_rules (table_name, area, sensitivity, realtime_allowed, mirror_enabled, backup_enabled, note)
values ('kc_club_anrufbeantworter', 'Club-App', 'sensitive', false, true, true, 'KC-CLUB-ANRUFBEANTWORTER: wer wem aufgesprochen hat (ohne Ton) – gespiegelt und gesichert')
on conflict (table_name) do nothing;
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_anrufbeantworter') on conflict (table_name) do nothing;

create or replace function public.kc_club_rt_ab_trigger() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  begin
    if tg_op = 'INSERT' then perform public.kc_club_rt_klingeln(array[new.an], 'ab');
    elsif new.gehoert_am is not null and old.gehoert_am is null then perform public.kc_club_rt_klingeln(array[new.von], 'ab');
    end if;
  exception when others then null; -- ein Signal darf das Speichern nie verhindern
  end;
  return null;
end $$;
revoke all on function public.kc_club_rt_ab_trigger() from public, anon, authenticated;
drop trigger if exists kc_club_rt_ab on public.kc_club_anrufbeantworter;
create trigger kc_club_rt_ab after insert or update of gehoert_am on public.kc_club_anrufbeantworter
  for each row execute function public.kc_club_rt_ab_trigger();
