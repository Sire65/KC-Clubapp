-- KC-NEON-PRUEFUNG (26.10.2026, Freigabe Hansi „Setze A um“): Dienstplan-Arbeitsstände nicht mehr in der täglichen Neon-Sicherung.
-- Grund: die Tabelle (28 verschlüsselte Stände, einmalig übernommen am 23.10.) wird unverändert jede Nacht als volle Kopie (18 MB) abgelegt;
-- bei bis zu 14 aufbewahrten Sätzen läge der Spiegel bei ca. 830 MB von 1 GB. Ohne sie ca. 560 MB.
-- Die Tabelle bleibt gespiegelt (Neon), in der Frankfurt-Sicherung (alle Tabellen, 14 Tage) und im B2-Backup. Sicherung und Wiederherstellungs-Test
-- lesen die Liste aus kc_db_mirror_table_rules – beide zählen danach eine Tabelle weniger. Schon in Supabase eingetragen (execute_sql), hier nur festgehalten.
-- Rückweg: update public.kc_db_mirror_table_rules set backup_enabled = true where table_name = 'kc_dp_workspace_revisions';
update public.kc_db_mirror_table_rules set backup_enabled = false,
  note = note || ' · 26.10.2026 Freigabe Hansi (Weg A, KC-NEON-PRUEFUNG): nicht mehr in der täglichen Neon-Sicherung (je Satz 18 MB, Tabelle unverändert seit 23.10.) – bleibt im Spiegel, in der Frankfurt-Sicherung (14 Tage) und im B2-Backup',
  updated_at = now()
 where table_name = 'kc_dp_workspace_revisions' and backup_enabled;
