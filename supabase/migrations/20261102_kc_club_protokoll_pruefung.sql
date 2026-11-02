-- 2.818.0 KC-CLUB-PROTOKOLL-PRUEFUNG (Wunsch #57 Hansi): Prüfung durch den Schriftführer vor dem Veröffentlichen.
-- Eine Spalte: { stand: bei_pruefer|aenderung|freigegeben|geaendert, pruefer, von, runde, gesendet_am, gesendet, vorher, wuensche[], verlauf[], ohne_freigabe }.
-- Rückweg: alter table public.kc_club_sitzungsprotokolle drop column pruefung;
alter table public.kc_club_sitzungsprotokolle add column if not exists pruefung jsonb;
