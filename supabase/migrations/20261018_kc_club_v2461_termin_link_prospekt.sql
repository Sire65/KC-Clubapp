-- KC-CLUB-TERMIN-LINK-PROSPEKT (2.461.0, Wunschliste #20, Wunsch Hansi „Jedes Jahr macht die Freilichtbühne Werne einen Adventsmarkt. Der Termin soll
-- im Clubterminplan stehen, oben in der Laufschrift angezeigt werden und einen Link auf deren Seite oder z. B. einen Prospekt anzeigen“).
-- Clubtermine bekommen: link (nur https, Webseite des Veranstalters), im_laufband (Ankündigung im Info-Laufband der Startseite, ab 21 Tagen vorher)
-- und Anlagen (Prospekt als Foto/PDF) über die vorhandenen Objekt-Anlagen (art 'treffen').
-- Rückweg: alter table public.kc_club_treffen drop column link, drop column im_laufband;
--          Check von kc_club_objekt_anlagen wieder auf ('vorschlag','terminumfrage','terminanfrage') (vorher art='treffen'-Zeilen löschen).
alter table public.kc_club_treffen add column if not exists link text;
alter table public.kc_club_treffen drop constraint if exists kc_club_treffen_link_check;
alter table public.kc_club_treffen add constraint kc_club_treffen_link_check check (link is null or (link ~ '^https://[^\s<>"]+$' and length(link) <= 500));
alter table public.kc_club_treffen add column if not exists im_laufband boolean not null default false;
alter table public.kc_club_objekt_anlagen drop constraint if exists kc_club_objekt_anlagen_art_check;
alter table public.kc_club_objekt_anlagen add constraint kc_club_objekt_anlagen_art_check check (art in ('vorschlag', 'terminumfrage', 'terminanfrage', 'treffen'));
