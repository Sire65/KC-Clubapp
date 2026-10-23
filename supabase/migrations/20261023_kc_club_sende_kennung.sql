-- 2.603.0 KC-CLUB-SENDE-SCHLANGE (Wunsch Hansi: „Nachrichten-Funktion sicher, schnell, bedienerfreundlich – auch wenn ziemlich schnell hin und her
-- geschrieben wird; eine Warteschlange, die der Reihe nach abarbeitet, Express überholt“): Die App schickt jede Nachricht mit einer eigenen
-- Kennung (cid). Kommt dieselbe Nachricht zweimal an (Netz-Wackler → automatischer neuer Versuch), speichert der Server sie nur EINMAL und
-- antwortet beim zweiten Mal mit der schon gespeicherten Nachricht. message_id null = wird gerade gespeichert (älter als 60 s → gilt als verwaist).
-- Nur der Server (service_role) liest und schreibt; RLS ohne Richtlinien sperrt alles andere. Einträge älter als 2 Tage räumt der Server weg.
-- Rückweg: drop table public.kc_club_sende_kennung;
create table if not exists public.kc_club_sende_kennung (
  cid uuid primary key,
  person_id text not null,
  thread_id uuid,
  message_id uuid,
  erstellt_am timestamptz not null default now()
);
create index if not exists kc_club_sende_kennung_alter on public.kc_club_sende_kennung (erstellt_am);
alter table public.kc_club_sende_kennung enable row level security;
revoke all on public.kc_club_sende_kennung from anon, authenticated;
grant select, insert, update, delete on public.kc_club_sende_kennung to service_role; -- KC-SUPABASE-GRANTS
