// KC-CLUB-BEGRUESSUNG-FIX (25.11.2026): Begrüßung beim ersten Start schreibt in das Feld, das es in index.html wirklich gibt
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const teil = app.slice(app.indexOf("function begruessungPruefen("), app.indexOf("function begruessungPruefen(") + 1500);
assert.ok(!teil.includes('$("kopfGruss")'), "kein Zugriff auf das nicht vorhandene Feld kopfGruss");
assert.ok(teil.includes('$("begruessungText")') && /id="begruessungText"/.test(html), "Begrüßung nutzt begruessungText, das in index.html steht");
// alle $("…").innerHTML-Ziele im Begrüßungsteil gibt es in index.html oder werden in der App erzeugt
for (const [, id] of teil.matchAll(/\$\("([A-Za-z]+)"\)/g)) assert.ok(html.includes(`id="${id}"`) || app.includes(`id="${id}"`) || app.includes(`.id = "${id}"`), "Feld fehlt: " + id);
console.log("begruessung-fix: ok");
