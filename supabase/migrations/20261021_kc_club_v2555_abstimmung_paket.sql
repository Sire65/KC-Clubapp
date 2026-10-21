-- 2.555.0 KC-CLUB-ABSTIMMUNG-PAKET (21.10.2026, Wunsch Hansi „Abstimmung mit Überschrift – Technik, Bilderrechner, Abrechnung – und mehreren Fragen“):
-- eine Abstimmung mit Überschrift, Bereichen und mehreren Fragen. Jede Frage bleibt eine normale Abstimmung (Zeile art = 'abstimmung' mit eigenen
-- Antworten und Stimmen); zusammengehalten über paket = { id, titel, beschreibung, abschnitt, nr }. Ohne paket (null) alles wie bisher.
-- Rückweg: alter table public.kc_club_vorschlaege drop column if exists paket;
alter table public.kc_club_vorschlaege add column if not exists paket jsonb;
comment on column public.kc_club_vorschlaege.paket is 'KC-CLUB-ABSTIMMUNG-PAKET: Abstimmung mit mehreren Fragen – { id, titel, beschreibung, abschnitt, nr }; null = einzelne Frage.';
