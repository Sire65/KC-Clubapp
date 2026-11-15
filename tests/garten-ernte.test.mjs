// KC-CLUB-GARTEN-ERNTE + KC-CLUB-GARTEN-BUNT (Freigabe Hansi 15.11.2026 „Ja das Konzept soll umgesetzt werden … Auch Blumen damit der Garten bunt wird“)
// Konzept docs/KONZEPT_CLUBGARTEN_KRAEUTERERNTE.md: sechs Kräuter mit festem Rezept, Reifehinweis je Pflanze nur einmal je Gerät, Sammelhinweis bei mehreren,
// Rezept bleibt an der reifen Pflanze, kein Push, keine Abfrage; Blumen lösen keinen Hinweis aus. Aufruf: node tests/garten-ernte.test.mjs (offline)
import assert from "node:assert/strict";
import fs from "node:fs";
const gt = fs.readFileSync(new URL("../teile/garten.js", import.meta.url), "utf8");
// garten.js mit kleinen Stellvertretern ausführen (keine Seite, kein Netz)
const speicher = {}, hinweise = [], blaetter = [];
const umgebung = {
  localStorage: { getItem: (k) => speicher[k] ?? null, setItem: (k, v) => { speicher[k] = String(v); } },
  esc: (t) => String(t), heuteIso: () => "2026-11-15", blattAuf: (id, html) => blaetter.push([id, html]), document: { getElementById: () => null, createElement: () => ({}), head: { appendChild() {} } },
};
const G = new Function(...Object.keys(umgebung), gt + `; return { GT_ARTEN, GT_REZEPTE, GT_REIF_MERK, gtLage, gtSvg, gtReifeHinweis, gtRezept, gtRezeptAuswahl, gartenReif, set gtHinweis(f) { gtHinweis = f; } };`)(...Object.values(umgebung));
G.gtHinweis = (text, knopf, fn, versuch, gezeigt) => { hinweise.push({ text, knopf, fn }); gezeigt && gezeigt(); };
// 1) Sechs Kräuter, je ein Rezept mit Zutaten und Schritten; Blumen, Sträucher, Bäume ohne Rezept
const kraeuter = G.GT_ARTEN.filter((a) => a.gruppe === "kraeuter").map((a) => a.id);
assert.deepEqual(kraeuter, ["basilikum", "rosmarin", "schnittlauch", "petersilie", "dill", "kresse"]);
for (const k of kraeuter) { const r = G.GT_REZEPTE[k]; assert.ok(r && r.t && r.lust && r.fuer && r.zutaten.length >= 4 && r.schritte.length >= 2, "Rezept " + k); }
assert.deepEqual(Object.keys(G.GT_REZEPTE).sort(), [...kraeuter].sort(), "nur Kräuter haben Rezepte");
assert.equal(G.GT_REZEPTE.petersilie.t, "Petersilien-Walnuss-Pesto"); assert.equal(G.GT_REZEPTE.kresse.t, "Kresse-Senf-Quark");
assert.deepEqual(["petersilie", "dill", "kresse"].map((k) => G.GT_ARTEN.find((a) => a.id === k).tage), [28, 35, 7], "Wachstumszeiten aus dem Konzept");
assert.equal(G.GT_ARTEN.find((a) => a.id === "schnittlauch").fertig, "ist erntereif und blüht");
// 2) Bunt: acht Blumen, jede mit eigener Blüte; jede Pflanze hat „Dein/Deine“
const blumen = G.GT_ARTEN.filter((a) => a.gruppe === "blumen");
assert.equal(blumen.length, 8); assert.ok(G.GT_ARTEN.every((a) => a.dein === "Dein" || a.dein === "Deine"));
const svgs = blumen.map((a) => G.gtSvg(a.id, 4)); assert.equal(new Set(svgs).size, 8, "jede Blume sieht anders aus");
for (const k of ["petersilie", "dill", "kresse"]) for (const st of [0, 1, 2, 3, 4]) assert.ok(/^<svg[\s\S]*<\/svg>$/.test(G.gtSvg(k, st)) && !/NaN|undefined/.test(G.gtSvg(k, st)), `Zeichnung ${k} Stufe ${st}`);
// 3) Reifehinweis: ein Kraut → „Rezept ansehen“, je Pflanze nur einmal
const T = 864e5, alt = (tage) => new Date(Date.now() - tage * T).toISOString();
const pfl = (id, art, tage) => ({ id, art, gesaet: alt(tage), gegossen: alt(0), geduengt: alt(0), stand: alt(tage), wachs: 0 });
const g1 = { automatik: true, pflanzen: [pfl("a1", "basilikum", 22), pfl("r1", "rose", 30), pfl("k1", "kresse", 2)] };
assert.equal(G.gtReifeHinweis(g1), true); assert.equal(hinweise.length, 1);
assert.equal(hinweise[0].text, "🌿 Dein Basilikum ist erntereif! Lust auf ein frisches Basilikum-Pesto?"); assert.equal(hinweise[0].knopf, "📖 Rezept ansehen");
assert.equal(G.gtReifeHinweis(g1), false, "gleiche Pflanze kein zweites Mal"); assert.equal(hinweise.length, 1);
hinweise[0].fn(); assert.equal(blaetter.at(-1)[0], "gtRezept"); assert.ok(blaetter.at(-1)[1].includes("Basilikum-Pinienkern-Pesto") && blaetter.at(-1)[1].includes("Pinienkerne"));
// 4) Rose blüht, Kresse noch nicht reif → nichts; mehrere reif (z. B. nach Urlaub) → ein Sammelhinweis mit Auswahl
const g2 = { automatik: true, pflanzen: [pfl("s1", "schnittlauch", 40), pfl("d1", "dill", 40), pfl("p1", "petersilie", 40), pfl("r2", "mohn", 40)] };
assert.equal(G.gtReifeHinweis(g2), true); assert.equal(hinweise.length, 2);
assert.equal(hinweise[1].text, "🌿 Dein Schnittlauch, dein Dill und deine Petersilie sind erntereif. Die passenden Rezepte warten auf dich.");
hinweise[1].fn(); assert.ok(["Schnittlauch-Radieschen-Quark", "Dill-Zitronen-Quark", "Petersilien-Walnuss-Pesto"].every((t) => blaetter.at(-1)[1].includes(t)), "Auswahl mit allen Rezepten");
assert.equal(G.gtReifeHinweis(g2), false, "Sammelhinweis nur einmal");
assert.equal(G.gtReifeHinweis({ automatik: true, pflanzen: [pfl("x1", "mohn", 40), pfl("x2", "apfel", 90)] }), false, "Blumen und Bäume lösen keinen Kräuterhinweis aus");
// 5) Einbau: Knopf an reifer Pflanze, Reife vor Tütchen- und Pflegehinweisen, Start ohne Abfrage, kein Push
assert.ok(/l\.stufe === 4 && GT_REZEPTE\[p\.art\] \? `<button[^`]*gtRezept\('\$\{esc\(p\.art\)\}'\)">📖 Rezept ansehen<\/button>`/.test(gt), "Rezept-Knopf an der reifen Pflanze");
assert.ok(gt.indexOf("if (gtReifeHinweis(g, lagen)) return;") < gt.indexOf("if (g.offen > 0) return gtHinweis("), "Reife hat Vorrang");
assert.ok(/async function gartenReif\(\) \{ const c = gtAusSpeicher\(\);/.test(gt) && !/api\(/.test(gt.match(/async function gartenReif[^\n]*/)[0]), "gartenReif ohne Abfrage");
assert.ok(!/senden\(|webpush|Notification\(/i.test(gt), "kein Push");
assert.ok(!/Deine \$\{l\.a\.t\}/.test(gt), "kein falsches „Deine Basilikum“ mehr");
console.log("garten-ernte: ok");
