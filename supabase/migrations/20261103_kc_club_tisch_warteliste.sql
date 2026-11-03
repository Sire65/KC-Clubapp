-- 2.830.0 KC-CLUB-WARTELISTE (Gesamtprüfung #44 Vorschlag A, Hansi „A, B, E“): Seminar ausgebucht → auf die Warteliste; wird ein Platz frei, rückt der
-- Erste (nach Zeitpunkt der Vormerkung) automatisch nach und bekommt Bescheid. Neuer Stand 'warte' in kc_club_tisch_teilnahme.zusage.
-- Rückweg: update kc_club_tisch_teilnahme set zusage = null where zusage = 'warte'; danach die alte Prüfung (ja/nein) wieder setzen.
alter table public.kc_club_tisch_teilnahme drop constraint if exists kc_club_tisch_teilnahme_zusage_check;
alter table public.kc_club_tisch_teilnahme add constraint kc_club_tisch_teilnahme_zusage_check check (zusage = any (array['ja'::text, 'nein'::text, 'warte'::text]));
