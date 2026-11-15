-- KC-CLUB-GEGENVORSCHLAG (Wunschliste #93, Hansi 15.11.2026: „Gegenvorschlag einreichen … zum gleichen Thema, damit die Mitglieder über 2 Vorschläge abstimmen“ –
-- bis zu 3 (A, B, C), jedes Mitglied darf, keine Push an Unterstützer, Knopf „Gegenvorschlag“).
-- Eine Spalte an der bestehenden Tabelle (RLS und Rechte wie bisher: nur der Club-Server liest/schreibt): gegen_zu = erster Vorschlag der Gruppe.
-- Rückweg: drop index if exists public.kc_club_vorschlaege_gegen_zu_idx; alter table public.kc_club_vorschlaege drop column gegen_zu;
alter table public.kc_club_vorschlaege add column if not exists gegen_zu uuid references public.kc_club_vorschlaege(id) on delete set null;
create index if not exists kc_club_vorschlaege_gegen_zu_idx on public.kc_club_vorschlaege (gegen_zu) where gegen_zu is not null;
comment on column public.kc_club_vorschlaege.gegen_zu is 'Gegenvorschlag (KC-CLUB-GEGENVORSCHLAG): id des ersten Vorschlags der Gruppe (A); B und C zeigen darauf. Jedes Mitglied unterstützt höchstens einen der Gruppe.';
