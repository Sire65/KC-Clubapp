-- KC-CLUB-EXPRESS (2.362.0, Wunsch Hansi): 🏎️ Express-Sendung – beim Empfänger ploppt ein Fenster auf (Öffnen / Später / Nein, ☑ Empfang bestätigen).
-- Nur der Server (service_role) liest und schreibt – RLS an, keine Richtlinien für Nutzer.
create table if not exists public.kc_club_express (
  message_id uuid primary key references public.kc_communication_messages(id) on delete cascade,
  thread_id uuid not null,
  absender text not null,
  erstellt_am timestamptz not null default now()
);
create index if not exists kc_club_express_thread on public.kc_club_express (thread_id, erstellt_am);
create index if not exists kc_club_express_absender on public.kc_club_express (absender, erstellt_am);
create table if not exists public.kc_club_express_antwort (
  message_id uuid not null references public.kc_club_express(message_id) on delete cascade,
  person_id text not null,
  antwort text not null check (antwort in ('geoeffnet','spaeter','nein')),
  spaeter_bis timestamptz,
  bestaetigt_am timestamptz,
  am timestamptz not null default now(),
  primary key (message_id, person_id)
);
alter table public.kc_club_express enable row level security;
alter table public.kc_club_express_antwort enable row level security;
revoke all on public.kc_club_express, public.kc_club_express_antwort from anon, authenticated;
grant select, insert, update, delete on public.kc_club_express to service_role;
grant select, insert, update, delete on public.kc_club_express_antwort to service_role;
