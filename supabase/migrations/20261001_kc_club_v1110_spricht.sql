-- KC Club-App – Version 1.11.0
-- KC-CLUB-SPRICHT (Wunsch Hansi 01.10.2026): Wer gerade eine Sprachnachricht aufnimmt, wird wie „schreibt …“ angezeigt
-- („🎤 Klaus nimmt eine Sprachnachricht auf“ mit Oszilloskop-Welle). Die flüchtige Tabelle kc_club_tippen bekommt dafür
-- die Art des Eintrags. Rein additiv, Standard 'text' = bisheriges Verhalten.
-- Rückweg: alter table kc_club_tippen drop column art;

alter table kc_club_tippen add column if not exists art text not null default 'text';
alter table kc_club_tippen drop constraint if exists kc_club_tippen_art_check;
alter table kc_club_tippen add constraint kc_club_tippen_art_check check (art in ('text', 'sprache'));
