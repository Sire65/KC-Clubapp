-- 2.814.0 KC-CLUB-PINNWAND-ADMIN-MEHR (Wunsch Hansi 02.11.2026 „Gib mir als Admin mehr als 4 Zettel an der Pinnwand“):
-- Farben 1–8 erlaubt (Admin bis 8 Zettel, je Person jede Farbe einmal – Index kc_club_pinnwand_farbe_frei bleibt). Mitglieder weiter 1–4 (Server).
-- Rückweg: Zettel mit farbe > 4 abnehmen, dann check (farbe between 1 and 4).
alter table public.kc_club_pinnwand drop constraint if exists kc_club_pinnwand_farbe_check;
alter table public.kc_club_pinnwand add constraint kc_club_pinnwand_farbe_check check (farbe between 1 and 8);
