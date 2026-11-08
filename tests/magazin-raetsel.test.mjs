// KC-CLUB-MAGAZIN-RAETSEL + KC-CLUB-MAGAZIN-PROFI (08.11.2026). Aufruf: node tests/magazin-raetsel.test.mjs (offline)
// Prüft: Rubriken Küchenlatein und Rätsel-Ecke, Fehlerbild (10 Fehler, Bilder vorhanden), Kreuzworträtsel (gültiges Gitter, Lösungswort),
// Auflösung im nächsten Heft, Vorschau „Im nächsten Heft“ im Inhalt und Register, Lesezeit im Roman, Stand bleibt beim Blättern (Seite neu erzeugt).
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const teil = lies("teile/magazin.js"), html = lies("index.html");
const daten = new Function("esc", teil.slice(teil.indexOf("const MAG_START"), teil.indexOf("// Bausteine für die Heftseiten")) + "; return { MAG_RUBRIKEN, MAG_AUSGABEN };")((t) => String(t));
const ids = daten.MAG_RUBRIKEN.map((r) => r.id);
assert.ok(ids.indexOf("latein") === ids.indexOf("tipp") + 1, "Küchenlatein nach dem Küchentipp");
assert.ok(ids.indexOf("raetsel") === ids.indexOf("links") - 1, "Rätsel-Ecke vor den Linktipps");
for (const r of ["rezept", "backstube", "saison", "tipp", "witz", "rueckblick", "portraet", "roman", "termine", "hobby", "links"]) assert.ok(ids.includes(r), "bestehende Rubrik bleibt: " + r);
// Fehlerbild
const r1 = daten.MAG_AUSGABEN[1].raetsel, fb = r1.fehlerbild;
assert.equal(fb.fehler.length, 10, "genau 10 Fehler");
for (const [x, y, rad, t] of fb.fehler) assert.ok(x >= 0 && x <= 400 && y >= 0 && y <= 300 && rad > 0 && t.length > 5, "Fehler im Bild 400×300: " + t);
for (const f of [fb.a, fb.b, fb.loesung]) assert.ok(fs.existsSync(new URL("../" + f, import.meta.url)), "Bild fehlt: " + f);
assert.notEqual(lies(fb.a), lies(fb.b), "Bild A und B unterscheiden sich");
// Kreuzworträtsel: jede Buchstabenfolge (≥ 2) ist ein gewolltes Wort, Fragen passen ins Gitter, Lösungswort stimmt
const kw = r1.kreuzwort, Z = kw.zeilen, W = Z[0].length;
assert.ok(Z.every((z) => z.length === W && /^[A-Z.]+$/.test(z)), "Gitter rechteckig, nur A–Z und Punkt");
const folgen = [];
Z.forEach((z) => folgen.push(...z.split(".").filter((w) => w.length > 1)));
for (let c = 0; c < W; c++) folgen.push(...Z.map((z) => z[c]).join("").split(".").filter((w) => w.length > 1));
assert.deepEqual(folgen.sort(), kw.fragen.map((f) => f[4]).sort(), "keine ungewollten Wörter im Gitter");
for (const [n, d, r, c, w, frage] of kw.fragen) {
  assert.ok(frage.length > 5 && !frage.toUpperCase().includes(w), `Frage ${n}${d} verrät die Antwort nicht`);
  assert.equal([...w].map((_, i) => d === "A" ? Z[r][c + i] : Z[r + i][c]).join(""), w, `Wort ${n}${d} liegt richtig`);
}
assert.equal(kw.loesung.felder.map(([r, c]) => Z[r][c]).join(""), kw.loesung.wort, "Lösungswort aus den gelben Feldern");
assert.equal(kw.loesung.anzeige.replace("Ö", "OE"), kw.loesung.wort);
assert.deepEqual(daten.MAG_AUSGABEN[2].raetsel, { aufloesung: 1 }, "Auflösung von Nr. 1 steht in Nr. 2");
// Bedienung und Darstellung
for (const f of ["function magFbTipp", "function magKwEin", "function magKwPruefen", "function magRaetselSeiteNeu", "function magRaetselHtml", "kc_club_mag_raetsel"]) assert.ok(teil.includes(f), f);
assert.ok(teil.includes('.replace(/Ü/g, "UE")') && teil.includes('.replace(/ß/g, "SS")'), "Umlaute werden zu AE/OE/UE");
assert.ok(teil.includes("magRubrik: r.id, magSeitenNr:"), "Seite merkt sich die Rubrik – Stand bleibt beim Zurückblättern");
assert.ok(!/fetch\(|api\("raetsel/.test(teil.slice(teil.indexOf("KC-CLUB-MAGAZIN-RAETSEL: Rätsel-Ecke"), teil.indexOf("// Saisonkalender"))), "Rätsel verschicken nichts");
// Vorschau und Lesezeit
assert.ok(teil.includes('register: "Vorschau"') && teil.includes("Im nächsten Heft") && teil.includes('"Vorschau", "Impressum"]'), "Vorschau-Seite mit Register");
assert.ok(teil.includes("Lesezeit") && html.includes(".mag-lesezeit"), "Lesezeit im Roman");
const vor = teil.slice(teil.indexOf("KC-CLUB-MAGAZIN-PROFI: „Im nächsten Heft“"), teil.indexOf('register: "Vorschau"'));
assert.ok(vor.length > 100 && !/Folge \d|folge \+ 1/.test(vor), "Vorschau nennt keine Folgennummer oder Inhalte späterer Folgen");
for (const k of [".mag-fb-flaeche", ".mag-fb-marke", ".mag-kw-gitter", ".mag-kw-feld", ".mag-kw-wort", ".mag-latein-herkunft", ".mag-vorschau"]) assert.ok(html.includes(k), "Stil " + k);
assert.ok(!/\|\|=/.test(teil));
console.log("magazin-raetsel: ok");
