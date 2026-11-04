// KC-CLUB-KACHEL-DREHZEICHEN (2.849.0, Wunschliste #80): Kacheln mit Rückseite zeigen ein kleines 🔄 – antippen dreht sie um, hinten dasselbe Zeichen dreht zurück.
// Aufruf: node tests/kachel-drehzeichen.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { programmText } from "./programm.mjs";
const app = programmText(), html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(/\$\{!k\.bald && krAn\(\) && krAktionen\(k\.id\)\.length \? '<span class="kr-zeichen" role="button" tabindex="0" aria-label="Kachel umdrehen/.test(app), "Zeichen nur auf Kacheln mit Rückseite (und nur, wenn Rückseiten an sind)");
assert.ok(/<span class="kr-zurueck kr-zeichen" role="button" tabindex="0" data-kr="zu" aria-label="Zurückdrehen" title="Zurückdrehen">🔄<\/span>/.test(app), "hinten dasselbe Zeichen");
const w = app.slice(app.indexOf('window.addEventListener("click", (e) => {\n  const el = e.target.closest?.("#raster > .kachel")'), app.indexOf("// ---------- KC-CLUB-REISSWOLF"));
const iHinten = w.indexOf('if (el.classList.contains("kr-hinten"))'), iZeichen = w.indexOf('if (e.target.closest?.(".kr-zeichen") && krAn() && krAktionen(el.dataset.id).length)'), iDoppel = w.indexOf("if (!krAn() || !krAktionen(el.dataset.id).length");
assert.ok(iHinten > 0 && iHinten < iZeichen && iZeichen < iDoppel, "hinten zuerst, dann Zeichen vorne (sofort), dann Doppeltipp wie bisher");
assert.ok(/return krUmdrehen\(el\); \}\n/.test(w.slice(iZeichen, iDoppel)), "Zeichen dreht sofort um");
for (const id of ["dienste", "hilfezentrum", "buero"]) assert.ok(new RegExp(`\\n  ${id}: \\[\\[`).test(app), "neue Rückseite: " + id);
assert.ok(/\["📥", "Eingang", async \(\) => \{ await buStart\(\); buEingang\(\); \}, \(\) => !!ICH\?\.vorstand\]/.test(app), "Büro-Eingang nur für die Clubleitung");
assert.ok(/#raster > \.kachel:has\(> \.kr-zeichen\) > \.zahl \{ right: 42px; \}/.test(html) && /#raster > \.kachel > \.kr-zeichen \{ position: absolute; top: 8px; right: 8px;/.test(html), "oben rechts, Zahl rückt daneben");
assert.ok(/#raster > \.kachel\.kr-hinten \.kr-zurueck \{ position: absolute; top: 4px; right: 6px;/.test(html), "hinten an derselben Stelle");
// 2.853.0 (Fund Hansi): bei 4 nebeneinander (Symbol in der Mitte) 🔄 oben links und Zahl an ihrem Platz – nie aufs Symbol geschoben
assert.ok(/#raster\.klein4 > \.kachel > \.kr-zeichen \{ right: auto; left: 3px;/.test(html) && /#raster\.klein4 > \.kachel:has\(> \.kr-zeichen\) > \.zahl \{ right: 4px; \}/.test(html), "4 nebeneinander: 🔄 links, Zahl rechts wie immer");
assert.ok(/#raster\.klein3:not\(\.klein4\) > \.kachel > \.kr-zeichen \{[^}]*right: 6px; \}/.test(html), "3 nebeneinander: 🔄 rechts (Symbol links)");
assert.ok(!/#raster\.klein4 > \.kachel:has\(> \.kr-zeichen\) > \.zahl \{ right: 26px; \}/.test(html), "alte Regel (Zahl nach links geschoben) ist weg");
console.log("kachel-drehzeichen: alle Prüfungen bestanden");
