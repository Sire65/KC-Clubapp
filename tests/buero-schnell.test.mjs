// KC-CLUB-BUERO-SCHNELL (27.10.2026, Fund Hansi „großer Hänger, Sanduhr läuft lange“): statische Prüfung (offline).
// Aufruf: node tests/buero-schnell.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const f = app.slice(app.indexOf("async function buLaden("), app.indexOf("function buZurueck("));
assert.ok(/const BU_STILL = \{ still: true \};/.test(app) && /api\("buero_start", \{\}, BU_STILL\)/.test(f), "Büro-Start ohne Sanduhr");
assert.ok(/nach\(buNachherListe\(BU_STILL\)\)/.test(f) && /nach\(buFesteListe\(BU_F\?\.tage \|\| 60, BU_STILL\)\)/.test(f) && /nach\(flLaden\(BU_STILL\)\)/.test(f) && /nach\(aeEingangLaden\(BU_STILL\)\)/.test(f), "übrige Teile still und einzeln nachzeichnen");
assert.ok(!/Promise\.all\(\[api\("buero_start"\)/.test(f), "kein Warten auf alle Teile mehr");
for (const k of ["async function buNachherListe(opt = {})", "async function buFesteListe(tage = 60, opt = {})", "async function flLaden(opt = {})", "async function aeEingangLaden(opt = {})"]) assert.ok(app.includes(k), k);
console.log("buero-schnell: alle Prüfungen bestanden");
