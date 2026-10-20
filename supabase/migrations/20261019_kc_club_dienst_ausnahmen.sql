-- 2.508.0 KC-CLUB-DIENST-AUSNAHMEN (Wunsch Hansi): Mitglieder, die im Club bleiben, aber für den Dienstplan nicht zur Verfügung stehen
-- (z. B. weggezogen). Registry statt fest im Programm: wer hier steht, wird nicht an Dienstwünsche erinnert, erscheint nicht unter
-- „noch nicht abgegeben“ und bekommt den Laufband-Hinweis „Wünsche eingeben?“ nicht. DP2 führt dasselbe heute in K.nonPlanningPersonIds.
-- Rückweg: drop table public.kc_club_dienst_ausnahmen;
create table if not exists public.kc_club_dienst_ausnahmen (
  person_id text primary key,
  grund text check (grund is null or char_length(grund) <= 300),
  seit timestamptz not null default now(),
  eingetragen_von text
);
alter table public.kc_club_dienst_ausnahmen enable row level security;
revoke all on public.kc_club_dienst_ausnahmen from public, anon, authenticated;
grant select, insert, update, delete on public.kc_club_dienst_ausnahmen to service_role;
