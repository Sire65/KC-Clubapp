-- 2.647.0 KC-CLUB-ANKLOPFEN-ART (Wunsch Hansi 25.10.: „wenn jemand anklopfen will, soll er gefragt werden: Textnachrichten austauschen oder sprechen –
-- dann bekomme ich den Hinweis ‚X will mit dir schreiben‘ oder ‚will mit dir sprechen‘“).
-- Neue Spalte art an der bestehenden Tabelle (keine neue Tabelle → keine neuen Rechte nötig). null = schreiben wie bisher (alte Apps, alte Zeilen).
-- Der Server kommt auch ohne die Spalte zurecht (liest select * und legt ohne art an, falls die Spalte fehlt).
-- Rückweg: alter table public.kc_club_anklopfen drop column art;
alter table public.kc_club_anklopfen add column if not exists art text;
alter table public.kc_club_anklopfen drop constraint if exists kc_club_anklopfen_art_check;
alter table public.kc_club_anklopfen add constraint kc_club_anklopfen_art_check check (art is null or art in ('schreiben', 'sprechen'));
