// KC-CLUB-NT-AUS (Wunsch Hansi 27.11.2026): rotes ✕ neben dem Termin-Vorschlag an Nachrichten schaltet die Vorschläge aus.
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), seite = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const f = app.slice(app.indexOf("function ntKnopfHtml("), app.indexOf("function ntVorschlagAus("));
assert.ok(/if \(!khAn\("khTermin"\)\) return "";/.test(f), "ausgeschaltet → kein Vorschlag");
assert.ok(/class="nt-aus"[^>]*onclick="event\.stopPropagation\(\);ntVorschlagAus\(\)">✕<\/button>/.test(f), "rotes ✕ in derselben Zeile");
const aus = app.slice(app.indexOf("function ntVorschlagAus("), app.indexOf("function ntVorschlagAus(") + 600);
assert.ok(/einstellung\("khTermin", false\)/.test(aus) && /querySelectorAll\("\.nt-zeile"\)\.forEach\(\(e\) => e\.remove\(\)\)/.test(aus), "sofort aus und weg");
assert.ok(/\["setKhTermin", "khTermin"\]/.test(app) && /id="setKhTermin"/.test(seite) && /einstellung\('khTermin', this\.checked\)/.test(seite), "wieder einschalten unter ⚙️ → Kluge Helfer");
assert.ok(/\.blase \.nt-aus \{[^}]*color: #c0392b;/.test(seite), "rot");
assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/nt-aus.test.mjs"), "läuft in der CI");
console.log("nt-aus: ok");
