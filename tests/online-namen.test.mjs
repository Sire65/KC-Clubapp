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
const mach = (ONL, frisch = true) => new Function("ONL", "mpOnline", "esc", quelle + "return onlineNamenHtml();")(ONL, () => (frisch ? ONL.liste.length : 0), esc);

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

// eingebunden im mittleren Feld; der Zoom des Feldes lässt Tipps auf Namen durch; Laufschrift ruht bei Sparmodus/Bewegung reduzieren
assert.match(app, /<b class="mini-zeile">\$\{INIT\?\.mitgliederAnzahl \|\| "–"\}\$\{ONL\.zeigen \? onlineZahlHtml\(\) : ""\}<\/b>\$\{onlineNamenHtml\(\)\}<span>Mitglieder/);
assert.match(app, /const innen = e\.target\.closest\("button, a, input, select, textarea, label, summary, \.on-name"\)/);
assert.match(html, /html\.spar \.mini \.on-lauf \.on-band \{ animation: none !important; \}/);
assert.match(html, /@media \(prefers-reduced-motion: reduce\) \{ \.mini \.on-lauf/);
assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/online-namen.test.mjs"), "läuft in der CI");
console.log("online-namen: ok");
