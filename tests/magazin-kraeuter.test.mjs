// KC-CLUB-MAGAZIN-KRAEUTER + KC-CLUB-MAGAZIN-SCHON-GEWUSST (11.11.2026, Wunsch Hansi). Aufruf: node tests/magazin-kraeuter.test.mjs (offline)
// Prüft: 12 Kräuter (je Monat eins, mit Herkunft/Geschmack/Küche/Tipp, passend zum Saisonkalender), 12 × 3 Kniffe, Hansis zwei Tricks in Heft 1, Einbau in Saison/Küchentipp.
import fs from "node:fs";
import assert from "node:assert/strict";
const teil = fs.readFileSync(new URL("../teile/magazin.js", import.meta.url), "utf8");
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const d = new Function("esc", teil.slice(teil.indexOf("const MAG_KRAEUTER"), teil.indexOf("const MAG = {")) + "; return { MAG_KRAEUTER, MAG_SCHON_GEWUSST, MAG_SAISON, magKraut, magSchonGewusst };")(esc);
assert.equal(d.MAG_KRAEUTER.length, 24); assert.equal(d.MAG_SCHON_GEWUSST.length, 24); // KC-CLUB-MAGAZIN-HEFTE-2028: zweites Jahr mit neuen Kräutern und Kniffen
for (const k of d.MAG_KRAEUTER) for (const f of ["n", "l", "her", "geschmack", "kueche", "tipp"]) assert.ok(k[f] && k[f].length > 3, `${k.n}: ${f}`);
assert.equal(new Set(d.MAG_KRAEUTER.map((k) => k.n)).size, 24, "jedes Kraut nur einmal"); assert.equal(new Set(d.MAG_SCHON_GEWUSST.flat()).size, 72, "jeder Kniff nur einmal");
for (const l of d.MAG_SCHON_GEWUSST) assert.equal(l.length, 3, "drei Kniffe je Heft");
assert.ok(/Pergament/.test(d.MAG_SCHON_GEWUSST[0][0]) && /Zwiebel.*von oben nach unten/.test(d.MAG_SCHON_GEWUSST[0][1]), "Hansis Tricks in Heft 1");
assert.ok(/giftig/.test(d.MAG_KRAEUTER[2].tipp) && /Kirschlorbeer/.test(d.MAG_KRAEUTER[11].tipp), "Warnhinweise Bärlauch und Lorbeer");
assert.ok(/Kraut des Monats: Petersilie/.test(d.magKraut(1)) && /Lorbeer/.test(d.magKraut(12)) && /Kraut des Monats: Majoran/.test(d.magKraut(13)) && /Gartenkresse/.test(d.magKraut(14)) && /Wacholder/.test(d.magKraut(24)) && /Petersilie/.test(d.magKraut(25)));
assert.ok(/Schon gewusst\?/.test(d.magSchonGewusst(1)) && (d.magSchonGewusst(1).match(/<li>/g) || []).length === 3);
assert.ok(/r\.id === "saison"\) inhalt \+= magKraut\(nr\)/.test(teil) && /r\.id === "tipp"\) inhalt \+= magSchonGewusst/.test(teil), "Einbau in Saison und Küchentipp");
console.log("magazin-kraeuter: ok");
// KC-CLUB-MAGAZIN-VORBAU (11.11.2026): Hefte 2–12 vorgefüllt – Küchentipp (2), Witz, Küchenlatein, Termine, Schlagzeilen
{ const a = new Function("esc", teil.slice(teil.indexOf("const MAG_START"), teil.indexOf("// Bausteine für die Heftseiten")) + "; return MAG_AUSGABEN;")((t) => String(t));
  const begriffe = new Set();
  for (let n = 2; n <= 24; n++) { const h = a[n]; // KC-CLUB-MAGAZIN-HEFTE-2028 (13.11.2026): auch 13–24
    assert.equal(h.tipp.length, 2, `Heft ${n}: zwei Küchentipps`); assert.ok(h.tipp[0].kniff && h.tipp[0].merke && h.tipp[1].kasten && h.tipp[1].schritte.length >= 3, `Heft ${n}: Tipp-Format`);
    assert.ok(h.witz?.zeilen?.length >= 2, `Heft ${n}: Witz`); assert.ok(h.latein?.begriff, `Heft ${n}: Küchenlatein`); begriffe.add(h.latein.begriff);
    assert.ok(h.termine_fest.length >= 2 && h.termine_fest.every((x) => x.sym && x.text && x.wann), `Heft ${n}: Termine`);
    assert.ok(h.schlagzeilen[0][1].startsWith(n <= 12 ? "Hinter dem Pass, Folge " + n : "Hinter dem Pass, Staffel 2 · Folge " + (n - 12)), `Heft ${n}: Roman bleibt erste Schlagzeile`); }
  assert.equal(begriffe.size, 23, "jeder Begriff nur einmal");
  assert.ok(a[3].termine_fest.some((x) => /Ostern/.test(x.text) && /28\. und Mo\., 29\. März/.test(x.wann)), "Ostern 2027 am 28. März");
  assert.ok(a[2].termine_fest.some((x) => x.text === "Rosenmontag" && /8\. Februar/.test(x.wann)), "Rosenmontag 8. Februar 2027");
  assert.ok(a[16].termine_fest.some((x) => /Ostern/.test(x.text) && /16\./.test(x.wann)), "Ostern 2028 am 16. April");
  // KC-CLUB-MAGAZIN-BACKSTUBE (15.11.2026): Januar Feenküsse, Februar Mohn-Aprikosen-Herzen, Dezember Karamell-Schoko-Herzen – eigene Fassung ohne fremde Fotos
  assert.equal(a[1].backstube.titel, "Feenküsse"); assert.equal(a[2].backstube.titel, "Mohn-Aprikosen-Herzen"); assert.equal(a[12].backstube.titel, "Karamell-Schoko-Herzen"); assert.equal(a[4].backstube.titel, "Hausfreunde"); assert.equal(a[3].backstube.titel, "Osterkörbchen"); assert.ok(a[3].backstube.bild && fs.statSync(new URL("../" + a[3].backstube.bild, import.meta.url)).size < 200000, "März: Osterkörbchen mit Bild");
  // Ostern 2027 am 28. März (Wunsch Hansi 15.11.2026): Oster-Suchbild und Oster-Kreuzworträtsel im März-Heft, Fischmarkt im April
  assert.ok(a[3].raetsel.fehlerbild.a.startsWith("magazin/raetsel/nr03-osterfruehstueck") && a[3].raetsel.kreuzwort.titel === "Rund ums Osterfrühstück" && a[4].raetsel.fehlerbild.a.startsWith("magazin/raetsel/nr04-fischmarkt"), "Ostern im März-Heft");
  assert.ok(a[3].hobby.titel.includes("Ostereier") && a[3].hobby.schritte.length === 6 && a[3].hobby.schnell.ideen.length === 3 && a[3].hobby.zeigtHer, "März: Oster-Bastelecke");
  assert.ok(a[12].backstube.bild === "magazin/backstube/nr12-karamell-schoko-herzen.webp" && a[12].backstube.bildNachweis === "Bild: KI-generiert" && fs.statSync(new URL("../" + a[12].backstube.bild, import.meta.url)).size < 200000, "Dezember: KI-Bild mit Nachweis");
  assert.ok(a[2].backstube.bild === "magazin/backstube/nr02-mohn-aprikosen-herzen.webp" && a[2].backstube.bildNachweis === "Bild: KI-generiert" && fs.statSync(new URL("../" + a[2].backstube.bild, import.meta.url)).size < 200000, "Februar: KI-Bild mit Nachweis");
  for (const n of [2, 12]) { const b = a[n].backstube; assert.ok(!b.foto && !b.id && b.zutaten.length === 3 && b.schritte.length >= 6 && b.tipp && b.fakten.length === 4, `Heft ${n}: Backstube vollständig`); } }
