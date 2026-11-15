// KC-CLUB-UPDATE-HINWEIS (2.945.0, Wunsch Hansi 13.11.2026 „Meldung anpassen, dass z. B. gerade ein größeres Update eingespielt wird“):
// Nach einem Update (auch nach dem Selbst-Neuladen bei Mischstand Seite/Programm) sagt die Ladeanzeige „Update“ statt „Netz langsam“.
// Aufruf: node tests/update-hinweis.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
assert.ok(/window\.KCFP\.durchUpdate = !!durchUpdate;/.test(html), "Start merkt sich: kam durch ein Update");
assert.ok(/if \(window\.KCFP\.durchUpdate && l\.firstChild\) l\.firstChild\.textContent = "🔄 Gerade wird ein größeres Update eingespielt – die App richtet sich neu ein\. Bitte kurz warten und die App nicht schließen\.";/.test(html), "15-s-Hinweis nach Update");
assert.ok(html.includes("Das Netz ist gerade langsam – die App lädt noch."), "ohne Update bleibt der Netz-Hinweis");
assert.ok(html.includes('"🔄 Gerade wird ein größeres Update eingespielt – das dauert einmalig etwas länger …"'), "Balken-Text nach Update");
const misch = app.slice(app.indexOf('if (document.currentScript?.dataset.v !== APP_VERSION) {'), app.indexOf('throw new Error("Seite und Programm passen nicht zusammen'));
assert.ok(/localStorage\.setItem\("kc_club_neustart_update", "mischstand"\)[^\n]*location\.replace/.test(misch), "Mischstand-Neuladen zählt als Update");
console.log("update-hinweis: ok");
