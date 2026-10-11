-- Club-App 2.242.0 – KC-CLUB-PRIVAT-STARTSEITE (Wunsch Hansi 11.10.2026): beim privaten Termin ein Häkchen „Auf der Startseite“ –
-- dann läuft der Termin oben im Countdown (Fallblatt-Uhr) mit. Nur ein Merker am eigenen Termin, Standard aus.
alter table public.kc_club_privattermine add column if not exists startseite boolean not null default false;
