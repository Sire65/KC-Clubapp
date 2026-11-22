// KC-CLUB-DP-PDF-ZEBRA (22.11.2026, Wunsch Hansi „Im PDF-Dienstplan soll der besseren Lesbarkeit jede zweite Linie minimal hellgrau abgesetzt sein“):
// Tagesraster (dpd-raster) und Einsatzplan (dpe-tab): jede zweite Person ganz leicht grau-beige, je Tag neu gezählt (erste Person weiß),
// Personen ohne Dienst zählen mit, Summen-/Ampel-/Bereitschaftszeilen verschieben das Muster nicht. Nur background-color, kein Verlauf
// (KC-CLUB-DRUCK-OHNE-STREIFEN), nur im Druck (#druck), Lücken-Übersicht (dpl-tab) unverändert.
// Aufruf: node tests/dp-pdf-zebra.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const stueck = (a, b) => { const i = app.indexOf(a), j = app.indexOf(b, i + 1); assert.ok(i > 0 && j > i, "Stelle fehlt: " + a); return app.slice(i, j); };

const block = stueck("const DPD_WD", "function dpdUebersichtWunsch(") + stueck("const dpeRl", "async function dpdEinsatzBauen(");
const f = new Function("esc", "cdKopf", "cdFuss", "wann", block + "; return { dpdTag, dpdTabelle, dpdEinsatzBlatt };")(
  (s) => String(s), (t) => `<header>${t}</header>`, (t) => `<footer>${t}</footer>`, (x) => String(x));

// Beispieldaten (ausgedacht): 8–10 Uhr, zwei Tage
const leute = (namen) => namen.map(([n, s]) => ({ n, z: "vorne", w: "pppp", s }));
const tag1 = { d: "2026-12-04", art: "Markttag", bedarf: [1, 1, 2, 2], besetzt: [1, 1, 1, 2], fehlt: [0, 0, 1, 0],
  leute: leute([["Anna A", [8, 9]], ["Bert B", null], ["Carla C", [9, 10]], ["Dora D", [9.5, 10]]]), ber: [{ n: "Emil E", s: [8, 10] }] };
const tag2 = { d: "2026-12-05", art: "Markttag", bedarf: [1, 1, 1, 1], besetzt: [1, 1, 1, 1], fehlt: [0, 0, 0, 0],
  leute: leute([["Anna A", [8, 10]], ["Bert B", null], ["Carla C", null]]) };

// 1. Tagesraster: je Tag neu gezählt, erste Person weiß, Person ohne Dienst zählt mit, Summen-/Ampelzeilen ohne zb
const T = [tag1, tag2].map((t) => ({ ...t, ...f.dpdTag(t, 8, 10, {}, "voll"), wt: "Fr", dt: "x", name: "Markttag", regel: "8–10" }));
const tab = f.dpdTabelle(T, 8, [8, 8.5, 9, 9.5], 9.5);
const tage = tab.split('<tbody class="dpd-tag">').slice(1);
assert.equal(tage.length, 2);
const zeilen = (t) => [...t.matchAll(/<tr class="([^"]*)">.*?<th class="wer [a-z]+">([^<]*)</g)].map((m) => [m[2], /\bzb\b/.test(m[1])]);
assert.deepEqual(zeilen(tage[0]), [["Anna A", false], ["Bert B", true], ["Carla C", false], ["Dora D", true], ["Emil E", false], ["Bedarf / besetzt", false], ["Ampel", false]], "Tag 1: abwechselnd je Person, Bert ohne Dienst zählt mit");
assert.deepEqual(zeilen(tage[1]).slice(0, 3), [["Anna A", false], ["Bert B", true], ["Carla C", false]], "Tag 2 beginnt wieder weiß");
assert.ok(/const dpdZebra = \(rows, i\) => rows\[i\]\.art === "p" && rows\.slice\(0, i\)\.filter\(\(x\) => x\.art === "p"\)\.length % 2 === 1;/.test(app) && /\$\{dpdZebra\(t\.rows, i\) \? " zb" : ""\}/.test(app), "Zähler je Tag (nur Zeilen dieses Tages) neu");

// 2. Einsatzplan: beide Zeilen einer Person gleich, je Tag (Seite) neu
const E = f.dpdEinsatzBlatt({ von: 8, tage: [tag1, tag2] }).split('<section class="dpd-blatt dpe"').slice(1);
assert.equal(E.length, 2);
for (const s of E) {
  const wz = [...s.matchAll(/<tr class="wz([^"]*)">/g)].map((m) => /\bzb\b/.test(m[1])), sz = [...s.matchAll(/<tr class="sz([^"]*)">/g)].map((m) => /\bzb\b/.test(m[1]));
  assert.deepEqual(wz, wz.map((_, i) => i % 2 === 1), "Einsatzplan: jede zweite Person, erste weiß");
  assert.deepEqual(sz, wz, "Wunsch- und Einteilungszeile einer Person gleich");
}
assert.ok(!/<tr class="ber[^"]*zb/.test(E.join("")) && !/class="stat"[^>]*zb/.test(E.join("")), "Bereitschaft/Statistik ohne Zebra");

// 3. CSS: nur im Druck, nur background-color (einfarbig), kein Verlauf/Bild; Lücken-Übersicht unverändert
const css = html.split("\n").filter((z) => /\.zb\b/.test(z));
assert.ok(css.length >= 2, "Zebra-Regeln vorhanden");
for (const z of css) {
  assert.ok(/^\s*#druck /.test(z), "nur im Druck: " + z.trim());
  assert.ok(!/gradient|background-image|url\(|background:/.test(z), "nur background-color, kein Verlauf: " + z.trim());
  assert.ok(!/dpl-tab/.test(z), "Lücken-Übersicht nicht angefasst");
}
assert.ok(css.some((z) => /\.dpd-raster tr\.zb > th\.wer/.test(z) && /background-color: #f1eee9/.test(z)), "Tagesraster: Name bis letzte Stunde hell grau-beige");
assert.ok(css.some((z) => /\.dpe-tab tr\.zb > td \{ background-color: #f1eee9; \}/.test(z)), "Einsatzplan: beide Zeilen gleich");
// Zeilenhöhen (KC-CLUB-DRUCK-TAG-GANZ / Seitenumbruch) unberührt: Zebra-Regeln setzen keine Höhe, Rahmen oder Abstände
for (const z of css) assert.ok(!/height|border|padding|margin/.test(z.replace(/\/\*.*?\*\//g, "")), "keine Größenänderung: " + z.trim());

// KC-CLUB-DP-PDF-ACHSE (Hansi 22.11.): Achsen-Zellen nicht mit Klasse „h“ (= hinten, dunkelblau) – Kopfzeile bleibt hell
const achse = E[0].match(/<th class="gr achse">(.*?)<\/th>/)[1];
assert.ok(/<i class="ah( zwei)?">/.test(achse) && !/<i class="h[ "]/.test(achse), "Achse mit eigener Klasse ah");
assert.ok(!/\.ah\b[^{]*\{[^}]*background/.test(html), "Achse ohne eigene Hintergrundfarbe (hell wie der Tabellenkopf)");
console.log("dp-pdf-zebra: alles grün");
