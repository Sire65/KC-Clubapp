-- KC Club-App – Version 1.8.0
-- KC-CLUB-ANKLOPFEN-ANTWORT (Wunsch Hansi 01.10.2026): Wer angeklopft wird, kann statt „Annehmen“ eine Kurzantwort-Kachel
-- tippen („⏳ Bin gerade beschäftigt“, „🔁 Melde mich später“ …). Das beendet das Anklopfen sofort (status 'spaeter'),
-- der Anklopfende sieht den Text. Die Texte kommen aus der Server-Registry KLOPF_ANTWORTEN (kein Freitext).
-- Rein additiv; der Spiegel-Arbeiter legt die Neon-Spalte selbst an (KC-SPIEGEL-AUTO).
-- Rückweg: alter table kc_club_anklopfen drop column antwort;

alter table kc_club_anklopfen add column if not exists antwort text;
alter table kc_club_anklopfen drop constraint if exists kc_club_anklopfen_antwort_laenge;
alter table kc_club_anklopfen add constraint kc_club_anklopfen_antwort_laenge check (antwort is null or char_length(antwort) <= 80);