console.log("magazin-vorbau: ok");
// KC-CLUB-MAGAZIN-WARENKUNDE (15.11.2026): Produkt des Monats in allen 24 Heften, auf der Seite „Saisonkalender“ unter dem Kraut des Monats
{ const w = new Function("esc", teil.slice(teil.indexOf("const MAG_WARENKUNDE"), teil.indexOf("const MAG = {")) + "; return { MAG_WARENKUNDE, magWare };")((t) => String(t));
  assert.equal(w.MAG_WARENKUNDE.length, 24); assert.equal(new Set(w.MAG_WARENKUNDE.map((x) => x.n)).size, 24, "jedes Produkt nur einmal");
  for (const x of w.MAG_WARENKUNDE) for (const f of ["n", "sym", "saison", "einkauf", "lagern", "kueche", "profi", "wissen"]) assert.ok(x[f] && x[f].length > 0, `${x.n}: ${f}`);
  assert.ok(/Produkt des Monats: Grünkohl/.test(w.magWare(1)) && /Produkt des Monats: Spargel/.test(w.magWare(5)) && /Produkt des Monats: Rotkohl/.test(w.magWare(24)));
  assert.ok(/r\.id === "saison"\) inhalt \+= magKraut\(nr\) \+ magWare\(nr\)/.test(teil), "Einbau im Saisonkalender"); }
console.log("magazin-warenkunde: ok");
