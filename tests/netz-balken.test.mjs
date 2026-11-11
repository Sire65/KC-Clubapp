// KC-CLUB-NETZ-BALKEN (09.11.2026, Wunsch Hansi „Balken, wie stark die Verbindung ist – per WLAN oder 5G … Router und Satellit fallen nicht so auf“).
// Aufruf: node tests/netz-balken.test.mjs (offline). Browser-Prüfung: tools/hilfe/netz-balken-browser.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8"), app = programmText();
assert.match(html, /<button type="button" class="nb-chip versteckt" id="netzBalken" onclick="netzBlatt\(\)"/, "Balken im Kopf, antippen → Verbindungs-Blatt");
assert.match(html, /\.nb-chip \{ position: absolute; top: 3px; right: 18px;/, "schwebt oben rechts – verschiebt nichts");
assert.ok(html.indexOf('id="netzBalken"') < html.indexOf('id="kopfPfeil"') && !/sl-luecke"><\/span>\s*<button[^>]*netzBalken/.test(html), "nicht mehr in der Statusleiste");
assert.match(html, /id="setNetzBalken" onchange="einstellung\('netzBalken', this\.checked\);netzSymbolZeigen\(\)"/, "abschaltbar in ⚙️ Effekte");
assert.match(html, /\.nb-chip\.nb-rot\.nb-puls \{ animation: nbPuls/, "schwache Verbindung pulsiert rot");
assert.match(app, /\["setNetzBalken", "netzBalken"\]/, "Einstellung wird beim Öffnen gesetzt");
const fn = app.slice(app.indexOf("function netzBalkenZeigen"), app.indexOf("function netzSymbolZeigen"));
assert.match(fn, /einst\("netzBalken", true\)/, "Standard: an");
assert.doesNotMatch(fn, /api\(|fetch\(/, "keine zusätzlichen Abfragen – nutzt die gemessenen Antwortzeiten");
assert.match(app, /function netzSymbolZeigen\(\) \{\n\s+try \{ const na = netzArtJetzt\(\); netzBalkenZeigen\(na\.art, netzQualitaet\(\)\); \} catch \{\}/, "läuft mit dem Symbol (30 s, Netzwechsel, Antworten)");
console.log("netz-balken: alles grün");
