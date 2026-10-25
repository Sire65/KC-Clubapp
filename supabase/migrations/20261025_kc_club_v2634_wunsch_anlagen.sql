-- 2.634.0 KC-CLUB-WUNSCH-ANLAGEN (Wunschliste #34, Hansi „Anlagen dazu packen wie Fotos, Datei, Bilder“):
-- Wünsche an Claude bekommen Anlagen (gleicher Baustein wie Vorschlag/Terminfindung: kc_club_objekt_anlagen, art = 'wunsch').
-- anlagen_kopie: Kopie der Anlagen (Base64, je höchstens 1,5 MB) direkt an der Zeile, damit Claude sie in der Datenbank lesen kann.
-- Rückweg: alter table public.kc_club_wunschliste drop column anlagen_kopie; delete from public.kc_club_objekt_anlagen where art = 'wunsch';
--          Check wieder auf ('vorschlag','terminumfrage','terminanfrage','treffen').
alter table public.kc_club_objekt_anlagen drop constraint if exists kc_club_objekt_anlagen_art_check;
alter table public.kc_club_objekt_anlagen add constraint kc_club_objekt_anlagen_art_check check (art in ('vorschlag', 'terminumfrage', 'terminanfrage', 'treffen', 'wunsch'));
alter table public.kc_club_wunschliste add column if not exists anlagen_kopie jsonb;
comment on column public.kc_club_wunschliste.anlagen_kopie is '2.634.0: Kopie der Anlagen [{name,mime,b64}] zum Lesen für Claude (nur Admin-Wunschliste)';
