// KC-CLUB-MAGAZIN-HEFT (08.11.2026): „📖 Als Heft drucken“ – A5-Heft und A4-Druckbögen zum Falten und Klammern. Aufruf: node tests/magazin-heft.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const teil = lies("teile/magazin.js"), app = lies("app.js"), html = lies("index.html");
const stueck = (von, bis) => teil.slice(teil.indexOf(von), teil.indexOf(bis));
// Knöpfe: im Magazin-Menü und je Ausgabe im Archiv
assert.ok(teil.includes("magHeft(${nr})\">📖 Als Heft drucken (Broschüre)</button>") && teil.includes("magHeft(${nr})\" title=\"Als A5-Heft zum Falten und Klammern\">📖 Als Heft</button>"), "Knöpfe im Menü und im Archiv");
assert.ok(stueck("function magHeft(nr)", "const magHeftStand").includes("if (!ICH?.admin && !magErschienen(nr)) return"), "Mitglieder nur erschienene Ausgaben");
// Seitenreihenfolge der Bögen (Rückendrahtheftung)
const { magHeftReihenfolge } = new Function(stueck("const magHeftReihenfolge", "function magHeftBoegen") + "; return { magHeftReihenfolge };")();
assert.deepEqual(magHeftReihenfolge(8), [[8, 1], [2, 7], [6, 3], [4, 5]]);
for (const n of [4, 12, 36, 40, 64]) { const r = magHeftReihenfolge(n).flat(); assert.equal(r.length, n); assert.deepEqual([...r].sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i + 1), "jede Seite genau einmal: " + n);
  magHeftReihenfolge(n).forEach(([l, rr], i) => assert.equal(l + rr, n + 1, "gegenüberliegende Seiten ergeben gefaltet n+1")); }
// Umbruch: nie in einem Block, Überschrift nicht allein unten, zu große Blöcke hart schneiden
const U = new Function(stueck("const MAGH = {", "const magXml") + stueck("function magHeftUmbruch", "async function magHeftSeiten") + "; return { MAGH, magHeftUmbruch };")();
const ch = U.MAGH.ch;
assert.equal(U.magHeftUmbruch([], 0, 100), 100, "passt auf eine Seite");
assert.equal(U.magHeftUmbruch([{ o: ch - 20, u: ch + 20, titel: false }], 0, ch * 3), ch - 20, "Absatz nicht zerteilt");
assert.equal(U.magHeftUmbruch([{ o: ch - 60, u: ch - 40, titel: true }, { o: ch - 30, u: ch + 30, titel: false }], 0, ch * 3), ch - 60, "Überschrift wandert mit auf die nächste Seite");
assert.equal(U.magHeftUmbruch([{ o: ch - 80, u: ch - 60, titel: true }, { o: ch - 58, u: ch - 50, titel: true }, { o: ch - 40, u: ch + 30, titel: false }], 0, ch * 3), ch - 80, "Überschrift + Unterzeile zusammen");
assert.equal(U.magHeftUmbruch([{ o: 10, u: ch + 300, titel: false }], 0, ch * 3), ch, "Block höher als eine Seite wird hart geschnitten");
assert.ok(Math.abs(U.MAGH.H / U.MAGH.W - 595.28 / 419.53) < 0.002, "Seitenbild im A5-Verhältnis");
// Druck: Seitenzahl durch 4, Rätsel leer, XML-gültige Bausteine, eigenes PDF ohne fremde Dienste
const seiten = stueck("async function magHeftSeiten", "// Heftreihenfolge");
assert.ok(seiten.includes("(4 - ((seiten.length + 2) % 4)) % 4") && seiten.includes("Notizen &amp; eigene Rezepte"), "auf durch 4 teilbar mit Notizen-Seiten");
assert.ok(seiten.includes('".mag-kw input, .mag-fb-marke, .mag-fb .mag-fb-liste, .mag-nur-bildschirm, .mag-platz"'), "Rätsel im Druck leer, keine Bildschirm-Hinweise, keine Platzhalter");
assert.ok(!/<img(?![^>]*\/>)[^>]*>/.test(stueck("async function magHeftSeiten", "// Heftreihenfolge").replace(/\$\{[^}]*\}/g, "")), "Bilder im SVG als XML geschlossen (<img … />)");
const heft = stueck("// ---------- KC-CLUB-MAGAZIN-HEFT", "// Admin: Startnachricht");
assert.ok(!/https?:\/\/(?!www\.w3\.org\/)/.test(heft) && heft.includes("pdfAusCanvas(seiten[0], false, seiten, [419.53, 595.28])") && heft.includes("pdfAusCanvas(boegen[0], true, boegen)"), "PDF von der App selbst, A5 und A4 quer");
assert.ok(/function pdfAusCanvas\(c, quer, seiten = null, masse = null\)/.test(app) && app.includes("const pw = masse ? masse[0] : quer ? 841.89 : 595.28, ph = masse ? masse[1] : quer ? 595.28 : 841.89"), "pdfAusCanvas: A4 wie bisher, A5 nur auf Wunsch");
assert.ok(teil.includes('<span class="mag-nur-druck">Kreise sie in Bild B ein!</span>') && html.includes(".mag-nur-druck { display: none; }"), "Druck-Hinweis nur auf Papier");
assert.ok(seiten.includes('fluss[i - 1]?.register === "Inhalt" ? " neu"') && seiten.includes(".hs .mag-roman-bild.fehlt { display: none"), "Inhaltsverzeichnis allein; fehlende Zeichnungen nicht auf Papier");
assert.ok(!/\|\|=/.test(teil));
console.log("magazin-heft: ok");
