-- KC Club-App – Version 2.22.11 (Wunsch Hansi)
-- KC-CLUB-PINNWAND-ANTWORTKNOPF: Wer einen Zettel anheftet, entscheidet, ob der Knopf „✍️ Antworten“ darauf erscheint.
--   Standard true = wie bisher (alte Zettel behalten ihren Knopf).
-- Rückweg: alter table kc_club_pinnwand drop column antworten;
alter table kc_club_pinnwand add column if not exists antworten boolean not null default true;
