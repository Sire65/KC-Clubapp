-- KC Club-App – Version 2.23.44
-- KC-CLUB-HILFE-KANAELE (Wunsch Hansi): Beim Einstellen eines Hilfe-Aufrufs oder -Angebots wählt man, wie es veröffentlicht wird –
--   📌 Pinnwand (grüner Aushang, antippbar), 🔔 Push, ✉️ E-Mail (mehrere möglich). Gespeichert als kanaele; null = wie bisher
--   (Aufruf hängt an der Pinnwand und geht nach den Benachrichtigungs-Einstellungen raus, Angebot nur als Kachel).
-- Nur Spalten + Prüfregeln ergänzt; vorhandene Daten bleiben unverändert. Zugriff weiter nur über die Edge Function.
-- Rückweg: drop constraint …_kanaele_check; alter table … drop column kanaele (beide Tabellen).
alter table kc_club_hilfe_aufrufe add column if not exists kanaele text[];
alter table kc_club_hilfe_angebote add column if not exists kanaele text[];
alter table kc_club_hilfe_aufrufe drop constraint if exists kc_club_hilfe_aufrufe_kanaele_check;
alter table kc_club_hilfe_angebote drop constraint if exists kc_club_hilfe_angebote_kanaele_check;
alter table kc_club_hilfe_aufrufe add constraint kc_club_hilfe_aufrufe_kanaele_check check (kanaele is null or kanaele <@ array['pinnwand', 'push', 'email']::text[]);
alter table kc_club_hilfe_angebote add constraint kc_club_hilfe_angebote_kanaele_check check (kanaele is null or kanaele <@ array['pinnwand', 'push', 'email']::text[]);
