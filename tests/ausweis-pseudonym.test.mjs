// 3.42.0 KC-CLUB-AUSWEIS-PSEUDONYM (Wunsch Hansi 26.11.2026): eigenes Pseudonym verdeckt unter dem Ausweis-QR, 👁️ zeigt es 10 Sekunden.
// Aufruf: node tests/ausweis-pseudonym.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const c = server.slice(server.indexOf('case "mein_ausweis": {'), server.indexOf('case "admin_qr_kassen": {'));
assert.ok(/select\("mitgliedsnummer,pseudonym"\)\.eq\("person_id", ich\.person_id\)/.test(c), "nur das eigene Pseudonym");
assert.ok(/pseudonym: String\(p\?\.pseudonym \?\? ""\)\.trim\(\)\.slice\(0, 40\) \|\| null/.test(c), "Pseudonym in der Antwort");
// Verhalten im Mini-DOM
const f = app.slice(app.indexOf("function ausweisPseudoHtml("), app.indexOf("async function ausweisZeigen()"));
const el = {};
const $ = (id) => el[id];
const esc = (s) => String(s);
let uhr = null;
const setTimeout = (fn) => { uhr = fn; return 1; }, clearTimeout = () => { uhr = null; };
const { ausweisPseudoHtml, ausweisPseudoZeigen } = new Function("$", "esc", "setTimeout", "clearTimeout", f + "; return { ausweisPseudoHtml, ausweisPseudoZeigen };")($, esc, setTimeout, clearTimeout);
assert.equal(ausweisPseudoHtml(""), "", "ohne Pseudonym nichts");
const html = ausweisPseudoHtml("Testname");
assert.ok(html.includes("••••••") && html.includes('data-p="Testname"') && !/>Testname</.test(html), "verdeckt");
const attr = () => { const a = {}; return { getAttribute: (k) => a[k] ?? null, setAttribute: (k, v) => { a[k] = String(v); } }; };
el.ausweisPseudo = { textContent: "••••••", dataset: { p: "Testname" } };
el.ausweisAuge = attr(); el.ausweisAuge.setAttribute("aria-pressed", "false");
ausweisPseudoZeigen();
assert.equal(el.ausweisPseudo.textContent, "Testname", "Auge zeigt");
assert.ok(uhr, "verdeckt sich wieder");
uhr();
assert.equal(el.ausweisPseudo.textContent, "••••••", "nach 10 s verdeckt");
ausweisPseudoZeigen(); ausweisPseudoZeigen();
assert.equal(el.ausweisPseudo.textContent, "••••••", "nochmal tippen verdeckt sofort");
assert.ok(/setTimeout\(zu, 10000\)/.test(f), "10 Sekunden");
assert.ok(/pseudonym: pseudonym \|\| "", svg:/.test(app) && /\$\{ausweisPseudoHtml\(x\.pseudonym\)\}/.test(app), "gemerkt (offline) und angezeigt");
assert.ok(/notfalls mit deinem <b>Geburtsdatum<\/b>/.test(app), "Hilfe: Notlösung Geburtsdatum");
assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/ausweis-pseudonym.test.mjs"), "läuft in der CI");
console.log("ausweis-pseudonym: ok");
