-- KC Club-App – Version 0.9.0 (Nachtrag)
-- KC-CLUB-AUFGABEN: merkt, wann die zuständige Person über ihre Aufgabe informiert wurde
-- (Aufgaben aus einem Protokoll-Entwurf werden erst beim Veröffentlichen mitgeteilt).
alter table kc_club_aufgaben add column if not exists mitgeteilt_am timestamptz;
