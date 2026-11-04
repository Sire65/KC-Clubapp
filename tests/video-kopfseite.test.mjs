// KC-CLUB-VIDEO-KOPFSEITE (2.858.0, Fund Hansi 04.11.): Video-Schritte über Laufband und drei Felder blättern vorher auf die erste Kopf-Seite („treffen“).
// Aufruf: node tests/video-kopfseite.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const v = readFileSync(new URL("../teile/videos.js", import.meta.url), "utf8");
const schritte = v.split("\n").filter((z) => /sel: \[[^\]]*(#infoLaufband|#heroInfo \.kacheln3)/.test(z));
assert.ok(schritte.length >= 2, "Schritte gefunden");
for (const z of schritte) assert.ok(/rgInfoKarte\("treffen"\)|rgEinfachDemo\(true\)/.test(z), "blättert vorher auf die erste Seite: " + z.slice(0, 90));
assert.ok(/function rgInfoKarte\(id\) \{ rgInfo\(\);/.test(v) && /RG\.zurueck\.push\(\(\) => \{ const a = RG\.infoAlt;/.test(v), "nach dem Video kommt die eingestellte Seite zurück");
console.log("video-kopfseite: alle Prüfungen bestanden");
