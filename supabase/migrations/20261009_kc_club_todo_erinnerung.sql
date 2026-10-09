-- KC-CLUB-TODO-ERINNERUNG (2.132.0, Wunsch Hansi): automatische Erinnerung an To-do-Fristen – 5 Tage vorher und am Tag morgens (Push + E-Mail).
-- Merkspalten: für welche Frist (Datum) schon erinnert wurde. Ändert sich die Frist, passt der Wert nicht mehr → es wird neu erinnert.
-- Nur neue, leere Spalten – keine Daten ändern sich. Rückweg: alter table public.kc_club_todo drop column erinnert_vorher, drop column erinnert_heute;
alter table public.kc_club_todo add column if not exists erinnert_vorher date;
alter table public.kc_club_todo add column if not exists erinnert_heute date;
create index if not exists kc_club_todo_offen_faellig_idx on public.kc_club_todo (faellig) where erledigt_am is null and entfernt_am is null and faellig is not null;
