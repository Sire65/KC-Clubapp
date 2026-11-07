// KC-CLUB-MAGAZIN-NR1 (06.11.2026): Club-Küche Nr. 1 = Januar 2027 mit Rückblick Weihnachtsmarkt, Küchenwitz und Küchentipps. Aufruf: node tests/magazin-nr1.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const teil = lies("teile/magazin.js"), html = lies("index.html");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const code = teil.slice(teil.indexOf("const MAG_START"), teil.indexOf("const MAG = {")) + "; const MAG = { jahr: 2027, monat: 1 };"
  + teil.slice(teil.indexOf("const MAG_RUBRIK_ART"), teil.indexOf("async function magStart"));
const { MAG_START, MAG_AUSGABEN, magHeftHtml, magNummer } = new Function("esc", "jsArg", code + "; return { MAG_START, MAG_AUSGABEN, magHeftHtml, magNummer };")(esc, JSON.stringify);
// erste Ausgabe im Januar 2027
assert.deepEqual(MAG_START, { jahr: 2027, monat: 1 }); assert.equal(magNummer(2027, 1), 1);
const nr1 = MAG_AUSGABEN[1];
assert.ok(nr1 && nr1.rueckblick && nr1.witz && Array.isArray(nr1.tipp) && nr1.tipp.length === 2, "Nr. 1: Rückblick, Witz, zwei Tipps");
// Rückblick Weihnachtsmarkt: echte Eckdaten, offene Ergebnisse als sichtbarer Platzhalter (nie erfunden)
const rb = magHeftHtml("rueckblick", nr1.rueckblick);
assert.ok(rb.includes("02.–14.12.") && rb.includes("Grünkohleintopf") && rb.includes("Impressionen"), "Eckdaten, Angebot, Impressionen");
assert.ok(nr1.rueckblick.fakten.some(([, v]) => v == null) && rb.includes("✍️ __") && rb.includes('class="mag-offen"'), "offene Zahlen sichtbar als Platzhalter");
assert.ok(rb.includes("Einverständnis"), "Fotos nur mit Einverständnis");
// Witz als Bonzettel, Tipps mehrspaltig und im farbigen Kasten
const w = magHeftHtml("witz", nr1.witz), t = magHeftHtml("tipp", nr1.tipp);
assert.ok(w.includes('class="mag-bon"') && w.includes("Niedrigtemperatur") && w.includes("Bon 0001"));
assert.ok(t.includes('class="mag-spalten"') && t.includes('class="mag-kasten"') && t.includes("Beurre blanc") && t.includes("Warum es funktioniert"));
assert.ok(w.includes("mag-einsenden") && t.includes("mag-einsenden") && rb.includes("mag-einsenden"), "Einsenden-Knopf für die nächste Ausgabe");
// Platzhalter bleiben für Rubriken ohne Heftinhalt; Ausgabe ohne Eintrag ändert nichts
assert.ok(teil.includes("else if (heft[r.id]) inhalt = magHeftHtml(r.id, heft[r.id]);"));
assert.equal(magHeftHtml("portraet", {}), ""); // 2.878.0: Backstube und Bastelecke haben jetzt Heftinhalt
// Gestaltung vorhanden
for (const k of [".mag-spalten", ".mag-kasten", ".mag-bon", ".mag-fakten", ".mag-fotos", ".mag-offen"]) assert.ok(html.includes(k + " "), "CSS " + k);
console.log("magazin-nr1: ok");
