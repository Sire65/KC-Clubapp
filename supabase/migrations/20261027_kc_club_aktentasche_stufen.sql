-- 2.699.0 KC-CLUB-AKTENTASCHE-STUFEN (Hansi: „erst kommen die ganzen Unterlagen … danach muss alles in die Tasche – oder vorläufig gepackt“;
-- Antwort „A“ = neue Unterlagen automatisch in die Tasche, mit 🆕 markiert): Stufe „vorlaeufig“ und Merkliste herausgenommener Teile
-- (die kommen nicht automatisch wieder hinein). Rückweg: Spalte entfernt löschen, Prüfregel wieder ('offen','gepackt').
alter table public.kc_club_aktentasche add column if not exists entfernt jsonb not null default '[]'::jsonb;
alter table public.kc_club_aktentasche drop constraint if exists kc_club_aktentasche_status_check;
alter table public.kc_club_aktentasche add constraint kc_club_aktentasche_status_check check (status in ('offen','vorlaeufig','gepackt'));
