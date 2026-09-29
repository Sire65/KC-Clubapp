-- KC Club-App – Version 0.53.0
-- KC-CLUB-AUFGABEN-MEHRERE: Eine Aufgabe im Sitzungsprotokoll kann mehrere Verantwortliche haben. Jede Person bekommt ihre
-- eigene Zeile (eigenes Abhaken, eigene Benachrichtigung/Erinnerung wie bisher); die Zeilen teilen sich die Gruppe.
alter table kc_club_aufgaben add column if not exists gruppe uuid;
create index if not exists kc_club_aufgaben_gruppe_idx on kc_club_aufgaben (gruppe) where gruppe is not null;
