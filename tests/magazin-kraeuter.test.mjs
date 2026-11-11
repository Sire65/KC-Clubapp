// KC-CLUB-MAGAZIN-KRAEUTER + KC-CLUB-MAGAZIN-SCHON-GEWUSST (11.11.2026, Wunsch Hansi). Aufruf: node tests/magazin-kraeuter.test.mjs (offline)
// Prüft: 12 Kräuter (je Monat eins, mit Herkunft/Geschmack/Küche/Tipp, passend zum Saisonkalender), 12 × 3 Kniffe, Hansis zwei Tricks in Heft 1, Einbau in Saison/Küchentipp.
import fs from "node:fs";
import assert from "node:assert/strict";
const teil = fs.readFileSync(new URL("../teile/magazin.js", import.meta.url), "utf8");
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const d = new Function("esc", teil.slice(teil.indexOf("const MAG_KRAEUTER"), teil.indexOf("const MAG = {")) + "; return { MAG_KRAEUTER, MAG_SCHON_GEWUSST, MAG_SAISON, magKraut, magSchonGewusst };")(esc);
assert.equal(d.MAG_KRAEUTER.length, 12); assert.equal(d.MAG_SCHON_GEWUSST.length, 12);
for (const k of d.MAG_KRAEUTER) for (const f of ["n", "l", "her", "geschmack", "kueche", "tipp"]) assert.ok(k[f] && k[f].length > 3, `${k.n}: ${f}`);
assert.equal(new Set(d.MAG_KRAEUTER.map((k) => k.n)).size, 12, "jedes Kraut nur einmal");
for (const l of d.MAG_SCHON_GEWUSST) assert.equal(l.length, 3, "drei Kniffe je Heft");
assert.ok(/Pergament/.test(d.MAG_SCHON_GEWUSST[0][0]) && /Zwiebel.*von oben nach unten/.test(d.MAG_SCHON_GEWUSST[0][1]), "Hansis Tricks in Heft 1");
assert.ok(/giftig/.test(d.MAG_KRAEUTER[2].tipp) && /Kirschlorbeer/.test(d.MAG_KRAEUTER[11].tipp), "Warnhinweise Bärlauch und Lorbeer");
assert.ok(/Kraut des Monats: Petersilie/.test(d.magKraut(1)) && /Lorbeer/.test(d.magKraut(12)) && /Petersilie/.test(d.magKraut(13)));
assert.ok(/Schon gewusst\?/.test(d.magSchonGewusst(1)) && (d.magSchonGewusst(1).match(/<li>/g) || []).length === 3);
assert.ok(/r\.id === "saison"\) inhalt \+= magKraut/.test(teil) && /r\.id === "tipp"\) inhalt \+= magSchonGewusst/.test(teil), "Einbau in Saison und Küchentipp");
console.log("magazin-kraeuter: ok");
