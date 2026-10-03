-- KC Club-App – Version 1.84.0
-- KC-CLUB-PROTOKOLL-NAECHSTER-TERMIN (Wunsch Hansi): „Nächster Termin“ unten im digitalen Protokoll (freier Text,
-- die App schlägt die nächste geplante Sitzung vor). Nur eine neue, leere Spalte – vorhandene Protokolle bleiben unverändert.
-- Rückweg: alter table kc_club_sitzungsprotokolle drop column naechster_termin;
alter table kc_club_sitzungsprotokolle add column if not exists naechster_termin text check (naechster_termin is null or char_length(naechster_termin) <= 200);
