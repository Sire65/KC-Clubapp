// KC-CLUB-REZEPT-FOTO-QUELLE (2.815.0, Wunsch #66 Hansi): Rezept-Foto von Kamera, Galerie oder Dateimanager.
// Aufruf: node tests/rezept-foto-quelle.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync("index.html", "utf8");
const f = app.slice(app.indexOf("function rzFormZeigen()"), app.indexOf("function rzfMerken()"));
assert.ok(/📷 Kamera<input type="file" accept="image\/\*" capture="environment" hidden onchange="rzfFoto\(this\)">/.test(f), "Kamera");
assert.ok(/🖼️ Galerie<input type="file" accept="image\/\*" hidden onchange="rzfFoto\(this\)">/.test(f), "Galerie");
assert.ok(/📁 Datei<input type="file" accept="\$\{CF_FOTO_DATEI\}" hidden onchange="rzfFoto\(this\)">/.test(f), "Dateimanager (Endungen öffnen die Dateiauswahl)");
const r = app.slice(app.indexOf("async function rzfFoto(input)"), app.indexOf("async function rzSpeichern()"));
assert.ok(/Bitte ein Foto oder Bild wählen\./.test(r) && /anlageHochladen\(roh\)/.test(r), "nur Bilder, Hochladen wie bisher (verkleinert)");
assert.ok(/\.cf-foto-wahl input\[type="file"\] \{ display: none; \}/.test(html), "Dateifelder unsichtbar, nur die Knöpfe");
console.log("rezept-foto-quelle: alle Prüfungen bestanden");
