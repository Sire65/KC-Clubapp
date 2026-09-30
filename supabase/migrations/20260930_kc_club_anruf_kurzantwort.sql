-- KC-CLUB-ANRUF-KURZANTWORT / KC-CLUB-ANRUF-VERPASST (0.81.0, Wunsch Hansi)
-- Nur neue, leere Spalten – bestehende Anrufe bleiben unverändert.
--   kurzantwort          Text, den der Angerufene beim Ablehnen an den Anrufer schickt („Ich melde mich gleich“ …)
--   verpasst_gesehen_am  wann der Angerufene den Hinweis „Verpasster Anruf“ gesehen/weggeklickt hat
-- Neon-Spiegel: jsonb_populate_recordset übernimmt nur vorhandene Spalten – die neuen Spalten stören den Spiegel nicht.
alter table public.kc_club_anruf add column if not exists kurzantwort text;
alter table public.kc_club_anruf add column if not exists verpasst_gesehen_am timestamptz;
alter table public.kc_club_anruf drop constraint if exists kc_club_anruf_kurzantwort_laenge;
alter table public.kc_club_anruf add constraint kc_club_anruf_kurzantwort_laenge check (kurzantwort is null or char_length(kurzantwort) <= 200);
