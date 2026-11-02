// 2.825.0 KC-CLUB-RECHNER-AUFGABE (Wunsch #70) + KC-CLUB-SPUR-BESUCHE (Wunsch #72) – statisch und mit echter Rechnung.
// Aufruf: node tests/rechner-spur-besuche.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync("index.html", "utf8"), re = fs.readFileSync("teile/rechner.js", "utf8");
// #70 Rechner: ganze Aufgabe im Display
const R = new Function("$", "localStorage", re + "\nreturn { RE, reZeigen, reTaste, reHuebsch, reLuft };");
const el = { reRechnung: { textContent: "" }, reWert: { textContent: "", classList: { toggle() {} } }, reStreifen: null };
const m = R((id) => el[id], { getItem: () => null, setItem() {}, removeItem() {} });
globalThis.melde = () => {};
for (const t of ["3", "*", "3", "-", "5"]) m.reTaste(t);
assert.equal(el.reWert.textContent, "3 × 3 − 5", "beim Tippen: ganze Rechnung groß");
m.reTaste("=");
assert.deepEqual([el.reRechnung.textContent, el.reWert.textContent], ["3 × 3 − 5 =", "4"], "nach = : Aufgabe oben, Ergebnis groß");
m.reTaste("+"); m.reTaste("6");
assert.deepEqual([el.reRechnung.textContent, el.reWert.textContent], ["3 × 3 − 5 = 4", "4 + 6"], "weiterrechnen: alte Aufgabe bleibt sichtbar");
assert.ok(/\.re-anzeige b\.lang \{ font-size: 1\.5rem; \}/.test(html), "lange Rechnungen kleiner");
// #72 Wege: Besuche getrennt
const a = app.indexOf("const SPUR_BESUCH_PAUSE_MIN"), code = app.slice(a, app.indexOf("const spurBlockKopf", a));
const bl = new Function(code + "\nreturn spurBloecke;")();
const t = (min) => 1e12 + min * 60000;
const r = bl([{ t: t(0), w: "geoeffnet" }, { t: t(1), w: "x" }, { t: t(30), w: "y" }, { t: t(31), w: "geoeffnet" }, { t: t(32), w: "wieder" }, { t: t(33), w: "z" }]);
assert.deepEqual(r.nr, [0, 0, 1, 2, 2, 2], "neu bei Pause ≥ 15 Min. und bei „App geöffnet“; „wieder“ direkt danach kein eigener Besuch");
assert.equal(r.zahl, 3);
assert.ok(/\$\{bl\.start\[i\] \? spurBlockKopf\(bl, b\) : ""\}<tr class="spur-b\$\{b % 2\}/.test(app), "Kopfzeile je Besuch, Zeilen abwechselnd");
assert.ok(/bl\.zahl < 2 \? "" :/.test(app), "nur ein Besuch: keine Kopfzeile");
assert.ok(/\.spur-wege tr\.spur-besuch td \{ border-top: 3px solid var\(--rot\);/.test(html), "dicke Linie");
console.log("rechner-spur-besuche: alle Prüfungen bestanden");
