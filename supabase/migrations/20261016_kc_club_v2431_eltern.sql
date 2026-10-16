-- KC-CLUB-ELTERN (2.431.0, Wunsch Hansi): Eltern-Handy für Kinder – sachte, die Kinder brauchen Privatsphäre.
-- Eltern bekommen NUR einen Push, wenn das Kind einen Termin hat (Club-Treffen neu/geändert/abgesagt, Erinnerung, Schulungen)
-- oder eine Nachricht der Clubleitung/des Admins bekommt (nur Hinweis, ohne Text). Chats unter Mitgliedern gehen nie an Eltern.
-- Eingetragen von Admin/Clubleitung mit Name + Handynummer; Einladung per WhatsApp-Link (Schlüssel nur als SHA-256 gespeichert),
-- der Link erlaubt NUR das Ein-/Ausschalten der Benachrichtigungen – kein Zugang zur App.
-- Rückweg: drop table public.kc_club_eltern;

create table if not exists public.kc_club_eltern (
  id uuid primary key default gen_random_uuid(),
  kind text not null references public.kc_core_people(person_id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  telefon text not null check (telefon ~ '^\+?[0-9]{6,20}$'),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  subscription jsonb,
  endpoint text,
  aktiv boolean not null default true,
  erstellt_am timestamptz not null default now(),
  erstellt_von text,
  angemeldet_am timestamptz,
  letzter_push timestamptz,
  letzter_nachricht_hinweis timestamptz
);
create index if not exists kc_club_eltern_kind_idx on public.kc_club_eltern (kind) where aktiv;
alter table public.kc_club_eltern enable row level security;
revoke all on table public.kc_club_eltern from public, anon, authenticated;
grant select, insert, update, delete on table public.kc_club_eltern to service_role;
