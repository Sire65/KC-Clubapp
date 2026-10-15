-- KC Club-App – Version 2.418.0 (KICC-F-100, Wunsch Hansi): Erstattung bei Sondereinsätzen
-- Neue Positionsarten (parken, kraftstoff, kaution) und je Position beleg_status (foto/papier/erhalten/kein), kaution_status,
-- special_event_id – alles in der vorhandenen jsonb-Spalte positionen (keine Schemaänderung nötig).
-- Neu: Vorschuss vom Club je Antrag (Auszahlung = Summe − Vorschuss; negativ = Rückzahlung an den Club).
-- Rückweg: alter table kc_club_erstattung drop column vorschuss;
alter table public.kc_club_erstattung add column if not exists vorschuss numeric(10,2) not null default 0 check (vorschuss >= 0 and vorschuss <= 5000);
create index if not exists kc_club_erstattung_positionen_gin on public.kc_club_erstattung using gin (positionen jsonb_path_ops);
