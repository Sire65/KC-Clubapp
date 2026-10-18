-- KC-CLUB-WUNSCHLISTE (2.440.0, Wunsch Hansi „Baue mir eine Liste ins Programm, wo ich dir Vorschläge reinschreibe – du schaust immer da rein
-- und arbeitest Punkt für Punkt ab“): Admin schreibt Wünsche/Fehler; Claude liest sie (Datenbank-Zugang), setzt Status und antwortet.
-- Nur der Club-Server (service_role) liest/schreibt; RLS an, keine Rechte für anon/authenticated.
-- Rückweg: drop table public.kc_club_wunschliste;
create table if not exists public.kc_club_wunschliste (
  id uuid primary key default gen_random_uuid(),
  nr serial,
  text text not null check (length(text) between 1 and 4000),
  bereich text not null default 'Club-App' check (bereich in ('Club-App', 'Kasse', 'PC-Manager', 'Money Butler', 'Dienstplan DP2', 'Verwaltung', 'Sonstiges')),
  wichtig boolean not null default false,
  status text not null default 'offen' check (status in ('offen', 'in_arbeit', 'rueckfrage', 'erledigt', 'zurueckgestellt')),
  antwort text check (antwort is null or length(antwort) <= 4000),          -- Claude: Ergebnis, Rückfrage, Hinweis
  rueckmeldung text check (rueckmeldung is null or length(rueckmeldung) <= 4000), -- Hansi: Antwort auf die Rückfrage
  version text check (version is null or length(version) <= 20),           -- in welcher Version erledigt
  reihenfolge double precision not null default extract(epoch from now()),
  erstellt_von text,
  erstellt_am timestamptz not null default now(),
  geaendert_am timestamptz not null default now(),
  erledigt_am timestamptz
);
create index if not exists kc_club_wunschliste_status on public.kc_club_wunschliste (status, reihenfolge);
alter table public.kc_club_wunschliste enable row level security;
revoke all on public.kc_club_wunschliste from anon, authenticated;
grant select, insert, update, delete on public.kc_club_wunschliste to service_role;
grant usage, select on sequence public.kc_club_wunschliste_nr_seq to service_role;
