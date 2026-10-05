-- KC Club-App – Version 2.23.57
-- KC-CLUB-ANFRAGE-VORBEHALT (Wunsch Hansi): Wer angefragt hat, kann einen Gegenvorschlag „🤔 unter Vorbehalt“ annehmen – mit kurzem
--   Text (z. B. „falls ich rechtzeitig von der Arbeit wegkomme“). Der Vorbehalt steht danach bei der Anfrage für alle Beteiligten.
-- Nur eine Spalte ergänzt; vorhandene Daten bleiben unverändert. Zugriff weiter nur über die Edge Function.
-- Rückweg: alter table kc_club_terminanfragen drop column vorbehalt;
alter table kc_club_terminanfragen add column if not exists vorbehalt text;
alter table kc_club_terminanfragen drop constraint if exists kc_club_terminanfragen_vorbehalt_check;
alter table kc_club_terminanfragen add constraint kc_club_terminanfragen_vorbehalt_check check (vorbehalt is null or char_length(vorbehalt) between 1 and 300);
