-- KC-CLUB-TA-PROTOKOLL (13.11.2026, Wunsch Hansi „Heute gab es einen Termin mit Klaus und mir mit Tagesordnung – wie wird daraus ein Protokoll?“ – „Ja bauen“)
-- Protokoll einer Besprechung aus einer Terminanfrage: je TOP Ergebnis, „Wer?“, „Bis wann?“, dazu Anwesend, Sonstiges, nächster Termin.
-- Eine Spalte an der bestehenden Tabelle (RLS und Rechte wie bisher: nur der Club-Server liest/schreibt). Sehen dürfen nur Anfragende und Angefragte.
-- Rückweg: alter table public.kc_club_terminanfragen drop column protokoll;
alter table public.kc_club_terminanfragen add column if not exists protokoll jsonb;
comment on column public.kc_club_terminanfragen.protokoll is 'Besprechungs-Protokoll (KC-CLUB-TA-PROTOKOLL): {anwesend, tops:[{t,ergebnis,wer,bis}], sonstiges, naechster, status entwurf|gesendet, gesendet_am, stand}';
