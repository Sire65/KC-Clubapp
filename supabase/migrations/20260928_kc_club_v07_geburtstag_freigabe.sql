-- KC Club-App – Version 0.7.0
-- Feature KC-CLUB-GEBURTSTAG-FREIGABE: Jedes Mitglied entscheidet selbst, ob sein Geburtstag (nur Tag/Monat,
-- ohne Jahr) für andere im Kalender, in der Terminliste und unter „Heute wichtig“ erscheint. Standard: aus.
alter table kc_club_freigaben drop constraint if exists kc_club_freigaben_bereich_check;
alter table kc_club_freigaben add constraint kc_club_freigaben_bereich_check check (bereich in ('dienstzeiten','geburtstag'));
