// KC-CLUB-VIDEO-ABGLEICH (2.803.0, Wunsch #54 Hansi „Stimmt die gesprochene Erklärung mit dem überein, was im Bild gezeigt wird?“): statische Prüfung (offline).
// Aufruf: node tests/video-abgleich.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const v = fs.readFileSync("teile/videos.js", "utf8"), app = fs.readFileSync("app.js", "utf8");
// Einstellungen-Übersicht (2.552.0): Videos öffnen die passende Seite sofort – sonst blieben die Bereiche unsichtbar und Schritte fielen still weg
assert.ok(/rgEuSeite\(d\); \} \} \/\/ 2\.469\.0/.test(v) && /function rgEuSeite\(d\)/.test(v), "rgAuf öffnet die Einstellungs-Seite");
const e = v.slice(v.indexOf("function rgEuSeite(d)"), v.indexOf("function rgEuSeite(d)") + 800);
assert.ok(/euOeffnen\(z\.id, true\)/.test(e) && /RG\.zurueck\.push\(\(\) => \{ try \{ vorher \? euOeffnen\(vorher, true\) : euUebersicht\(\); \} catch \{\} \}\)/.test(e), "danach wieder wie vorher");
assert.ok(/function euOeffnen\(id, ohneVerlauf\)/.test(app) && /const euAn = \(\) =>/.test(app), "Einstellungs-Übersicht vorhanden");
// Nachrichten-Video: Express – die Versand-Leiste wird für den Schritt eingeblendet
const x = v.slice(v.indexOf('t: "🏎️ Express"') - 500, v.indexOf('t: "🏎️ Express"'));
assert.ok(/l\.classList\.remove\("versteckt"\); RG\.zurueck\.push/.test(x) && /sel: \["#versandLeiste"\], mussSel: true, puls: \["#expressKnopf"\]/.test(x), "Express im Bild");
console.log("video-abgleich: alle Prüfungen bestanden");
