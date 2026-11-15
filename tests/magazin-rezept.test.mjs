// KC-CLUB-MAGAZIN-REZEPT (Wunsch Hansi 07.11.2026): Rezept des Monats in der Club-Küche Nr. 1 fest gewählt – aus dem Rezeptbuch (id), mit Kopie als Rückfall.
// Aufruf: node tests/magazin-rezept.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
const m = readFileSync(new URL("../teile/magazin.js", import.meta.url), "utf8");
assert.ok(/rezept: \{ id: "dca24732-021f-4042-b71c-a740a6ecf6e9", bild: "[^"]+", bildText: "[^"]+", titel: "Hähnchen mit Spitzkohl in Schmandsoße"/.test(m), "Heft 1: Rezept des Monats fest gewählt");
assert.ok(/const rezept = heftRz \? \{ \.\.\.heftRz, \.\.\.\(rezepte\.find\(\(r\) => r\.id === heftRz\.id\) \|\| \{\}\), gewaehlt: true \}/.test(m), "Rezeptbuch-Stand geht vor (z. B. späteres Foto), sonst die Kopie");
assert.ok(/z\.m \?\? z\.menge, z\.e \?\? z\.einheit, z\.n \?\? z\.name/.test(m), "Zutaten im Format des Rezeptbuchs (m/e/n) werden angezeigt");
assert.ok(/📷 <b>Foto folgt<\/b>/.test(m) && !/leckerschmecker/i.test(m), "ohne fremdes Foto: Platzhalter");
assert.ok(/bild: "magazin\/rezept\/haehnchen-spitzkohl\.webp"/.test(m) && readFileSync(new URL("../magazin/rezept/haehnchen-spitzkohl.webp", import.meta.url)).length > 10000, "Rezept des Monats: Hansis Foto liegt bei");
console.log("magazin-rezept: alle Prüfungen bestanden");
// KC-CLUB-MAGAZIN-BACKSTUBE / -BASTELECKE (Wunsch Hansi 07.11.2026): Feenküsse in der Backstube, Karnevalsmaske in der Bastelecke
assert.ok(/backstube: \{ id: "8109ae04-2caf-4e53-8e51-f28fe332784f", foto: "18f7800f-bbc1-4c8f-9a3c-d6beb854a08d", titel: "Feenküsse"/.test(m) && /if \(id === "backstube"\) return/.test(m), "Backstube: Feenküsse");
assert.ok(/hobby: \{ marke: "Bastelecke", titel: "Helau und Alaaf: eine Maske aus dem Pappteller"/.test(m) && /Rosenmontag ist am 8\. Februar 2027/.test(m) && /if \(id === "hobby"\) return/.test(m), "Bastelecke: Karneval (Rosenmontag 8. Februar 2027)");
assert.ok(/\{ id: "hobby", sym: "🧶", t: "Hobby- & Bastelecke", u: "Basteln, Garten, Heimwerken & Co\." \}|\{ id: "hobby", sym: "🧶", t: "Hobby- & Bastelecke", u: "Basteln, Garten, Heimwerken & Co\.",/.test(m), "Rubrik heißt Hobby- & Bastelecke, nicht mehr „später“");
console.log("magazin-backstube/bastelecke: ok");

// KC-CLUB-MAGAZIN-BACKSTUBE-OSTERKOERBCHEN: die echte Backstubenansicht für März 2027 rendern.
const daten = m.slice(m.indexOf("const MAG_AUSGABEN ="), m.indexOf("\n};", m.indexOf("const MAG_AUSGABEN =")) + 3);
const htmlFn = m.slice(m.indexOf("function magHeftHtml("), m.indexOf("\n}", m.indexOf("function magHeftHtml(")) + 2);
const { maerz, april, render } = runInNewContext(daten + "\n" + htmlFn + "\n({ maerz: MAG_AUSGABEN[3], april: MAG_AUSGABEN[4], render: magHeftHtml })", {
  esc: (t) => String(t).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;"),
  magPlatz: () => "",
});
assert.equal(maerz.erscheint, "2027-03-01");
assert.ok(maerz.termine_fest.some((t) => t.text === "Ostern" && t.wann.includes("28.")));
assert.ok(maerz.schlagzeilen.some(([, t]) => t.includes("Mini-Osterkörbchen")));
assert.notEqual(april.backstube?.titel, maerz.backstube.titel, "Osterkörbchen nur in Nr. 3");
assert.equal(maerz.backstube.schritte.length, 6);
const seite = render("backstube", maerz.backstube);
assert.match(seite, /src="magazin\/rezept\/mini-osterkoerbchen\.webp"/);
assert.match(seite, /KI-Illustration zum Rezept/);
assert.match(seite, /Vorlage für den Teig: <a href="https:\/\/www\.ovb-online\.de\//);
assert.match(seite, /Modellierfondant/);
assert.doesNotMatch(seite, /Foto folgt|Steht auch im Rezeptbuch/);
const osterbild = readFileSync(new URL("../magazin/rezept/mini-osterkoerbchen.webp", import.meta.url));
assert.equal(osterbild.toString("ascii", 8, 12), "WEBP");
assert.ok(osterbild.length > 10000 && osterbild.length < 250000);
console.log("magazin-backstube-osterkoerbchen: ok");
