// KC-CLUB-PINNWAND-NIE-AUTO (Hansi 03.11.2026 „Nie von selbst öffnen“). Aufruf: node tests/pinnwand-nie-auto.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
assert.ok(app.includes("const PW_NIE_AUTO = true;") && app.indexOf("const PW_NIE_AUTO = true;") < app.indexOf("let PW = {"), "Schalter vor PW");
assert.ok(app.includes("if (nurZaehlen || PW_NIE_AUTO) { /* nur zählen, nichts einblenden */ }"), "Start: kein Zettel-Fenster");
assert.equal((app.match(/if \(!PW_NIE_AUTO && !gezeigt && !nurZaehlen/g) || []).length, 2, "Start: keine Pinnwand bei ❗ wichtig oder Hilfe-Aufruf");
assert.ok(app.includes("if (PW_NIE_AUTO) melde(") && app.includes("else pwFenster(neu); // KC-CLUB-PINNWAND-NIE-AUTO"), "offene App: nur kurze Meldung");
assert.ok(app.includes('if (PW.neu > 0) add({ id: "pw-neu:" + PW.neu,'), "Karte im Info-Laufband");
console.log("pinnwand-nie-auto: ok");
