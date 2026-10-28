// KC-CLUB-SCHLUESSEL-SICHERN (26.10.2026, Wunsch Hansi „das muss abgesichert sein“, Stufe A): statische Prüfung (offline).
// Aufruf: node tests/schluessel-sichern.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs"; // 2.727.0 KC-CLUB-TEILE: app.js + teile/*.js
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), sw = lies("sw.js"), server = lies("supabase/functions/kc-club/index.ts");
const f = app.slice(app.indexOf("// ---------- KC-CLUB-SCHLUESSEL-SICHERN"), app.indexOf("// ---------- Start der App ----------"));
assert.ok(/const SK_DB = "kcclub-sicher", SK_CACHE = "kcclub-sicher"/.test(f) && !/document\.cookie/.test(f), "Zweitablage IndexedDB + Cache, kein Cookie");
assert.ok(!/k\.startsWith\("kcclub-"\)/.test(sw) && /k\.startsWith\("kc-club-"\) && k !== CACHE/.test(sw), "Service Worker räumt die Zweitablage nicht weg");
assert.ok(/navigator\.storage\.persist\(\)/.test(f) && /\/\^\[0-9a-f\]\{32,96\}\$\/\.test\(k\)/.test(f), "Dauer-Speicher, nur gültige Schlüssel");
assert.ok(/einwZeigen\(aktuelleAnsicht\); schluesselSichern\(KEY\);/.test(app), "erst nach gültiger Anmeldung sichern");
assert.ok(/if \(!KEY\) \{ schluesselZurueck\(\)\.then\(\(z\) => \{ if \(z\) \{ location\.replace\(location\.pathname \+ "\?k=" \+ z \+ location\.hash\); return; \}/.test(app), "beim Start still zurückholen");
assert.ok(/Promise\.race\(\[p, new Promise\(\(ok\) => setTimeout\(\(\) => ok\(""\), ms\)\)\]\)/.test(f), "Zurückholen hält den Start nie auf");
assert.ok(/FP_INFO\.add\("schluessel_zurueck"\)/.test(server), "Wiederherstellung ist Info");
console.log("schluessel-sichern: alle Prüfungen bestanden");
