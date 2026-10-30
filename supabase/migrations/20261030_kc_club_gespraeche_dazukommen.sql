-- KC-CLUB-GESPRAECHE (Stufe 1 Telefonate, Wunsch Hansi 30.10.2026 „sehen, wer gerade mit wem spricht, anklopfen – die anderen nehmen mich auf“):
-- Anklopfen bei einem laufenden Telefonat = je Beteiligtem eine Zeile in kc_club_anklopfen mit art 'dazukommen' und dem Anruf-Bein (anruf_id).
-- Keine neue Tabelle → keine neuen Rechte; der vorhandene Realtime-Auslöser meldet die Zeilen wie jedes Anklopfen sofort.
-- Der Server kommt auch ohne die Spalte zurecht (dann geht nur das Dazukommen nicht; normales Anklopfen bleibt unverändert).
-- Rückweg: alter table public.kc_club_anklopfen drop column anruf_id; delete from public.kc_club_anklopfen where art = 'dazukommen';
--          alter table public.kc_club_anklopfen drop constraint kc_club_anklopfen_art_check;
--          alter table public.kc_club_anklopfen add constraint kc_club_anklopfen_art_check check (art is null or art in ('schreiben', 'sprechen'));
alter table public.kc_club_anklopfen add column if not exists anruf_id uuid;
alter table public.kc_club_anklopfen drop constraint if exists kc_club_anklopfen_art_check;
alter table public.kc_club_anklopfen add constraint kc_club_anklopfen_art_check check (art is null or art in ('schreiben', 'sprechen', 'dazukommen'));
