// KC-CLUB-CHATFOTO-SPEICHERN (17.11.2026, Fund Hansi: „im Chat steht es als jpg – beim Herunterladen kommt immer html“):
// Fotos im Chat bekommen dasselbe Fenster wie Datei-Anlagen (Öffnen / Teilen / Auf dem Gerät speichern); gespeichert wird die Bilddatei, mit Endung.
// Aufruf: node tests/chatfoto-speichern.test.mjs
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
assert.ok(app.includes(`<img data-anlage="\${a.id}" alt="\${esc(a.name)}" onclick="event.stopPropagation();anlageAktion(\${jsArg(a.id)}, \${jsArg(a.name)}, \${jsArg(a.mime)})">`), "Chat-Foto antippen öffnet das Fenster mit Speichern");
assert.ok(!app.includes(`<img data-anlage="\${a.id}" alt="\${esc(a.name)}" onclick="event.stopPropagation();anlageOeffnen('\${a.id}')">`), "nicht mehr nur der Browser-Link");
assert.ok(/<button class="knopf" onclick="anlageTeilen\(true\)">⬇️ Auf dem Gerät speichern<\/button>/.test(app), "Knopf „Auf dem Gerät speichern“ vorhanden");
assert.ok(/Was möchtest du mit \$\{bild \? "dem Foto" : "der Datei"\} machen\?/.test(app), "Fenster spricht bei Fotos vom Foto");
// mitEndung: Endung ergänzen, vorhandene nicht doppeln
const m = app.match(/const MIME_ENDUNG = (\{[^}]*\});\nconst mitEndung = (\(name, mime\) => \{[^\n]*\});/);
assert.ok(m, "mitEndung vorhanden");
const mitEndung = new Function("MIME_ENDUNG", `return ${m[2]}`)(JSON.parse(m[1]));
assert.equal(mitEndung("Hintergrund", "image/jpeg"), "Hintergrund.jpg");
assert.equal(mitEndung("Hintergrund.jpg", "image/jpeg"), "Hintergrund.jpg");
assert.equal(mitEndung("Bild.JPEG", "image/jpeg"), "Bild.JPEG");
assert.equal(mitEndung("Liste", "application/pdf"), "Liste.pdf");
assert.equal(mitEndung("notiz", "text/plain"), "notiz");
assert.ok(/new File\(\[d\.blob\], mitEndung\(d\.name, d\.mime\)/.test(app), "gespeicherte Datei bekommt die Endung");
console.log("chatfoto-speichern: ok");
