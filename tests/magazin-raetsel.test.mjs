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
// KC-CLUB-MAGAZIN-RAETSEL-HEFTE (11.11.2026): Hefte 2–12 je ein eigenes Fehlerbild und Kreuzworträtsel, Auflösung immer im nächsten Heft (Nr. 13 löst Nr. 12 auf)
const themen = new Set(), loesungen = new Set();
for (let n = 2; n <= 12; n++) {
  const r = daten.MAG_AUSGABEN[n].raetsel, f = r.fehlerbild, k = r.kreuzwort, Z = k.zeilen, W = Z[0].length;
  assert.equal(r.aufloesung, n - 1, `Nr. ${n} löst Nr. ${n - 1} auf`);
  assert.equal(f.fehler.length, 10, `Nr. ${n}: genau 10 Fehler`);
  for (const [x, y, rad, t] of f.fehler) assert.ok(x - rad >= -2 && x + rad <= 402 && y - rad >= -2 && y + rad <= 302 && rad >= 10 && t.length > 5, `Nr. ${n}: Fehler im Bild – ${t}`);
  f.fehler.forEach(([x, y, r1], i) => f.fehler.slice(i + 1).forEach(([x2, y2, r2]) => assert.ok(Math.hypot(x - x2, y - y2) >= r1 + r2 - 0.5, `Nr. ${n}: Fundkreise überlappen`)));
  for (const b of [f.a, f.b, f.loesung]) { assert.ok(b.startsWith(`magazin/raetsel/nr${String(n).padStart(2, "0")}-`) && fs.existsSync(new URL("../" + b, import.meta.url)), `Nr. ${n}: Bild fehlt ${b}`); assert.ok(!/<text/.test(lies(b)) || b === f.loesung, `Nr. ${n}: keine Schrift im Rätselbild ${b}`); }
  assert.notEqual(lies(f.a), lies(f.b)); themen.add(f.a);
  assert.ok(Z.every((z) => z.length === W && /^[A-Z.]+$/.test(z)), `Nr. ${n}: Gitter`);
  const fo = []; Z.forEach((z) => fo.push(...z.split(".").filter((w) => w.length > 1)));
  for (let c = 0; c < W; c++) fo.push(...Z.map((z) => z[c]).join("").split(".").filter((w) => w.length > 1));
  assert.deepEqual(fo.sort(), k.fragen.map((x) => x[4]).sort(), `Nr. ${n}: keine ungewollten Wörter`);
  for (const [nn, d, rr, cc, w, frage] of k.fragen) { assert.ok(frage.length > 5 && !frage.toUpperCase().replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/Ü/g, "UE").includes(w), `Nr. ${n} ${nn}${d}: Frage verrät nichts`);
    assert.equal([...w].map((_, i) => d === "A" ? Z[rr][cc + i] : Z[rr + i][cc]).join(""), w, `Nr. ${n} ${nn}${d} liegt richtig`); }
  assert.ok(k.fragen.length >= 18, `Nr. ${n}: mindestens 18 Begriffe`);
  assert.equal(k.loesung.felder.map(([rr, cc]) => Z[rr][cc]).join(""), k.loesung.wort, `Nr. ${n}: Lösungswort`);
  assert.equal(k.loesung.anzeige.replace(/Ä/g, "AE").replace(/Ö/g, "OE").replace(/Ü/g, "UE"), k.loesung.wort); loesungen.add(k.loesung.wort);
}
assert.equal(themen.size, 11, "jedes Heft eine eigene Szene"); assert.equal(loesungen.size, 11, "jedes Heft ein eigenes Lösungswort");
assert.deepEqual(daten.MAG_AUSGABEN[13].raetsel, { aufloesung: 12 }, "Auflösung von Nr. 12 steht in Nr. 13");
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
// KC-CLUB-BLAETTERN-TASTATUR (2.891.0): die Handy-Tastatur (resize) darf die Blätter-Seite nicht neu aufbauen – sonst verschwindet das Eingabefeld
const app = lies("app.js"), rz = app.match(/addEventListener\("resize", \(\) => \{ if \(BL\.offen[^\n]*/)?.[0] || "";
assert.ok(rz.includes('blDoppel() !== $("blBuehne").classList.contains("doppel")') && rz.includes("blZeigen(0)"), "Blättern zeichnet bei Größenänderung nur neu, wenn Einzel-/Doppelseite wechselt");
assert.ok(/\.mag-fb-stand \.knopf, \.mag-kw \.knopf \{ background: #741521; color: #fff;/.test(html), "Rätsel-Knöpfe lesbar: Weinrot mit weißer Schrift");
assert.ok(!/\|\|=/.test(teil));
console.log("magazin-raetsel: ok");
