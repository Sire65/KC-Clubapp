-- 2.583.0 KC-CLUB-ERSTATTUNG-CSV (Wunsch Hansi „wenn Erstattungen eingereicht werden, dass der Kassierer die als CSV erstellen kann und in seine
-- Excel-Tabelle übernehmen kann“): Merker, wann ein Antrag in eine CSV übernommen wurde – damit „Nur neue“ beim nächsten Mal nichts doppelt liefert.
-- Nur Merker, keine Geldbewegung. Rückweg: alter table kc_club_erstattung drop column exportiert_am, drop column exportiert_von;
alter table public.kc_club_erstattung
  add column if not exists exportiert_am timestamptz,
  add column if not exists exportiert_von text;
