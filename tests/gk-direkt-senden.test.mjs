// KC-CLUB-GK-DIREKT-SENDEN (20.11.2026, Fund Hansi: Karla bekam nur den Gruß-Text, das Bild fehlte – „sorgfältig umbauen, damit es nicht peinlich ist“)
// Aufruf: node tests/gk-direkt-senden.test.mjs   (ohne Netz)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const teil = app.slice(app.indexOf("async function gkGemeinsamSenden("), app.indexOf("async function gkInDenChat()"));
const K = { id: "K1", fuer: "P-KARLA", fuerName: "Karla", anlass: "genesung", namen: ["Hans", "Anne", "Thomas"] };
async function lauf({ upload = { id: "A1", name: "Karte.jpg" }, chat = "T-KARLA", sendeFehler = false, endeFehler = false, nein = false, blobLeer = false } = {}) {
  const log = [], meld = [], geoeffnet = [];
  const umg = {
    KARTEN_ANLAESSE: { genesung: { gruss: (n) => `💐 Gute Besserung, ${n}!` } }, kaAnlass: (a) => a,
    frage: async (t) => { log.push(["frage", t]); return !nein; }, melde: (t) => meld.push(t),
    gkZeichnen: async () => ({ toBlob: (cb) => cb(blobLeer ? null : { size: 1234 }) }),
    gkDateiName: () => "Gute-Besserung-Karla.jpg", File: class { constructor(b, n, o) { this.n = n; this.t = o.type; } },
    anlageHochladen: async (f) => { log.push(["upload", f.n]); return upload; },
    api: async (a, p) => { log.push([a, p]);
      if (a === "einzelchat_finden") return chat ? { id: chat } : {};
      if (a === "nachricht_senden") { if (sendeFehler) throw new Error("Netz weg"); return { ok: true, id: p.id || "T-NEU", mid: "M1" }; }
      if (a === "gk_gemeinsam_ende") { if (endeFehler) throw new Error("x"); return { ok: true }; } return {}; },
    fensterZu: () => log.push(["zu"]), INIT: { gkOffen: [{ id: "K1" }] }, GK_OFFEN: [{ id: "K1" }], ilZeigen: () => {},
    chatOeffnen: (id) => geoeffnet.push(id), direkt: (pid) => geoeffnet.push("direkt:" + pid),
  };
  const f = new Function(...Object.keys(umg), teil + "\nreturn gkGemeinsamSenden;")(...Object.values(umg));
  let fehler = null; try { await f(K, {}, {}); } catch (e) { fehler = e; }
  return { log, meld, geoeffnet, fehler, aktionen: log.map((x) => x[0]) };
}
{ // Normalfall: zeichnen → hochladen → senden (Bild + Gruß in EINER Nachricht) → erst dann „verschickt“ → Chat öffnen
  const r = await lauf();
  assert.equal(r.fehler, null);
  assert.deepEqual(r.aktionen, ["frage", "upload", "einzelchat_finden", "nachricht_senden", "gk_gemeinsam_ende", "zu"], "Reihenfolge");
  const s = r.log.find((x) => x[0] === "nachricht_senden")[1];
  assert.deepEqual(s.anlagen, ["A1"], "das Bild der Karte ist in der Nachricht"); assert.equal(s.id, "T-KARLA");
  assert.match(s.text, /^💐 Gute Besserung, Karla! Eine Karte vom ganzen Köcheclub – 3 haben unterschrieben\.$/);
  assert.deepEqual(r.log.find((x) => x[0] === "gk_gemeinsam_ende")[1], { id: "K1", nachricht: "M1" });
  assert.match(r.log[0][1], /jetzt an Karla schicken\?[\s\S]*„💐 Gute Besserung, Karla!/, "Rückfrage zeigt den Gruß");
  assert.match(r.meld.at(-1), /ist bei Karla angekommen – mit 3 Unterschriften/); assert.deepEqual(r.geoeffnet, ["T-KARLA"]);
}
{ const r = await lauf({ chat: null }); // noch kein Einzelchat → neuer Chat an Karla
  const s = r.log.find((x) => x[0] === "nachricht_senden")[1];
  assert.deepEqual(s.empfaenger.personen, ["P-KARLA"]); assert.deepEqual(s.anlagen, ["A1"]); assert.deepEqual(r.geoeffnet, ["T-NEU"]); }
{ const r = await lauf({ upload: {} }); // Bild nicht hochgeladen → NICHTS verschickt, Karte bleibt offen
  assert.ok(r.fehler && /nichts verschickt/.test(r.fehler.message)); assert.ok(!r.aktionen.includes("nachricht_senden") && !r.aktionen.includes("gk_gemeinsam_ende")); }
{ const r = await lauf({ blobLeer: true }); assert.ok(r.fehler && !r.aktionen.includes("upload") && !r.aktionen.includes("nachricht_senden"), "leeres Bild: nichts"); }
{ const r = await lauf({ sendeFehler: true }); // Senden scheitert → nicht als „verschickt“ markiert
  assert.ok(r.fehler); assert.ok(!r.aktionen.includes("gk_gemeinsam_ende"), "nicht verschickt markiert, wenn das Senden scheitert"); }
{ const r = await lauf({ endeFehler: true }); // angekommen, nur Markierung scheitert → ehrliche Meldung
  assert.equal(r.fehler, null); assert.match(r.meld.at(-1), /angekommen\. \(Sie steht noch als „offen“ – bitte nicht noch einmal schicken\.\)/); }
{ const r = await lauf({ nein: true }); assert.deepEqual(r.aktionen, ["frage"], "„Noch warten“: nichts passiert"); }
assert.ok(/if \(w === "senden"\) return await gkGemeinsamSenden\(k, daten, f\);/.test(app), "Knopf nutzt den neuen Ablauf (mit await: Fehler werden als Meldung gezeigt)");
assert.ok(/data-w="senden">💌 Jetzt an \$\{esc\(k\.fuerName\)\} schicken</.test(app), "Knopf heißt „💌 Jetzt an … schicken“");
assert.ok(!/Die gemeinsame Karte liegt im Chat bereit/.test(app), "kein „liegt im Chat bereit – jetzt ➤“ mehr");
console.log("gk-direkt-senden: alle Prüfungen bestanden");
