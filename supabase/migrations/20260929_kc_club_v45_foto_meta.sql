-- KC Club-App – Version 0.45.0
-- KC-CLUB-FOTO-META: Aufnahmedaten (EXIF: Zeitpunkt, Kamera, Belichtung, Bildgröße, GPS nur wenn beim Hochladen erlaubt)
-- werden in der App aus dem Original gelesen, bevor das Foto verkleinert wird (Verkleinern entfernt EXIF).
-- Der Ortsname wird bei der ersten Ansicht ermittelt und hier gemerkt.
alter table kc_club_fotos add column if not exists meta jsonb;
