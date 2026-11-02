// KC-CLUB-PROTOKOLL-FOTO (2.801.0, Wunsch #49 Hansi, Stufe A + B): statische Prüfung (offline).
// Aufruf: node tests/protokoll-foto.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync("index.html", "utf8");
const teil = (a, b) => { const i = app.indexOf(a), j = app.indexOf(b, i + 1); assert.ok(i > 0 && j > i, `fehlt: ${a}`); return app.slice(i, j); };
// eine Texterkennung für alle (lib/ocr auf dem Gerät), keine fremden Dienste
assert.ok(/async function ocrLauf\(bilder, ausgabe, schritt\)/.test(app) && /async function ocrText\(bild\) \{ return \(await ocrLauf\(\[bild\]\)\)\[0\]\.text \|\| ""; \}/.test(app), "gemeinsamer Weg, Einlesen unverändert");
const f = teil("// ---------- 2.801.0 KC-CLUB-PROTOKOLL-FOTO", "async function protokollAnlageWeg(");
assert.ok(!/fetch\(\s*["'`]https?:/.test(f) && /ocrLauf\(seiten\.map/.test(f), "nur die Erkennung auf dem Gerät");
// Stufe A: Anker = gedruckte Teile der Büro-Vorlage, Kreuz = dunkle Punkte im Kästchen links neben dem Namen
for (const a of ["protokollfuhrer", "anwesend", "entschuldigt bzw", "top (\\d+)", "beschlusse", "nachster termin"]) assert.ok(f.includes(a), `Anker ${a}`);
assert.ok(/function pfoKreuz\(c, bb\)/.test(f) && /r\.anwesend\.set\(m\.id, q >= PFO\.kreuz\)/.test(f), "Kästchen-Prüfung");
// Stufe B: Handschrift nur als Vorschlag, unsichere Wörter markiert, erst nach Übernehmen im Entwurf
assert.ok(/const pfoWort = \(w\) => \(w\.confidence >= PFO\.sicher \? w\.text : `\[\?\$\{w\.text\}\]`\);/.test(f), "unsichere Wörter [?…]");
assert.ok(/✅ Übernehmen/.test(f) && /async function pfoUebernehmen\(\)/.test(f) && /nicht gefunden und nicht angehakt → bleibt wie bisher/.test(f), "erst Prüfen, Nichtgefundenes bleibt");
assert.ok(/mark\.pfo-unsicher \{ background: #ffe066;/.test(html), "gelb");
// vor dem Veröffentlichen: Rückfrage bei [? …]
assert.ok(/if \(PFO_UNSICHER\.test\(\["prK", "prB", "prN", "prG"\]/.test(app.slice(app.indexOf("async function protokollVeroeffentlichen("))), "Rückfrage vor dem Veröffentlichen");
// Knopf im Entwurf, Hilfe
assert.ok(/onclick="\$\('prFoto'\)\.click\(\)">🔎 Fotos lesen und ausfüllen<\/button><input type="file" id="prFoto" accept="image\/\*" multiple hidden onchange="prFotoLesen\(this\)">/.test(app), "Knopf");
assert.ok(/id: "protokoll_foto", thema: "club"/.test(app), "Hilfe-Eintrag");
// Auswertung mit einem nachgebauten Ergebnis der Texterkennung (ohne Browser): Abschnitte und Termin
const ctx = new Function("MITGLIEDER", teil("const PFO = {", "async function prFotoLesen(") + "; return { pfoAuswerten, pfoTermin, pfoAehnlich };");
const { pfoAuswerten, pfoTermin, pfoAehnlich } = ctx([{ person_id: "A", name: "Anne Muster" }]);
const w = (t, c = 95) => ({ text: t, confidence: c, bbox: { x0: 100, y0: 10, x1: 140, y1: 30 } }), z = (...ws) => ({ text: ws.map((x) => x.text).join(" "), words: ws });
const r = pfoAuswerten([{ c: { getContext: () => ({ getImageData: (l, t, ww, hh) => ({ data: new Uint8ClampedArray(ww * hh * 4) }) }) }, daten: { blocks: [{ paragraphs: [{ lines: [
  z(w("Anwesend")), z(w("Anne"), w("Muster")), z(w("TOP"), w("1:"), w("Begrüßung")), z(w("Alle"), w("da", 55), w("N", 20)), z(w("Beschlüsse"), w("/"), w("Sonstiges")), z(w("Preis"), w("3"), w("Euro")),
  z(w("Nächster"), w("Termin:"), w("12.11."), w("19:30")) ] }] }] } }]);
assert.equal(r.anwesend.get("A"), true, "schwarzes Kästchen (Test) = angekreuzt");
assert.deepEqual(r.tops, [{ titel: "Begrüßung", text: "Alle [?da]" }], "unsicher markiert, Schnipsel der Schreiblinie („N“, sehr unsicher) weg");
assert.deepEqual(r.beschluesse, ["Preis 3 Euro"]);
assert.equal(pfoTermin("12.11.26 19:30 Vereinsheim"), "12.11.2026, 19:30 Uhr · Vereinsheim");
assert.ok(pfoAehnlich("Reinhi1de", "Reinhilde") > 0.8 && pfoAehnlich("Klaus", "Frank") < 0.5, "Namen mit kleinen Lesefehlern");
console.log("protokoll-foto: alle Prüfungen bestanden");
