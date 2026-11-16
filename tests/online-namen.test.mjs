// KC-CLUB-ONLINE-NAMEN (2.731.0, 28.10.2026, Wunschliste #46): im mittleren Feld oben unter der Zahl die Namen, wer gerade online ist –
// bei mehreren als Laufschrift; Antippen öffnet sofort den Chat. Aufruf: node tests/online-namen.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");

// Funktion herauslösen und mit Test-Daten ausführen
const start = app.indexOf("function onlineNamenHtml()"), ende = app.indexOf("\n}\n", start) + 2;
const quelle = app.slice(start, ende);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
// KC-CLUB-GESPRAECHE: laufende Telefonate stehen als eigene Schilder vorne (gsKopf/gsSchild hier als einfache Nachbildung)
const gsKopf = () => [], gsSchild = (g, kopie) => `<span class="on-name on-gs"${kopie ? ' aria-hidden="true"' : ' role="button"'}>${g.id}</span>`;
const mach = (ONL, frisch = true, gs = gsKopf) => new Function("ONL", "mpOnline", "esc", "gsKopf", "gsSchild", "onLaufZoomStart", quelle + "return onlineNamenHtml();")(ONL, () => (frisch ? ONL.liste.length : 0), esc, gs, gsSchild, () => {});

assert.equal(mach({ zeigen: true, liste: [] }), "", "niemand online → nichts");
assert.equal(mach({ zeigen: false, liste: [{ person_id: "P1", vorname: "Klaus" }] }), "", "selbst unsichtbar → keine Namen (wie die Zahl)");
assert.equal(mach({ zeigen: true, liste: [{ person_id: "P1", vorname: "Klaus" }] }, false), "", "Stand veraltet → keine Namen");
const eins = mach({ zeigen: true, liste: [{ person_id: "P1", vorname: "Klaus" }] });
assert.match(eins, /direkt\('P1'\)/, "Antippen öffnet den Chat");
assert.ok(!/on-lauf/.test(eins), "ein Name → keine Laufschrift");
const drei = mach({ zeigen: true, liste: [{ person_id: "P3", vorname: "Marianne" }, { person_id: "P1", vorname: "Klaus" }, { person_id: "P2", vorname: "Anne" }] });
assert.match(drei, /class="on-namen on-lauf"/, "mehrere → Laufschrift");
assert.equal((drei.match(/class="on-name"/g) || []).length, 6, "zweimal hintereinander (nahtlos)");
assert.equal((drei.match(/role="button"/g) || []).length, 3, "nur die erste Reihe ist bedienbar, die Kopie ist versteckt");
assert.ok(drei.indexOf("Anne") < drei.indexOf("Klaus") && drei.indexOf("Klaus") < drei.indexOf("Marianne"), "alphabetisch");
assert.ok(!/<button/.test(drei), "kein Knopf im Knopf (das Feld ist selbst ein Knopf)");
assert.match(mach({ zeigen: true, liste: [{ person_id: "P1", vorname: "<b>" }] }), /&lt;b&gt;/, "Namen werden maskiert");
const mitGs = mach({ zeigen: true, liste: [{ person_id: "P1", vorname: "Klaus" }] }, true, () => [{ id: "G1" }]);
assert.match(mitGs, /class="on-namen on-lauf"/, "ein Name + ein Gespräch → Laufschrift");
assert.ok(mitGs.indexOf("G1") < mitGs.indexOf("Klaus"), "Gespräche vorne");

// eingebunden im mittleren Feld; der Zoom des Feldes lässt Tipps auf Namen durch; Laufschrift ruht bei Sparmodus/Bewegung reduzieren
assert.match(app, /<b class="mini-zeile">\$\{INIT\?\.mitgliederAnzahl \|\| "–"\}\$\{ONL\.zeigen \? onlineZahlHtml\(\) : ""\}<\/b>\$\{onlineNamenHtml\(\)\}<span>Mitglieder/);
assert.match(app, /const innen = e\.target\.closest\("button, a, input, select, textarea, label, summary, \.on-name"\)/);
assert.match(html, /html\.spar \.mini \.on-namen\.on-lauf \.on-band \{ animation-duration: var\(--on-dauer, 9s\) !important;/); // 2.964.0 KC-CLUB-ONLINE-LAUF-HANDY: läuft auch im Sparmodus
assert.match(html, /@media \(prefers-reduced-motion: reduce\) \{ \.mini \.on-namen\.on-lauf/); // 2.964.0: langsamer statt still
assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/online-namen.test.mjs"), "läuft in der CI");
// KC-CLUB-ONLINE-LAUF-ZOOM (16.11.2026, Hansi „langsam alle vorbei laufen, der im Vordergrund etwas aufzoomen“)
assert.match(drei, /--on-dauer:15s/, "langsamer: 5 s je Name (3 Namen = 15 s)");
assert.match(eins, /class="on-namen on-einer"/, "ein Name steht groß und hervorgehoben");
const z = app.slice(app.indexOf("function onLaufZoom()"), app.indexOf("\n}\n", app.indexOf("function onLaufZoom()")));
assert.ok(z.includes("scale(${(1 + 0.3 * nah).toFixed(3)})") && z.includes('n.classList.toggle("on-vorn", nah > 0.55)'), "Mitte bis 1,3-fach, hervorgehoben");
assert.ok(z.includes("if (!felder.length || document.hidden) { ON_ZOOM_LAEUFT = false; return; }"), "läuft nur, solange sichtbar");
assert.ok(/function onLaufZoomStart\(\) \{\n  if \(ON_ZOOM_LAEUFT \|\| document\.documentElement\.classList\.contains\("spar"\) \|\| matchMedia/.test(app), "kein Zoom im Sparmodus / bei Bewegung reduzieren");
assert.match(html, /\.mini \.on-namen \.on-name\.on-vorn, \.mini \.on-namen\.on-einer \.on-name \{/);
console.log("online-namen: ok");
