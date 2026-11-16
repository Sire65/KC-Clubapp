// KC-CLUB-DRUCK-FUSS-NIE-ALLEIN + Buchungsliste ohne doppeltes Datum (16.11.2026, Funde Hansi). Aufruf: node tests/druck-fuss.test.mjs (offline)
// Browser-Prüfung des Umbruchs: tools/hilfe/druck-fuss-browser.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(app.includes("const DS_WITWE = 110;"), "Mindestrest für die nächste Seite");
assert.ok(app.includes("if (z < bis && bis - z < DS_WITWE) { const z2 = schnitt(y, z - DS_WITWE); if (z2 < z && z2 > y + platz * 0.3) z = z2; }"), "früher schneiden, Fußzeile nie allein");
assert.match(html, /#druck \.cd-fuss \{ break-before: avoid; page-break-before: avoid; break-inside: avoid; \}/, "auch beim Browser-Druck");
const ebl = app.slice(app.indexOf("function eblDruck()"), app.indexOf("\n}\n", app.indexOf("function eblDruck()")));
assert.ok(/unter: `Stand: \$\{new Date\(\)\.toLocaleDateString\("de-DE"\)\}`, rechts: "", html, quer: true/.test(ebl), "Buchungsliste: Datum nur einmal");
assert.ok(app.includes('$("druck").innerHTML = s.ohneRahmen ? s.html : `<div class="cd-blatt">${cdKopf(s.titel, s.unter, s.rechts ?? esc(fKurzJahr.format(new Date())))}'), "rechts: \"\" schaltet das zweite Datum ab");
console.log("✅ druck-fuss: alle Prüfungen bestanden");
