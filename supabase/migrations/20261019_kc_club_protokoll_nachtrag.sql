-- KC-CLUB-PROTOKOLL-NACHTRAG (Wunsch Hansi 19.10.2026: „Ich will nicht manuell eintragen“):
-- Texte für ein Protokoll (z. B. von Claude aus Hansis Diktat) werden hier als Vorschlag abgelegt – sie gehen NIE ungeprüft ins Protokoll.
-- Wer das Protokoll bearbeiten darf, sieht sie in der App und übernimmt sie mit einem Tipp (Server-Aktion protokoll_nachtrag) oder verwirft sie.
-- Zugriff nur über die Edge Function (RLS an, keine Richtlinie für anon/authenticated). Rückweg: drop table public.kc_club_protokoll_nachtrag;
create table if not exists public.kc_club_protokoll_nachtrag (
  id uuid primary key default gen_random_uuid(),
  protokoll_id uuid not null references public.kc_club_sitzungsprotokolle(id) on delete cascade,
  feld text not null default 'kurzfassung' check (feld in ('kurzfassung', 'beschluesse')),
  text text not null check (length(text) between 1 and 4000),
  quelle text not null default 'claude',
  erstellt_von text not null,
  erstellt_am timestamptz not null default now(),
  uebernommen_am timestamptz,
  verworfen_am timestamptz,
  erledigt_von text
);
create index if not exists kc_club_protokoll_nachtrag_offen on public.kc_club_protokoll_nachtrag (protokoll_id) where uebernommen_am is null and verworfen_am is null;
alter table public.kc_club_protokoll_nachtrag enable row level security;
grant select, insert, update, delete on public.kc_club_protokoll_nachtrag to service_role;
