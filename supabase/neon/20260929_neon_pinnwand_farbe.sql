-- KC-CLUB-PINNWAND-FARBEN (0.60.0): Spiegelspalte für die feste Post-it-Farbe (nur hinzufügen, angewendet 2026-09-29)
alter table public.kc_club_pinnwand add column if not exists farbe smallint;
