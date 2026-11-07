// KC-CLUB-BLAETTERN-WISCHEN + KC-CLUB-BLAETTERN-ZOOM (Fund/Wunsch Hansi 07.11.2026). Gesten im Browser: tools/hilfe/blaettern-wischen-browser.mjs
// Aufruf: node tests/blaettern-wischen.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { programmText } from "./programm.mjs";
const app = programmText(), html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(!/if \(Math\.abs\(dx\) > 50\) blWeiter/.test(app), "die alte 50-px-Regel (ohne Blick auf die Senkrechte) ist weg");
assert.ok(/if \(!lesen && Math\.abs\(dx\) > 70 && Math\.abs\(dx\) > Math\.abs\(dy\) \* 2\.5 && dauer < 900\) blWeiter/.test(app), "nur ein zügiger, waagerechter Wisch blättert");
assert.ok(/if \(Math\.abs\(dy\) > 12 && Math\.abs\(dy\) > Math\.abs\(dx\) \* 0\.7\) BL_T\.lesen = true;/.test(app), "wer erst schiebt, liest");
assert.ok(/const BL_ZOOM = \[1, 1\.6\]/.test(app) && /\.bl-buehne \.bl-html \{ zoom: var\(--blz, 1\); \}/.test(html), "Schrift 100–160 %, nur Text-Seiten");
assert.ok(/blZoomSetzen\(blZoomLesen\(\)\); \/\/ KC-CLUB-BLAETTERN-ZOOM/.test(app), "gemerkte Größe beim Öffnen");
assert.ok(/\{ id: "blaettern_zoom", thema: "club"/.test(app), "Hilfe-Eintrag");
console.log("blaettern-wischen: alle Prüfungen bestanden");
