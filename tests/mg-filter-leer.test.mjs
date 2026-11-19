// KC-CLUB-MG-FILTER-LEER (19.11.2026, Fund Hansi: „Wer ist online?“ aus dem Schnellzugriff vor dem Laden der Liste → Programmfehler)
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
assert.ok(/if \(!Array\.isArray\(MITGLIEDER\)\) return mitgliederLaden\(\);/.test(app.slice(app.indexOf("function mgFilterSetzen"), app.indexOf("function mgFilterSetzen") + 600)), "Filter lädt erst die Liste");
assert.ok(/function mitgliederZeichnen\(\) \{\n  if \(!Array\.isArray\(MITGLIEDER\)\) return;/.test(app), "Zeichnen ohne Liste bricht still ab");
console.log("mg-filter-leer: ok");
// KC-CLUB-HAENGER-DRUCK (19.11.2026, Fund Klaus: 24 s „Hänger“ während des Druck-Dialogs)
assert.ok(/function druckMitPause\(fn\) \{ window\.KC_DRUCKT = true; try \{ fn\(\); \} finally \{ window\.KC_DRUCKT = false; window\.KC_DRUCK_ENDE = Date\.now\(\); \} \}/.test(app), "Drucken markiert die Pause");
assert.ok(/function druckJetzt\(\) \{ setTimeout\(\(\) => druckMitPause\(\(\) => window\.print\(\)\), 60\); \}/.test(app) && /druckMitPause\(\(\) => f\.contentWindow\.print\(\)\)/.test(app), "beide Druckwege");
assert.ok(/addEventListener\("beforeprint"/.test(app) && /addEventListener\("afterprint"/.test(app), "auch Strg+P");
assert.ok(/if \(luecke > 60000 \|\| druckPause\(jetzt\)\) \{ sichtbarSeit = jetzt; return; \}/.test(app), "Hänger-Wächter überspringt den Druck-Dialog");
console.log("haenger-druck: ok");
