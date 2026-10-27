-- KC-CLUB-ANMELDESCHLUSS (Wunsch Hansi 27.10.2026 „Anmeldeschluss für Vorschläge bis 17 Uhr am Vorabend; danach auf nächste Sitzung oder
-- Häkchen dringend – Clubsprecher, Kassenwart und Admin entscheiden: dringender TOP oder ablehnen und auf die nächste Sitzung“):
-- dringend = { stand: 'offen'|'aufgenommen'|'abgelehnt', am, von (wer entschieden hat), entschieden_am, fuer (Sitzung, für die es dringend war) }
alter table public.kc_club_vorschlaege add column if not exists dringend jsonb;
create index if not exists kc_club_vorschlaege_dringend_offen on public.kc_club_vorschlaege ((dringend->>'stand')) where status = 'offen' and dringend is not null;
