-- KC-CLUB-AKTENTASCHE (Wunsch Hansi 27.10.2026 „Aktentasche packen für Clubsprecher, Kassenwart, Admin – alle wichtigen Unterlagen für einen Termin
-- zusammen: Protokollentwurf, Einladung, Vorschläge, Mitglieder, Zeichnungen; Register, Packliste vorn, Notizen; gepackt → in der Kachel Clubabend“).
-- Eine gemeinsame Tasche je Termin – jeder aus der Leitung kann dazupacken. Inhalt = Verweise auf die Originale (immer aktueller Stand);
-- selbst dazugelegte Dateien liegen in der Anlagen-Ablage (kc_club_objekt_anlagen, art 'aktentasche'). Nur der Server liest und schreibt.
-- Rückweg: drop table public.kc_club_aktentasche; Prüfregel von kc_club_objekt_anlagen ohne 'aktentasche' wiederherstellen.
create table if not exists public.kc_club_aktentasche (
  id uuid primary key default gen_random_uuid(),
  treffen_id uuid not null unique references public.kc_club_treffen(id) on delete cascade,
  status text not null default 'offen' check (status in ('offen','gepackt')),
  inhalt jsonb not null default '[]'::jsonb check (jsonb_typeof(inhalt) = 'array' and jsonb_array_length(inhalt) <= 80),
  notiz text not null default '' check (char_length(notiz) <= 20000),
  version integer not null default 1,
  erstellt_von text not null,
  erstellt_am timestamptz not null default now(),
  geaendert_von text,
  geaendert_am timestamptz not null default now(),
  gepackt_von text,
  gepackt_am timestamptz
);
alter table public.kc_club_aktentasche enable row level security;
revoke all on public.kc_club_aktentasche from anon, authenticated;
grant select, insert, update, delete on public.kc_club_aktentasche to service_role;
alter table public.kc_club_objekt_anlagen drop constraint if exists kc_club_objekt_anlagen_art_check;
alter table public.kc_club_objekt_anlagen add constraint kc_club_objekt_anlagen_art_check
  check (art = any (array['vorschlag','terminumfrage','terminanfrage','treffen','wunsch','aktentasche']));
