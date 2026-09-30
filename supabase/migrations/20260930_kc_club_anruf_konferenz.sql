-- KC-CLUB-KONFERENZ (0.82.0, Wunsch Hansi): Konferenz zu dritt (bis 4), zuerst nur Ton.
-- Jede Verbindung zwischen zwei Teilnehmern bleibt eine Zeile in kc_club_anruf („Bein“); gleiche konferenz_id = gleiche Konferenz.
--   konferenz_id  gemeinsame Kennung aller Beine einer Konferenz (null = normaler Zweier-Anruf)
--   automatisch   Querverbindung zwischen Teilnehmern, die die Apps selbst aufbauen – klingelt nicht, erscheint nicht als verpasst
-- Nur neue Spalten mit Standardwert – bestehende Anrufe bleiben unverändert. Neon-Spiegel: siehe 20260930_kc_club_anruf_kurzantwort.sql.
alter table public.kc_club_anruf add column if not exists konferenz_id uuid;
alter table public.kc_club_anruf add column if not exists automatisch boolean not null default false;
create index if not exists kc_club_anruf_konferenz_idx on public.kc_club_anruf (konferenz_id) where konferenz_id is not null;
