// KC-CLUB-SENDEN-NACH-UPLOAD (17.11.2026, Wunsch Hansi nach Rundschreiben ohne PDF): solange eine Anlage hochlädt, ist ➤ gesperrt
// und zeigt ⏳; erst wenn alle Anlagen oben sind, ist Senden wieder frei. Schlägt das Hochladen fehl, sagt die App deutlich, dass die Datei fehlt.
// Aufruf: node tests/senden-nach-upload.test.mjs
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const m = app.match(/function sendenFrei\(\) \{[\s\S]*?\n\}/);
assert.ok(m, "sendenFrei vorhanden");
assert.ok(/function chipsZeigen\(\) \{\n  versandZeigen\(\); sendenFrei\(\);/.test(app), "jede Änderung an den Anlagen stellt den Knopf neu ein");
assert.ok(!/\$\("sendenKnopf"\)\.disabled = false;/.test(app), "kein Code gibt ➤ mehr frei, ohne die Anlagen zu prüfen");
assert.ok(/melde\(`⚠️ „\$\{roh\.name\}“ wurde NICHT angehängt/.test(app), "fehlgeschlagener Upload wird deutlich gemeldet");
// Verhalten prüfen
const knopf = { disabled: false, textContent: "➤", title: "", cls: new Set(), classList: { toggle(c, an) { an ? knopf.cls.add(c) : knopf.cls.delete(c); } }, setAttribute() {} };
let anlagen = [];
const sendenFrei = new Function("$", "anlagen", `${m[0]}; return sendenFrei;`)(() => knopf, anlagen);
anlagen.push({ name: "Preisliste.pdf", laedt: true }); sendenFrei();
assert.equal(knopf.disabled, true); assert.equal(knopf.textContent, "⏳"); assert.ok(knopf.cls.has("laedt-hoch"));
anlagen[0].laedt = false; sendenFrei();
assert.equal(knopf.disabled, false); assert.equal(knopf.textContent, "➤"); assert.ok(!knopf.cls.has("laedt-hoch"));
console.log("senden-nach-upload: ok");
