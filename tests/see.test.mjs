// KC-CLUB-SEE (10.11.2026, Wunsch Hansi): Szene „Am See“ – Wasserfall, See, Segelboote, Ruderboot, Polizeiboot mit Blaulicht,
// Sturm mit Regen und Blitzen, alles wird weggepustet, dann von vorn. Aufruf: node tests/see.test.mjs (offline). Browser: tools/hilfe/see-browser.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), sz = lies("teile/szenen.js"), html = lies("index.html");
assert.match(app, /\{ id: "see", sym: "⛵", name: "Am See", design: "nordsee", jz: "see",/, "Thema in der Auswahl");
assert.match(app, /const JZB_ARTEN = \[[^\]]*"disco", "see"\]/);
assert.match(sz, /const JZB_FESTE = \[[^\]]*"disco", "see"\]/);
assert.match(sz, /if \(J\.saison === "see"\) return jzbSeeSchritt\(F, dt\);/);
assert.match(sz, /if \(J\.saison === "see"\) jzbSeeMalen\(c, F\);/);
assert.match(html, /jahreszeitVorschau\('see'\)">⛵ Am See<\/button>/, "Vorschau-Knopf");
assert.match(app, /\{ id: "see", thema: "darstellung", sym: "⛵", t: "Thema Am See"/, "Hilfe-Eintrag");
const S = sz.slice(sz.indexOf("// ---------- KC-CLUB-SEE"), sz.indexOf("function jzbSeeMalen"));
assert.match(S, /const SEE_DAUER = 72, SEE_DUNKEL = \[34, 42, 62, 68\], SEE_REGEN = \[40, 46\], SEE_BLITZ = \[46, 60\], SEE_STURM = 56;/, "Ablauf");
assert.match(S, /S\.regen\.length < 120/, "höchstens 120 Tropfen");
assert.match(S, /S\.wolken\.length < 7/, "höchstens 7 Wolken");
assert.doesNotMatch(S.replace(/\/\/[^\n]*/g, ""), /shadowBlur|api\(|fetch\(/, "sparsam, nichts an den Server");
assert.match(S, /polizeiPlan: \[14, 29\]/, "Polizeiboot zweimal");
assert.match(S, /c\.fillText\("POLIZEI"/);
console.log("see: alles grün");
