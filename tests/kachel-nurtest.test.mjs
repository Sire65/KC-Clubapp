// 2.862.0 KC-CLUB-KACHEL-NURTEST (Wunsch #83): rotes ✕ unten links an noch nicht veröffentlichten Kacheln (nur Admin); ✕ der Stunden-Uhr verdeckt die Zahl nicht mehr
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8"), html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const m = app.match(/const kachelNurTest = \(k\) => \{([^\n]*)\};/); assert.ok(m, "kachelNurTest vorhanden");
const ICH = { admin: true }; let INIT = { freigaben: { fitness: "admin", avatar: "alle" } };
const kachelNurTest = new Function("ICH", "INIT", `return (k) => {${m[1]}};`);
assert.equal(kachelNurTest(ICH, INIT)({ id: "fitness" }), true, "nur Admin freigegeben → ✕");
assert.equal(kachelNurTest(ICH, INIT)({ id: "avatar" }), false, "für alle → kein ✕");
assert.equal(kachelNurTest(ICH, INIT)({ id: "kalender" }), false, "Kachel ohne Freigabe-Eintrag → kein ✕");
assert.equal(kachelNurTest({ admin: false }, INIT)({ id: "fitness" }), false, "Mitglied sieht nie ein ✕");
assert.equal(kachelNurTest(ICH, {})({ id: "fitness" }), false, "Freigaben unbekannt → kein ✕");
assert.ok(/\$\{kachelNurTest\(k\) \? '<span class="k-nurtest"/.test(app), "✕ in der Kachel");
assert.ok(/#raster > \.kachel > \.k-nurtest \{[^}]*left: 6px; bottom: 6px;[^}]*background: #c62828;/.test(html), "unten links, rot");
const kx = html.match(/\.kuckuck \.kk-x \{[^}]*\}/)[0];
assert.ok(/left: -6px/.test(kx) && !/right:/.test(kx), "Uhr-✕ oben links (Zahl oben rechts frei)");
assert.ok(/\.kuckuck \.kk-zahl \{[^}]*right: -8px; top: -8px;/.test(html), "Zahl bleibt oben rechts");
console.log("kachel-nurtest: ok");
