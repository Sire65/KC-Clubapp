-- 2.209.0 (Gesamtprüfung 5, Supabase-Sicherheitsberater „function_search_path_mutable“):
-- kc_club_norm nutzt nur pg_catalog-Funktionen (lower, translate, replace, coalesce) → fester Suchpfad, Verhalten unverändert.
-- Rückweg: alter function public.kc_club_norm(text) reset search_path;
alter function public.kc_club_norm(text) set search_path = pg_catalog;
