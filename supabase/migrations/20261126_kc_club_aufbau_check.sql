-- KC-CLUB-AUFBAU-CHECK (3.45.0, Wunsch Hansi 26.11.2026): Haken der Aufbau-Checkliste je Tag (Club-App → Admin → 🧰 Aufbau-Check).
-- Nur der Club-Server (service_role) liest und schreibt; keine Inhalte aus Chats, nur Prüfpunkt-Kennung, erledigt, kurze Notiz, wer, wann.
create table if not exists public.kc_club_aufbau_check (
  tag date not null,
  punkt text not null check (punkt ~ '^[a-z0-9_-]{2,60}$'),
  erledigt boolean not null default false,
  notiz text check (notiz is null or length(notiz) <= 300),
  geaendert_von text,
  geaendert_am timestamptz not null default now(),
  primary key (tag, punkt)
);
alter table public.kc_club_aufbau_check enable row level security;
revoke all on public.kc_club_aufbau_check from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_aufbau_check to service_role;
