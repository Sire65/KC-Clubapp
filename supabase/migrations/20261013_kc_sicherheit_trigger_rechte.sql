-- KC-SICHERHEIT-2026-10-13 (Sicherheits-Abgleich, Wunsch Hansi): interne Trigger-Funktion nicht von außen aufrufbar.
-- public.kc_wm_umfrage_instant_notify() ist eine Trigger-Funktion (security definer). Sie läuft nur als Trigger; ein direkter
-- Aufruf über die Datenschnittstelle ist weder nötig noch erwünscht (Supabase-Prüfer: anon_security_definer_function_executable).
-- Trigger feuern unabhängig vom EXECUTE-Recht des Aufrufers weiter – am Verhalten ändert sich nichts.
-- Rückweg: grant execute on function public.kc_wm_umfrage_instant_notify() to anon, authenticated;
revoke all on function public.kc_wm_umfrage_instant_notify() from public, anon, authenticated;
grant execute on function public.kc_wm_umfrage_instant_notify() to service_role;
