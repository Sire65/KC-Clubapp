-- KC-CLUB-SCHULUNG-NACHFRAGE (2.35.0) – Daten nachtragen (Angaben Hansi, 07.10.2026): Gerät + gezeigte Programme der bisherigen Schulungen.
-- Nur Felder, die noch leer bzw. im erwarteten Altstand sind – nichts anderes wird berührt.
-- Rückweg: update kc_besuche set programme = '{}', installiert_auf = '{}' where besuch_id in ('B-2026-001','B-2026-002','B-2026-003','B-2026-004','B-2026-005');
--          update kc_besuche set programme = '{}', installiert_auf = '{pc,handy}' where besuch_id = 'B-2026-006';
update kc_besuche set installiert_auf = '{tablet}', programme = '{bilderrechner}' where besuch_id = 'B-2026-001' and installiert_auf = '{}' and programme = '{}'; -- Klaus und Dieter
update kc_besuche set installiert_auf = '{leih}', programme = '{bilderrechner}' where besuch_id = 'B-2026-002' and installiert_auf = '{}' and programme = '{}'; -- Manfred, Leihgerät folgt
update kc_besuche set installiert_auf = '{tablet}', programme = '{bilderrechner}' where besuch_id = 'B-2026-003' and installiert_auf = '{}' and programme = '{}'; -- Marianne, ohne Club-App
update kc_besuche set installiert_auf = '{tablet}', programme = '{bilderrechner}' where besuch_id = 'B-2026-004' and installiert_auf = '{}' and programme = '{}'; -- Reinhilde
update kc_besuche set installiert_auf = '{tablet}', programme = '{bilderrechner,clubapp}' where besuch_id = 'B-2026-005' and installiert_auf = '{}' and programme = '{}'; -- Steven (Tablet), Willfried (nur Link)
update kc_besuche set installiert_auf = '{notebook,handy}', programme = '{bilderrechner,clubapp}' where besuch_id = 'B-2026-006' and installiert_auf = '{pc,handy}' and programme = '{}'; -- Ruth (Notebook), Karla
