-- KC Core Backup: zwei PC-Manager-Tabellen vorerst NICHT im Tages-Backup – 29.09.2026
-- Befund Restore-Lesetest des ersten Voll-Backups (188 Tabellen): 186 ok, 2 Prüfsummen-Fehler.
-- Ursache: in Neon andere Spaltenreihenfolge als in Supabase (Spalten dort nachträglich angefügt). Der Spiegel-Worker
-- nutzt dafür die reihenfolge-unabhängige Prüfsumme (stable_row_hash_v1), Backup-/Verify-Worker kennen sie nur für
-- kc_communication_templates und kc_dp_entity_versions. Bis zum Neuaufbau der zwei Neon-Spiegeltabellen in
-- Supabase-Reihenfolge (braucht Admin-Freigabe, weil in Neon gelöscht/neu angelegt wird) bleibt der bisherige Stand:
-- gespiegelt ja, Tages-Backup nein (sie waren auch in der alten festen 36er-Liste nicht enthalten).
update public.kc_db_mirror_table_rules
   set backup_enabled = false, updated_at = now(),
       note = note || ' | Backup vorerst aus: Neon-Spaltenreihenfolge ≠ Supabase (Restore-Test 29.09.), Neuaufbau nach Freigabe'
 where table_name in ('kc_manager_serving_materials', 'kc_manager_recipe_serving_materials') and backup_enabled;
insert into public.kc_db_mirror_audit(severity,action,detail,metadata)
values ('warning','backup_rule_changed','2 PC-Manager-Tabellen vorerst ohne Tages-Backup (Spaltenreihenfolge Neon ≠ Supabase)',
        jsonb_build_object('tables', jsonb_build_array('kc_manager_serving_materials','kc_manager_recipe_serving_materials'),
                           'restore_test_backup_set','b51b999d-a1ff-48eb-bda3-6de634b786fb','checked',188,'failed',2));

-- Restore-Lesetest nach dem Tages-Backup fest einplanen: der Auslöser im Backup-Worker greift seit dem Neustart nicht
-- (Backup-Sätze 29.09. 16:23 und 17:58 blieben „ok“ ohne Prüfung). 00:15 = 3 Min. nach dem Backup (00:12),
-- Neon ist dann noch wach → keine zusätzliche Rechenzeit. Prüft den zuletzt ausgelösten Satz (kc_db_backup_verify_latest).
select cron.schedule('kc-neon-backup-verify', '15 0 * * *', 'select public.kc_db_backup_verify_latest();');

-- Nachtrag 29.09.2026 (Freigabe Hansi): Neon-Tabellen neu aufgebaut (supabase/neon/20260929_neon_pcmanager_spaltenreihenfolge.sql),
-- Prüfsummen identisch → wieder im Tages-Backup; Restore-Lesetest 188/188 ok.
update public.kc_db_mirror_table_rules
   set backup_enabled = true, updated_at = now(),
       note = replace(note, ' | Backup vorerst aus: Neon-Spaltenreihenfolge ≠ Supabase (Restore-Test 29.09.), Neuaufbau nach Freigabe', ' | Neon-Tabelle 29.09. in Supabase-Reihenfolge neu aufgebaut (Freigabe Hansi) – wieder im Backup')
 where table_name in ('kc_manager_serving_materials', 'kc_manager_recipe_serving_materials');
