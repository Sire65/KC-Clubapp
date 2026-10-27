// KC-CLUB-FEE-BLASE (27.10.2026, Wunsch Hansi „bei der Fee noch eine Sprechblase: Tipp mich an!“): statische Prüfung (offline).
// Aufruf: node tests/fee-blase.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(/<div class="fee-blase" aria-hidden="true">Tipp mich an!<\/div>/.test(app), "Sprechblase an der Fee");
assert.ok(/getippt = true; f\.classList\.remove\("blase"\);/.test(app) && /if \(!getippt\) \{ f\.classList\.toggle\("blase-unten", hy < 40\); f\.classList\.add\("blase"\); \}/.test(app), "erscheint beim Stehen, weg nach dem Antippen");
assert.ok(/f\.classList\.remove\("lacht", "zaubert", "blase"\);/.test(app), "weg beim Weiterfliegen");
assert.ok(/\.fee\.blase \.fee-blase \{ opacity: 1;/.test(html) && /\.fee\.blase-unten \.fee-blase/.test(html), "CSS: sichtbar und bei wenig Platz darunter");
console.log("fee-blase: alle Prüfungen bestanden");
