// KC-CLUB-INSTALL-EINLADUNG (Wunsch Hansi 04.11.2026). Aufruf: node tests/install-einladung.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
assert.ok(app.includes('{ id: "installieren", wenn: () => installNoetig() && installBrowserStarts() >= 3, abstandTage: 3,'), "Einladung ab dem 3. Browser-Start, alle 3 Tage");
assert.ok(app.includes('return START_ART === "browser" && !schonInstalliert && !einrichtenGeraet().pc;'), "nur Handy/Tablet im Browser, nie wenn installiert");
assert.ok(app.includes('installieren: () => installNoetig(),') && app.includes("Die Club-App einmal installieren"), "auch in „Klappt etwas nicht?“");
assert.ok(app.includes('if (installEreignis) installieren(); else einrichtenAssistent();') && app.includes('installAnleitung()">🖼️ Zeig mir wie'), "ein Tipp bzw. Assistent, mit Bildern");
assert.ok(app.includes('api("unterstuetzung_senden", { punkte: ["startbild"]'), "Hilfe beim Installieren = Unterstützungs-Anfrage");
assert.ok(app.indexOf("let installEreignis = null, schonInstalliert = false;") < app.indexOf("const installNoetig = "), "Reihenfolge beim Laden");
console.log("install-einladung: ok");
