-- KC Core Spiegel: Messwert-Tabelle kc_communication_health_snapshots bewusst NICHT spiegeln – 29.09.2026
-- Befund beim ersten Lauf KC-SPIEGEL-ALLE: kc_db_mirror_snapshot braucht für 10.141 Zeilen / 11 MB bereits 7,5 s;
-- der Worker liest über PostgREST (statement_timeout 8 s) → bricht ab bzw. wird bei jedem Wachstum sicher scheitern.
-- Inhalt: laufend neu erzeugte Zustellungs-Messwerte (Gesundheitsverlauf), kein Stammdatenbestand.
-- Wie kc_system_check_history: Regel vorhanden (Abdeckung vollständig), Spiegel/Backup aus, Begründung in note.
-- Rückweg: mirror_enabled=true setzen und in kc_neon_resume_tables eintragen (Neon-Tabelle existiert).
update public.kc_db_mirror_table_rules
   set mirror_enabled = false, backup_enabled = false, updated_at = now(),
       note = 'KC-SPIEGEL-ALLE: bewusst nicht gespiegelt – Messwerte 11 MB/10.000+ Zeilen, Auslesen 7,5 s > 8-s-Grenze des Workers; wird laufend neu erzeugt'
 where table_name = 'kc_communication_health_snapshots';
delete from public.kc_neon_resume_tables where table_name = 'kc_communication_health_snapshots';
insert into public.kc_db_mirror_audit(severity,action,detail,metadata)
values ('info','mirror_rule_changed','kc_communication_health_snapshots: bewusst nicht gespiegelt (Auslesen 7,5 s > 8 s Worker-Grenze)',
        jsonb_build_object('table','kc_communication_health_snapshots','rows',10141,'payload_bytes',11083830,'snapshot_ms',7547));
