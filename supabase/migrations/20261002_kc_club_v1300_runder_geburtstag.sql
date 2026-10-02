-- KC Club-App – Version 1.30.0 (Wunsch Hansi 02.10.2026: „Ja, bau den Schalter für runde Geburtstage ein“)
-- KC-CLUB-RUNDER-GEBURTSTAG: freiwillige Freigabe je Mitglied – „Runde Geburtstage darf die Clubleitung sehen (mit Alter)“.
-- Ohne diese Freigabe zeigt die App weiterhin nie das Geburtsjahr. Rein additiv (neuer erlaubter Bereich).
-- Rückweg: Zeilen mit bereich 'runder_geburtstag' löschen und den Check auf die bisherige Liste zurücksetzen.
alter table kc_club_freigaben drop constraint if exists kc_club_freigaben_bereich_check;
alter table kc_club_freigaben add constraint kc_club_freigaben_bereich_check check (bereich in
  ('dienstzeiten', 'geburtstag', 'kontakt_handy', 'kontakt_festnetz', 'kontakt_mail', 'kontakt_adresse', 'runder_geburtstag'));
