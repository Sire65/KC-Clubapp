-- KC Club-App – Version 2.23.79
-- KC-CLUB-PERSON-SPERRE Stufe 2 (Wunsch Hansi): Sperre „bis Uhrzeit“ – danach gilt sie automatisch nicht mehr (null = bis der Admin freigibt).
-- Nur eine neue, leere Spalte; bestehende Sperren bleiben „bis Freigabe“.
-- Rückweg: alter table kc_club_person_sperre drop column bis;
alter table public.kc_club_person_sperre add column if not exists bis timestamptz;
