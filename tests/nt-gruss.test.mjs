// KC-CLUB-NT-GRUSS (28.10.2026, Fund Hansi: Erinnerung „⏰ Hallo zusammen.“ – Titel war die Begrüßung): Begrüßung nicht als Termin-Titel.
// Aufruf: node tests/nt-gruss.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const m = /const NT_GRUSS = (\/.*\/);\n/.exec(app); assert.ok(m, "Gruß-Muster vorhanden");
const GRUSS = eval(m[1]);
const weg = (t) => { for (let i = 0; i < 2; i++) { const g = GRUSS.exec(t); if (!g) break; if (t.length - g[0].length < 3) { t = ""; break; } t = t.slice(g[0].length).replace(/^[\s,.;:!–-]+/, ""); } return t; };
for (const [ein, aus] of [["Hallo zusammen, Grillen bei Klaus", "Grillen bei Klaus"], ["Hallo Klaus und Dieter! Sitzung im Kolpinghaus", "Sitzung im Kolpinghaus"],
  ["Moin, Einkauf", "Einkauf"], ["Liebe Köche, Aufbau Weihnachtsmarkt", "Aufbau Weihnachtsmarkt"], ["Guten Morgen! Bauhof", "Bauhof"],
  ["Hallo wir treffen uns", "wir treffen uns"], ["Grillen bei Klaus", "Grillen bei Klaus"], ["Hallo zusammen.", ""], ["Hi, Kochkurs", "Kochkurs"]])
  assert.equal(weg(ein), aus, ein);
assert.ok(/const g = NT_GRUSS\.exec\(t\); if \(!g\) break; if \(t\.length - g\[0\]\.length < 3\) \{ t = ""; break; \}/.test(app), "im Titel-Schritt von ntErkennen");
console.log("nt-gruss: alle Prüfungen bestanden");
