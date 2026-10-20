-- 2.527.0 KC-CLUB-VORSCHLAG-SPAETER (20.10.2026, Wunsch Hansi „bei Vorschlägen: jetziges Datum oder nächste oder übernächste Sitzung – Datum noch
-- nicht bekannt –, aber schon mal vorwählen“): ein Vorschlag merkt sich „die K-te Sitzung ab dem Zeitpunkt der Wahl“ (sitzung_nr 1–3, sitzung_ab),
-- solange die Sitzung noch nicht angelegt ist. Der Server ordnet ihn zu (treffen_id), sobald es die Sitzung gibt, und leert sitzung_nr.
-- Rückweg: alter table public.kc_club_vorschlaege drop column sitzung_ab, drop column sitzung_nr;
alter table public.kc_club_vorschlaege add column if not exists sitzung_nr smallint check (sitzung_nr is null or sitzung_nr between 1 and 3);
alter table public.kc_club_vorschlaege add column if not exists sitzung_ab timestamptz;
