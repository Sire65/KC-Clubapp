// KC-CLUB-MG-FILTER-LEER (19.11.2026, Fund Hansi: „Wer ist online?“ aus dem Schnellzugriff vor dem Laden der Liste → Programmfehler)
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
assert.ok(/if \(!Array\.isArray\(MITGLIEDER\)\) return mitgliederLaden\(\);/.test(app.slice(app.indexOf("function mgFilterSetzen"), app.indexOf("function mgFilterSetzen") + 600)), "Filter lädt erst die Liste");
assert.ok(/function mitgliederZeichnen\(\) \{\n  if \(!Array\.isArray\(MITGLIEDER\)\) return;/.test(app), "Zeichnen ohne Liste bricht still ab");
console.log("mg-filter-leer: ok");
