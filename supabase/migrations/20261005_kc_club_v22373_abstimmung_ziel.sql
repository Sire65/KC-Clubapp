-- KC Club-App – Version 2.23.73
-- KC-CLUB-ABSTIMMUNG-ZIEL (Wunsch Hansi): Abstimmung an alle, eine Gruppe oder eine Auswahl.
-- ziel_ids leer/null = alle aktiven Mitglieder (wie bisher). ziel_text = Anzeige („Gruppe Vorstand“ / „5 ausgewählte Mitglieder“).
-- Nur neue, leere Spalten; vorhandene Abstimmungen bleiben „an alle“.
-- Rückweg: alter table kc_club_vorschlaege drop column ziel_ids, drop column ziel_text;
alter table public.kc_club_vorschlaege add column if not exists ziel_ids text[];
alter table public.kc_club_vorschlaege add column if not exists ziel_text text;
