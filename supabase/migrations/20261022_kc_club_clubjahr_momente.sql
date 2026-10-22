-- 2.581.0 KC-CLUB-CLUBJAHR-MOMENTE (Wunsch Hansi „Unser Clubjahr“ – Teil 1: Sammelaktion; Wahl Hansi: Start im November, Freigabe durch die
-- Clubleitung, Übergabe des Hefts beim Weihnachtsessen im Januar): jedes Mitglied reicht EINEN „Clubmoment“ des Jahres ein – ein Foto
-- (optional) und ein, zwei Sätze. Die Clubleitung gibt frei oder fragt zurück. Ins Heft (Teil 2) kommen nur freigegebene Momente.
-- Zugriff nur über die Edge Function (Service-Rolle); RLS ohne Richtlinien sperrt direkte Zugriffe.
-- Zeitraum/Jahr stehen in kc_club_konfig 'clubjahr' (Clubleitung kann den Einsendeschluss in der App ändern – kein fester Wert im Code).
-- Rückweg: drop table public.kc_club_clubjahr_momente; delete from kc_club_konfig where schluessel = 'clubjahr';
create table if not exists public.kc_club_clubjahr_momente (
  id uuid primary key default gen_random_uuid(),
  jahr integer not null check (jahr between 2000 and 2100),
  person_id text not null,                 -- wessen Moment (ein Moment je Mitglied und Jahr)
  eingereicht_von text not null,           -- selbst oder die Clubleitung für ein Mitglied ohne App
  text text not null check (length(text) between 3 and 400),
  foto uuid,                               -- kc_communication_attachments.id (selbst hochgeladen)
  monat integer check (monat between 1 and 12),
  status text not null default 'eingereicht' check (status in ('eingereicht', 'freigegeben', 'rueckfrage')),
  rueckmeldung text check (rueckmeldung is null or length(rueckmeldung) <= 300),
  geprueft_von text,
  geprueft_am timestamptz,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  unique (jahr, person_id)
);
create index if not exists kc_club_clubjahr_momente_foto on public.kc_club_clubjahr_momente (foto) where foto is not null;
alter table public.kc_club_clubjahr_momente enable row level security;
revoke all on public.kc_club_clubjahr_momente from anon, authenticated;
grant select, insert, update, delete on public.kc_club_clubjahr_momente to service_role; -- KC-SUPABASE-GRANTS
insert into kc_club_konfig (schluessel, wert, geaendert_von) values
  ('clubjahr', '{"jahr": 2026, "start": "2026-11-01", "ende": "2026-12-15"}', 'KC-P-002')
on conflict (schluessel) do nothing;
