// KC-CLUB-VIDEO-PRUEFUNG (3.37.0, Hansi 26.11.2026 „Ja ansehen und berichtigen“): Funde aus dem Gesamtlauf aller Erklär-Videos.
// 1) Bestenliste zeichnet nicht über die Auswahl, wenn man inzwischen zurück ist (Rätsel-Video „📜 Bildnachweise“, schnelles „↩ Zurück“).
// 2) Ein vom Video geöffnetes „Anordnen“ endet beim Seitenwechsel ohne Speichern (Video „Versteckte Helfer“ speicherte die Kachel-Anordnung).
// 3) Prüfwerkzeug tools/hilfe/alle-videos-browser.mjs: echter App-Start mit Beispieldaten, übersprungene Stationen, Server-Aufrufe an der Leitung gezählt.
// Aufruf: node tests/video-pruefung.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const lies = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const rs = lies("teile/rueckseite.js"), vid = lies("teile/videos.js"), app = lies("app.js"), pw = lies("tools/hilfe/alle-videos-browser.mjs");
const bl = rs.slice(rs.indexOf("async function qzBestenliste()"), rs.indexOf("\n}", rs.indexOf("async function qzBestenliste()")));
assert.ok(/id="qzBlLaedt"/.test(bl) && /await qzStandHolen\(\);[^\n]*if \(!\$\("hrFlaeche"\) \|\| !\$\("qzBlLaedt"\)\) return;/.test(bl), "Bestenliste: nach dem Laden nur zeichnen, wenn ihre Lade-Anzeige noch steht");
const rz = vid.slice(vid.indexOf("function rgZeigen()"), vid.indexOf("function rgHin()"));
assert.ok(/if \(s\.v !== "start" && RG\.anordnenZurueck && kaBearb\) rgAnordnen\(false\);[^\n]*\n\s*if \(s\.v !== aktuelleAnsicht\) zeige\(s\.v, true\);/.test(rz), "Video beendet sein „Anordnen“ ohne Speichern vor dem Seitenwechsel");
assert.ok(/if \(kaBearb && v !== "start"\) kaBearbeiten\(false\);/.test(app), "zeige() beendet echtes Anordnen weiter mit Speichern (Mitglieder)");
assert.ok(/import \{ antworten, aufraeumen \} from "\.\.\/film\/gemeinsam\.mjs"/.test(pw) && /\*\*\/functions\/v1\/\*\*/.test(pw) && /aufrufe\.push/.test(pw), "Prüfwerkzeug: echter Start, nachgebauter Club-Server, Aufrufe gezählt");
assert.ok(/weg\.push\(x\.t\)/.test(pw) && /RG\.tippLaeuft/.test(pw) && /SCHLAF\.bedient/.test(pw), "Prüfwerkzeug: übersprungene Stationen, Tipp-Animation abwarten, wach halten");
for (const k of ["sos_kontakte", "archiv_liste", "raetsel_stand", "archiviert: true", "zuletztDa"]) assert.ok(pw.includes(k), "Beispieldaten: " + k);
console.log("video-pruefung: ok");
