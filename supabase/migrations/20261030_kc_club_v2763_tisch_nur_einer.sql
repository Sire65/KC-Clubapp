-- KC-CLUB-RUNDER-TISCH-ZEITCHECK (Server/App 2.763.0, 30.10.2026, Wunsch Hansi „um die Datenbank-Ressourcen zu schonen, keine parallelen Runden Tische –
-- immer nur einer“). Der Club-Server prüft vorher und nennt den Grund; diese Sperre ist die letzte Sicherung, wenn zwei gleichzeitig einladen
-- oder verlängern: zwei geplante Tische (alle Arten, alle Gruppen) dürfen sich zeitlich nicht überschneiden. Angrenzend (Ende = Beginn) geht.
-- Abgesagte Tische zählen nicht; ein früher geschlossener Tisch gibt seine Restzeit frei (ende wird beim Schließen auf „jetzt“ gesetzt).
-- Rückweg: alter table public.kc_club_tisch drop constraint kc_club_tisch_nur_einer;
alter table public.kc_club_tisch drop constraint if exists kc_club_tisch_nur_einer;
alter table public.kc_club_tisch add constraint kc_club_tisch_nur_einer
  exclude using gist (tstzrange(beginn, ende, '[)') with &&) where (status = 'geplant');
