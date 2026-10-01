-- KC Club-App – Version 1.16.0
-- Sicherheits-Check: kc_club_sicherheit_status sucht den letzten Lauf je Art – Index macht das unabhängig von der Tabellengröße.
-- Rein additiv. Rückweg: drop index if exists kc_db_mirror_runs_art_status_ende;
create index if not exists kc_db_mirror_runs_art_status_ende on public.kc_db_mirror_runs (run_type, status, finished_at desc);
