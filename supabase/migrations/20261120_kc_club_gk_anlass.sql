-- 2.991.0 KC-CLUB-KARTEN-BAUKASTEN (Wunschliste #98, Antwort Hansi 20.11.2026 „gemeinsame Karte auch für andere Anlässe“): Anlass der gemeinsamen Karte.
-- Nur additiv: bestehende Karten bleiben „genesung“. Kein Grund/keine Krankheit gespeichert.
-- Rückweg: alter table public.kc_club_gk_gemeinsam drop column if exists anlass;
alter table public.kc_club_gk_gemeinsam add column if not exists anlass text not null default 'genesung'
  check (anlass in ('genesung', 'geburtstag', 'glueckwunsch', 'danke', 'hochzeit', 'geburt', 'beileid'));
