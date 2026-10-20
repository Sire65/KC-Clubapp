-- KC-CLUB-RC-NACHTRAG (20.10.2026, zu KC-CLUB-RC-DATENBANK, Freigabe Hansi „1 bis 4“):
-- 1) Eltern-Tabelle auch in die Liste der zu spiegelnden Tabellen – ohne diesen Eintrag nimmt kc_db_mirror_pakete_vorbereiten sie nicht mit
--    (am 20.10. um 06:34 UTC schon direkt eingetragen; hier für den Verlauf, wiederholbar).
insert into public.kc_neon_resume_tables (table_name) values ('kc_club_eltern') on conflict (table_name) do nothing;
-- 2) Schreibende Verwaltungs-Funktionen: das Recht kam über PUBLIC (nicht über anon) – darum dort entziehen und nur
--    angemeldeten Nutzern und dem Server geben. Sie laufen als INVOKER, RLS greift ohnehin. Rückweg: grant execute … to public;
do $$ declare f text; begin
  foreach f in array array[
    'public.kc_manager_create_inventory_event(text, text, text, text, date, text)',
    'public.kc_manager_inventory_save_count(jsonb)',
    'public.kc_manager_inventory_save_disposition(jsonb)',
    'public.kc_manager_save_article_supplier_link(jsonb)',
    'public.kc_manager_save_recipe(jsonb, jsonb)',
    'public.kc_manager_upsert_inventory_count(uuid, uuid, text, text, text, numeric, text, numeric, text, numeric, numeric, numeric, text, date, text, text, text)',
    'public.kc_core_takt_setzen(text, text)'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end $$;
