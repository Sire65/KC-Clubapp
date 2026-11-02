// KC-CLUB-UHR-X (2.807.0, Wunsch #65 Hansi): rotes X an jeder Stunden-Uhr, danach Frage „ganz ausschalten?“.
// Aufruf: node tests/uhr-x.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync("index.html", "utf8");
const k = app.slice(app.indexOf("function kuckuckZeigen("), app.indexOf("function kkLautsprecherWecken("));
assert.ok(/class="kk-x" aria-label="Uhr schließen"/.test(k), "X an jeder Uhr (Kuckuck und alle Stundenuhren – eine Stelle)");
assert.ok(/\.kk-x"\)\.onclick = \(e\) => \{ e\.stopPropagation\(\); zu\(\); if \(!tonImmer\) kkDauerndAusFragen\(\); \};/.test(k), "X schließt, Frage nicht bei der Probe in den Einstellungen");
assert.ok(/u\.onclick = zu;/.test(k), "Antippen der Uhr schließt weiter wie bisher");
const f = app.slice(app.indexOf("async function kkDauerndAusFragen()"), app.indexOf("async function kkDauerndAusFragen()") + 600);
assert.ok(/ja: "🔕 Ja, ganz aus", nein: "Nein, nur jetzt"/.test(f) && /einstellung\("kuckuck", false\)/.test(f), "Ja = derselbe Schalter wie in den Einstellungen");
assert.ok(/einst\("kuckuck", true\)/.test(app) && /einstellung\('kuckuck', this\.checked\)/.test(html), "Schalter unverändert, wieder einschaltbar");
assert.ok(/\.kuckuck \.kk-x \{[^}]*background: #c62828;/.test(html), "rot");
console.log("uhr-x: alle Prüfungen bestanden");
