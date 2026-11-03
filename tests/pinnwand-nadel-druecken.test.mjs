// KC-CLUB-PINNWAND-NADEL-DRUECKEN (Wunschliste #74), 2.835.0. Aufruf: node tests/pinnwand-nadel-druecken.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(app.includes('(ICH?.admin ? `<span class="pw-griff" data-zid="${esc(z.id)}"'), "Griff nur für den Admin");
assert.ok(app.includes("const alt = PW.zettel.filter((z) => (pwAlt(z) || PW.zu.has(z.id)) && !PW.auf.has(z.id))"), "abgelegte Zettel stecken als Nadel");
assert.ok(app.indexOf('const PW_ZU_KEY = "kc_club_pw_zu"') < app.indexOf("let PW = {"), "Schlüssel vor PW (sonst Fehler beim Start)");
assert.ok(/PW_DRUECK_MS = 600/.test(app) && /e\.target\.closest\?\.\("\.pw-griff"\)/.test(app) && /Math\.hypot\(e\.clientX - x0, e\.clientY - y0\) > 12/.test(app), "langes Drücken, Bewegen bricht ab");
assert.ok(app.includes("function pwZuLoesen(id)") && app.includes("📋 wieder groß an die Wand"), "rückgängig");
assert.ok(/\.zettel \.pw-griff \{[^}]*touch-action: none/.test(html), "kein Scrollen/Menü beim Drücken");
console.log("pinnwand-nadel-druecken: ok");
