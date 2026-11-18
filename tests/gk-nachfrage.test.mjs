// 2.977.0 KC-CLUB-GK-NACHFRAGE + KC-CLUB-GK-GESICHTER: gemeinsame Genesungskarte – Nachfrage beim Start, Push + E-Mail, Gesichter auf der Karte.
// Aufruf: node tests/gk-nachfrage.test.mjs   (ohne Netz)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const srv = readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");

// ---------- Server ----------
const fn = srv.slice(srv.indexOf("async function gkOffenFuer"), srv.indexOf("async function sammelEmpfaenger"));
assert.ok(/\.eq\("status", "offen"\)\.gt\("bis", jetzt\(\)\)\.neq\("fuer_person_id", ich\.person_id\)/.test(fn), "nur offene, laufende Karten – nie die für mich");
assert.ok(/ich\.zugang !== "mitglied" && ich\.zugang !== "aushilfe"\) return \[\]/.test(fn), "nur Mitglieder/Aushilfen");
assert.ok(/rose, \/\* KC-CLUB-ROSE \*\/ gkOffen: await pGk,/.test(srv) && /const pGk = gkOffenFuer\(ich\)\.catch\(/.test(srv), "init liefert gkOffen, Fehler stören den Start nicht");
const fall = srv.slice(srv.indexOf('case "gk_gemeinsam_start"'), srv.indexOf('case "fl_informieren"'));
assert.ok(/sendenGewaehlt\("club_nachricht", ziel, \["push", "email"\]/.test(fall), "Push und E-Mail");
assert.ok(/in der Club-App liegt eine Genesungskarte für \$\{vn\} bereit\. Wenn du auch drauf sein möchtest, geh in die Club-App – du bekommst die Anfrage dann beim Start der App\./.test(fall), "Mailtext nach Hansis Vorgabe");
assert.ok(!/krank|diagnose|grund/i.test(fall.slice(fall.indexOf("KC-CLUB-GK-NACHFRAGE"), fall.indexOf("`club-gk:"))), "kein Grund/keine Krankheit in Push und Mail");
assert.ok(/leute: u\.map\(\(x: any\) => \(\{ pid: x\.person_id, name: vorname\(/.test(fall), "Liste liefert Unterzeichner für die Gesichter");
// gkOffenFuer ausführen (Datenbank nachgebildet)
{
  const code = stripTypeScriptTypes(fn, { mode: "transform" });
  const KARTEN = [{ id: "k1", fuer_person_id: "P-KARLA" }, { id: "k2", fuer_person_id: "P-OTTO" }], MEINE = [{ karte_id: "k2" }];
  const kette = (daten) => { const q = { select: () => q, eq: () => q, gt: () => q, neq: () => q, order: () => q, limit: () => Promise.resolve({ data: daten }), in: () => Promise.resolve({ data: MEINE }) }; return q; };
  const db = { from: (t) => kette(t === "kc_club_gk_gemeinsam" ? KARTEN : MEINE) };
  const personen = async () => new Map([["P-KARLA", { display_name: "Karla Muster" }]]), vorname = (p) => String(p?.display_name || "").split(" ")[0];
  const gk = new Function("db", "jetzt", "personen", "vorname", code + "\nreturn gkOffenFuer;")(db, () => "2026-11-18T10:00:00Z", personen, vorname);
  assert.deepEqual(await gk({ person_id: "P-ICH", zugang: "mitglied" }), [{ id: "k1", fuerName: "Karla" }], "schon unterschriebene Karte fällt weg");
  assert.deepEqual(await gk({ person_id: "P-ICH", zugang: "tischgast" }), [], "Gäste: nie");
}

// ---------- App: Nachfrage beim Start ----------
{
  const teil = app.slice(app.indexOf("const GKN_KEY"), app.indexOf("async function gkGemeinsamOeffnen(id) {"));
  const ls = new Map(), ss = new Map(), geoeffnet = [], blaetter = [];
  const knoepfe = {}; const blatt = { querySelectorAll: () => Object.values(knoepfe) };
  const umgebung = {
    localStorage: { getItem: (k) => ls.get(k) ?? null, setItem: (k, v) => ls.set(k, String(v)) },
    sessionStorage: { getItem: (k) => ss.get(k) ?? null, setItem: (k, v) => ss.set(k, String(v)) },
    document: { hidden: false, querySelector: () => null },
    blattAuf: (id, html) => { blaetter.push(html); for (const w of ["ja", "spaeter", "nein"]) knoepfe[w] = { dataset: { w } }; return blatt; },
    fensterZu: () => {}, esc: (x) => String(x), gkGemeinsamOeffnen: (id) => geoeffnet.push(id), setTimeout: () => 0, FENSTER_OFFEN: ".blatt",
  };
  const baue = (init) => new Function(...Object.keys(umgebung), "INIT", "aktuelleAnsicht", teil + "\nreturn { gkNachfragePruefen, gknStand };")(...Object.values(umgebung), init, "start");
  const INIT = { gkOffen: [{ id: "k1", fuerName: "Karla" }] };
  let t = baue(INIT); t.gkNachfragePruefen();
  assert.equal(blaetter.length, 1, "Frage erscheint"); assert.match(blaetter[0], /Karla braucht gerade gute Wünsche\./); assert.match(blaetter[0], /Gemeinschaftskarte vom Club/);
  assert.ok(!/krank/i.test(blaetter[0]), "neutraler Text ohne Krankheit");
  t.gkNachfragePruefen(); assert.equal(blaetter.length, 1, "je Sitzung nur einmal");
  knoepfe.spaeter.onclick(); assert.equal(t.gknStand().k1.spaeter, 1, "Später gemerkt");
  ss.clear(); t = baue(INIT); t.gkNachfragePruefen(); assert.equal(blaetter.length, 2, "nächster Start: noch einmal");
  knoepfe.spaeter.onclick(); ss.clear(); t = baue(INIT); t.gkNachfragePruefen(); assert.equal(blaetter.length, 2, "nach 2× Später nicht mehr");
  ls.clear(); ss.clear(); t = baue(INIT); t.gkNachfragePruefen(); knoepfe.nein.onclick(); ss.clear(); t = baue(INIT); t.gkNachfragePruefen();
  assert.equal(blaetter.length, 3, "Nein, danke: nie wieder");
  ls.clear(); ss.clear(); t = baue(INIT); t.gkNachfragePruefen(); knoepfe.ja.onclick(); assert.deepEqual(geoeffnet, ["k1"], "Ja öffnet die Karte");
  ls.clear(); ss.clear(); t = baue({ gkOffen: [] }); t.gkNachfragePruefen(); assert.equal(blaetter.length, 4, "keine offene Karte → keine Frage");
}
assert.ok(/setTimeout\(\(\) => \{ try \{ gkNachfragePruefen\(\); \} catch \{\} \}, 8000\);/.test(app), "beim Start angestoßen");
assert.ok(/if \(w === "ja" && INIT\?\.gkOffen\) INIT\.gkOffen = INIT\.gkOffen\.filter/.test(app), "nach Unterschrift nicht mehr fragen");
assert.ok(/👆 Hier tippen – mit Name und Gesicht unterschreiben/.test(app), "Knopf zum Unterschreiben");

// ---------- App: Gesichter auf der Karte ----------
{
  const teil = app.slice(app.indexOf("function gkGesichterZeichnen"), app.indexOf("// ---------- 2.977.0 KC-CLUB-GK-NACHFRAGE"));
  const zeichne = new Function("GK_ROT", teil + "\nreturn gkGesichterZeichnen;")("#741521");
  const ctx = () => { const log = { bilder: 0, texte: [] }; return { log, save() {}, restore() {}, beginPath() {}, closePath() {}, arc() {}, clip() {}, fill() {}, stroke() {},
    drawImage() { log.bilder++; }, fillText(t) { log.texte.push(t); }, measureText: (t) => ({ width: String(t).length * 10 }), set font(_) {}, set fillStyle(_) {}, set strokeStyle(_) {}, set lineWidth(_) {}, set textAlign(_) {}, set textBaseline(_) {} }; };
  let g = ctx(); const y = zeichne(g, [{ name: "Anne", bild: {} }, { name: "Klaus Peter", bild: null }, { name: "Otto", bild: {} }], 800, 540, 1080);
  assert.equal(g.log.bilder, 2, "Foto/Avatar gezeichnet"); assert.ok(g.log.texte.includes("KP"), "ohne Bild: Initialen"); assert.ok(g.log.texte.includes("Anne") && g.log.texte.includes("Otto"), "Vornamen unter den Gesichtern");
  assert.ok(y > 800 && y <= 1120, "bleibt im Kartenbereich");
  g = ctx(); const viele = Array.from({ length: 120 }, (_, i) => ({ name: "M" + i, bild: {} })); const y2 = zeichne(g, viele, 800, 540, 1080);
  assert.ok(g.log.texte.some((t) => /^… und \d+ weitere$/.test(t)), "zu viele → „… und N weitere“"); assert.ok(y2 <= 1180, "auch dann im Rahmen");
}
assert.ok(/if \(mit && k\.leute\?\.length\) \{[^\n]*gkGesichterZeichnen\(g, k\.leute/.test(app), "Karte nutzt Gesichter, ältere Server weiter Vornamen");
console.log("gk-nachfrage: alle Prüfungen bestanden");
