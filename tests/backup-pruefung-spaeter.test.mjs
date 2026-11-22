// KC-BACKUP-PRUEFUNG-SPAETER (22.11.2026, Hansi „Ja ändern“): Der Restore-Test lief sofort nach der Nachtsicherung (~00:52/01:02 UTC)
// und war rot, wenn eine Tabelle neue Spalten hatte, die der Neon-Spiegel erst um ~04:1x UTC nachträgt (20.–22.11.; dieselbe Sicherung
// bestand um 06:30). Jetzt prüft nur noch Job 51 kc-neon-backup-verify um 06:30 UTC; der Prüfdienst setzt den Kopf in kc_backup_sets.
// Aufruf: node tests/backup-pruefung-spaeter.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const w = lies("supabase/functions/kc-db-backup-worker/index.ts"), v = lies("supabase/functions/kc-db-backup-verify-v2/index.ts");

// Worker: ruft den Prüfdienst nicht mehr auf, Kopf bleibt "running", nur Zählwerte werden nachgeführt
assert.ok(!/kc-db-backup-verify-v2/.test(w.replace(/^\/\/.*$/gm, "")), "Worker ruft den Prüfdienst nicht mehr sofort auf");
assert.ok(!/status=\$5,completed_at=now\(\)/.test(w), "Worker setzt den Kopf nicht mehr auf ok/error");
assert.ok(/const verifyTriggered=false;await neon\.unsafe\("update public\.kc_backup_sets set table_count=greatest\(table_count,\$1\),total_rows=greatest\(total_rows,\$2\),total_bytes=greatest\(total_bytes,\$3\) where backup_set=\$4::uuid and status='running'"/.test(w), "Worker führt nur die Zählwerte nach");
assert.ok(/verify_triggered:verifyTriggered/.test(w), "Antwortformat des Workers unverändert");
assert.ok(/"X-KC-Function-Version":"23"/.test(w), "Worker Version 23");

// Prüfdienst: setzt den Kopf selbst, nur ok/error, nur aus running/error, vor der Aufbewahrungsregel
const kopfUpdate = /update public\.kc_backup_sets set table_count=\$1,ok_count=\$2,total_rows=greatest\(total_rows,\$3\),total_bytes=greatest\(total_bytes,\$4\),status=\$5,completed_at=now\(\) where backup_set=\$6::uuid and status in \('running','error'\) returning status",\[[^\n]*bad\?"error":"ok",set\]/;
assert.ok(kopfUpdate.test(v), "Prüfdienst setzt den Kopf auf ok/error");
assert.ok(v.indexOf("update public.kc_backup_sets") < v.indexOf("kc_backup_retention_anwenden(true)"), "Kopf vor der Aufbewahrungsregel");
assert.ok(v.indexOf("update public.kc_backup_sets") > v.indexOf('run_type:"restore_test"'), "Kopf nach dem Prüfeintrag");
assert.ok(/\}catch\(e\)\{kopf=\{error:String\(e\)\.slice\(0,200\)\}\}/.test(v), "Fehler beim Kopf ändern das Prüfergebnis nicht");
assert.ok(!/status in \([^)]*'ok'[^)]*\) returning/.test(v), "ein schon geprüfter (ok) Satz wird nicht überschrieben");
assert.ok(/"X-KC-Function-Version":"13"/.test(v), "Prüfdienst Version 13");

// Zeitplan (live, nicht im Repo als Migration): Job 51 kc-neon-backup-verify '30 6 * * *' – nach FRA-Sicherung (1–3 UTC) und Neon-Spiegel (4:05–4:45 UTC).
console.log("backup-pruefung-spaeter: ok");
