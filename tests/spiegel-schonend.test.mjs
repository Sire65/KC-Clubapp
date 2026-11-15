// KC-SPIEGEL-SCHONEND (15.11.2026, Wunsch Hansi „App ist langsam – setze 1 bis 3 um, alles muss sicher bleiben und mit den anderen Zeiten abgeglichen sein“)
// Aufruf: node tests/spiegel-schonend.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const mig = lies("supabase/migrations/20261115_kc_spiegel_schonend.sql"), w = lies("supabase/functions/kc-db-mirror-worker/index.ts");
// 1) entzerrt
assert.ok(/c_je_welle constant int := 1;/.test(mig), "Anstoß: 1 Paket je Minute");
assert.ok(/faellig_ab <= now\(\) and zyklus > now\(\) - interval '1 hour'\s+order by nr limit 1 for update skip locked/.test(mig), "Welle: 1 neues Paket je Minute");
assert.ok(/x\.versuche < 2 and x\.zyklus > now\(\) - interval '1 hour'/.test(mig), "Wiederholung nach Serverfehler bleibt");
// 2) Zeiten – abgeglichen mit Sicherung (00:40), FRA (01–03), Aufräumen (03:05–03:50), Prüfung (06:30) und den Einspiel-Fenstern
const std = [4, 13, 22];
assert.ok(mig.includes("schedule => '10 4,13,22 * * *'") && mig.includes("schedule => '11-40 4,13,22 * * *'"), "Anstoß und Welle zur selben Stunde");
for (const h of std) {
  assert.ok(!(h === 0 || (h >= 1 && h <= 3) || h === 6), `Stunde ${h} UTC trifft keine Nacht-Sicherung/Aufräumen/Prüfung`);
  assert.ok(!(h >= 10 && h <= 11) && !(h >= 18 && h <= 19), `Stunde ${h} UTC liegt nicht in einem Einspiel-Fenster`);
}
const abst = Math.max(...std.map((h, i) => (i < std.length - 1 ? std[i + 1] - h : 24 - h + std[0])));
assert.ok(abst * 60 + 30 === 570, "Wächter-Fenster 570 Min. (rechnet kc_db_mirror_frischefenster selbst)");
assert.ok(/c_fenster constant interval := kc_internal\.kc_db_mirror_frischefenster\(\);/.test(mig) && !/interval '390 minutes'/.test(mig.split("-- Rückweg")[1]?.split("\n").slice(1).join("\n") || mig.slice(mig.indexOf("create or replace function public.kc_db_mirror_extern_plan"))), "externer Wächter mit demselben Fenster");
assert.ok(/date_bin\('60 minutes'/.test(mig) && /interval '10 hours'/.test(mig) && /v_zyklus > now\(\) - interval '40 minutes'/.test(mig), "Nachholen erkennt die längere Welle");
assert.ok(/revoke all on function public\.kc_db_mirror_extern_plan\(\) from public, anon, authenticated;/.test(mig), "Rechte des externen Plans unverändert eng");
// 3) klüger prüfen – nur Zahlen, nur service_role; nachts immer voll, höchstens 12 Std. ohne echte Prüfsumme
assert.ok(/create or replace function public\.kc_db_mirror_stat_sig\(p_table_name text\)/.test(mig) && /pg_relation_filenode\(c\.oid\), s\.n_tup_ins, s\.n_tup_upd, s\.n_tup_del/.test(mig), "Kennung aus Statistik");
assert.ok(/revoke all on function public\.kc_db_mirror_stat_sig\(text\) from public, anon, authenticated;\s*grant execute on function public\.kc_db_mirror_stat_sig\(text\) to service_role;/.test(mig), "nur service_role");
assert.ok(/r\.table_name = p_table_name and r\.mirror_enabled/.test(mig), "nur gespiegelte Tabellen");
assert.ok(/STAT_SKIP_MAX_MS=12\*60\*60\*1000, statSkipErlaubt=new Date\(\)\.getUTCHours\(\)!==4;/.test(w), "12 Std. Grenze, Nachtlauf voll");
assert.ok(/lm\.stat_sig===aktSig&&lm\.source_hash&&lm\.hash_mode&&Number\.isFinite\(fpAt\)&&Date\.now\(\)-fpAt<STAT_SKIP_MAX_MS/.test(w), "nur bei gleicher Kennung und frischer Prüfsumme");
assert.ok(/catch\{\/\* ohne Kennung wie bisher \*\/\}/.test(w), "ohne Funktion/Kennung wie bisher");
for (const m of ["transfer_mode:\"unchanged_source_skip\"", "transfer_mode:\"unchanged_target_verified\"", "transfer_mode:\"block_delta\""])
  assert.ok(new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[^\\n]*stat_sig:aktSig,fp_at:aktFpAt").test(w), `Kennung reist mit (${m})`);
assert.ok(/source_hash:sh,target_hash:th,stat_sig:aktSig,fp_at:aktFpAt/.test(w), "auch bei voller Übertragung");
// Nachtrag: nach einem Neustart der Datenbank (Zähler wieder 0) gilt jede alte Kennung als verändert
{ const n = lies("supabase/migrations/20261115_kc_spiegel_schonend_neustart.sql");
  assert.ok(/concat_ws\(':', floor\(extract\(epoch from pg_postmaster_start_time\(\)\)\)::bigint, pg_relation_filenode/.test(n), "Startzeit der Datenbank in der Kennung");
  assert.ok(/revoke all on function public\.kc_db_mirror_stat_sig\(text\) from public, anon, authenticated;\s*grant execute on function public\.kc_db_mirror_stat_sig\(text\) to service_role;/.test(n), "Rechte bleiben eng"); }
// App-Hinweis „Datenbank hat viel zu tun“ kennt dieselben Zeiten
{ const srv = lies("supabase/functions/kc-club/index.ts");
  assert.ok(/art: "spiegel", [^\n]*std: \[4, 13, 22\], von: 10, bis: 45 \}/.test(srv), "SCHWER_ZEITEN Spiegelung 04/13/22 UTC :10–:45"); }
console.log("spiegel-schonend: ok");
