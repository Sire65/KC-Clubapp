// KC-CLUB-DRUCK-SEITENWECHSEL (27.10.2026, Fund Hansi „auf Seite 2 muss ein Kopf mit Logo und Datum und Seite 2 von x“): statische Prüfung (offline).
// Aufruf: node tests/druck-seitenwechsel.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs"; // 2.726.0 KC-CLUB-TEILE: app.js + teile/*.js
const app = programmText();
const f = app.slice(app.indexOf("function druckSeitenBilden("), app.indexOf("async function druckPdfBlob("));
assert.ok(/const DS_ATOM = "tr, li, p, h1, h2, h3/.test(app) && /\[style\*='break-inside:avoid'\]/.test(app), "nie in Zeilen/Absätzen/Blöcken schneiden");
assert.ok(/break-after:page/.test(f) && /teile\.push\(\[a0, y\]\)/.test(f), "erzwungene Wechsel (ein Bogen je Mitglied) bleiben, Zählung je Bogen");
assert.ok(/`Seite \$\{i \+ 1\} von \$\{stuecke\.length\}`/.test(f) && /\$\{datum\} · \$\{nr\}/.test(f) && /g\.drawImage\(logo,/.test(f), "Kopf ab Seite 2: Logo, Titel, Datum, Seite x von y");
assert.ok(/if \(ende <= seiteH \+ 2\) return null;/.test(f) && /catch \(e\) \{ console\.warn\("Seitenwechsel", e\); return null; \}/.test(f), "eine Seite oder Fehler → wie bisher");
assert.ok(/return pdfAusCanvas\(c, DRUCK\.quer, druckSeitenBilden\(c, el, breite, DRUCK\.quer\)\);/.test(app) && /function pdfAusCanvas\(c, quer, seiten = null\)/.test(app), "PDF nutzt die Seiten");
console.log("druck-seitenwechsel: alle Prüfungen bestanden");
