// 2.977.0 Egress-Sparprogramm: KC-CLUB-ANHANG-MERKEN (sw.js) + KC-CLUB-UNTERHALTUNGEN-TEILEN (app.js).
// Aufruf: node tests/egress-sparen.test.mjs   (ohne Netz: fetch und caches werden ersetzt)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");

// ---------- Service Worker: Anlagen nach Pfad merken ----------
const block = sw.slice(sw.indexOf("// KC-CLUB-ANHANG-MERKEN-START"), sw.indexOf("// KC-CLUB-ANHANG-MERKEN-ENDE"));
assert.ok(block.length > 200, "Block vorhanden");
assert.ok(/self\.addEventListener\("fetch", \(e\) => \{\n\s+const url = new URL\(e\.request\.url\);\n\s+if \(e\.request\.method === "GET" && anhangPfad\(url\) && !e\.request\.headers\.has\("range"\)\)/.test(sw), "Abzweig ganz vorne im fetch-Handler, nur GET ohne Range");
assert.ok(!/ANHANG = "kc-club-/.test(block), "eigener Speicher, nicht kc-club-… (Update löscht ihn nicht)");

function welt() {
  const speicher = new Map(), log = [];
  const cache = {
    async match(k) { return speicher.get(k); },
    async put(k, r) { speicher.set(k, r); },
    async keys() { return [...speicher.keys()]; },
    async delete(k) { return speicher.delete(k); },
  };
  const caches = { async open(n) { assert.equal(n, "kcclub-anhaenge"); return cache; } };
  const antwort = (status, laenge) => ({ status, ok: status === 200, headers: { get: (h) => (h === "content-length" ? String(laenge) : null) }, clone() { return { kopie: true, status }; } });
  let naechste = () => antwort(200, 1000);
  const fetch = async (u, o) => { log.push([typeof u === "string" ? u : "req", o?.mode || null]); return naechste(u); };
  const f = new Function("caches", "fetch", block + "\nreturn { anhangPfad, anhangSchluessel, anhangHolen, ANHANG_MAX_ANZAHL };")(caches, fetch);
  return { f, speicher, log, setze: (fn) => { naechste = fn; }, antwort };
}
const U = (s) => new URL(s);
{
  const { f } = welt();
  assert.ok(f.anhangPfad(U("https://ptblnpiroqftcvlsrhac.supabase.co/storage/v1/object/sign/kc-communication-attachments/club/P1/abc-x.jpg?token=t1")), "Speicher-Download erkannt");
  assert.ok(!f.anhangPfad(U("https://ptblnpiroqftcvlsrhac.supabase.co/storage/v1/object/sign/b/p.jpg?token=t1&download=x.jpg")), "Herunterladen nicht merken");
  assert.ok(!f.anhangPfad(U("https://ptblnpiroqftcvlsrhac.supabase.co/functions/v1/kc-club")), "Server-Aufrufe nie");
  assert.ok(!f.anhangPfad(U("https://evil.example/storage/v1/object/sign/b/p.jpg?token=t")), "nur supabase.co");
  assert.ok(!f.anhangPfad(U("https://ptblnpiroqftcvlsrhac.supabase.co/storage/v1/object/sign/b/p.jpg")), "ohne token nicht");
  assert.equal(f.anhangSchluessel(U("https://x.supabase.co/storage/v1/object/sign/b/p.jpg?token=AAA")), f.anhangSchluessel(U("https://x.supabase.co/storage/v1/object/sign/b/p.jpg?token=BBB")), "Schlüssel ohne token");
}
{
  const { f, speicher, log } = welt();
  const a = U("https://x.supabase.co/storage/v1/object/sign/b/club/P1/u1-foto.jpg?token=t1");
  const r1 = await f.anhangHolen("REQ", a);
  assert.equal(r1.status, 200); assert.equal(log.length, 1); assert.equal(log[0][1], "cors"); assert.equal(speicher.size, 1, "gemerkt");
  const r2 = await f.anhangHolen("REQ", U("https://x.supabase.co/storage/v1/object/sign/b/club/P1/u1-foto.jpg?token=NEU"));
  assert.equal(log.length, 1, "zweites Öffnen mit neuem token: kein Netz"); assert.ok(r2.kopie, "aus dem Speicher");
}
{
  const w = welt(); w.setze(() => w.antwort(400, 50));
  await w.f.anhangHolen("REQ", U("https://x.supabase.co/storage/v1/object/sign/b/p1.jpg?token=alt"));
  assert.equal(w.speicher.size, 0, "Fehlerantwort (z. B. abgelaufen) nie merken");
  w.setze(() => w.antwort(200, 9 * 1024 * 1024));
  await w.f.anhangHolen("REQ", U("https://x.supabase.co/storage/v1/object/sign/b/gross.pdf?token=t"));
  assert.equal(w.speicher.size, 0, "zu groß → nicht merken");
  w.setze(() => w.antwort(200, 0));
  await w.f.anhangHolen("REQ", U("https://x.supabase.co/storage/v1/object/sign/b/ohne.jpg?token=t"));
  assert.equal(w.speicher.size, 0, "ohne Längenangabe → nicht merken");
}
{
  // CORS-Abruf scheitert → Rückfall auf die Original-Anfrage (hier scheitert auch die – entscheidend: nichts gemerkt, Fehler nicht verschluckt)
  const w = welt(); w.setze(() => { throw new TypeError("cors"); });
  await assert.rejects(w.f.anhangHolen("REQ", U("https://x.supabase.co/storage/v1/object/sign/b/p.jpg?token=t")), TypeError);
  assert.deepEqual(w.log.map((x) => x[0]), ["https://x.supabase.co/storage/v1/object/sign/b/p.jpg?token=t", "REQ"], "zweiter Versuch mit Original-Anfrage");
  assert.equal(w.speicher.size, 0);
}
{
  const w = welt();
  for (let i = 0; i < w.f.ANHANG_MAX_ANZAHL + 5; i++) await w.f.anhangHolen("REQ", U(`https://x.supabase.co/storage/v1/object/sign/b/d${i}.jpg?token=t`));
  assert.equal(w.speicher.size, w.f.ANHANG_MAX_ANZAHL, "Obergrenze Anzahl");
  assert.ok(!w.speicher.has("https://x.supabase.co/storage/v1/object/sign/b/d0.jpg") && w.speicher.has(`https://x.supabase.co/storage/v1/object/sign/b/d${w.f.ANHANG_MAX_ANZAHL + 4}.jpg`), "älteste zuerst weg");
}
// Abmelden/Sperre löschen den Speicher
assert.ok(/async function geraetAbmelden\(\)[^]{0,1600}caches\.delete\("kcclub-anhaenge"\)/.test(app), "Abmelden löscht gemerkte Anlagen");
assert.ok(/r\.status === 423 && j\?\.gesperrt\)[^\n]{0,300}caches\.delete\("kcclub-anhaenge"\)/.test(app), "Sperre löscht gemerkte Anlagen");

// ---------- App: gemeinsamer Abruf der Chat-Übersicht ----------
assert.equal((app.match(/api\("unterhaltungen"/g) || []).length, 1, "nur noch ein direkter Abruf (im Helfer)");
const ENDE = "return UHH.laeuft.then(uhKopie);\n}";
const h = app.slice(app.indexOf("const UH_TEILEN_MS"), app.indexOf(ENDE) + ENDE.length);
let aufrufe = 0, jetzt = 1000;
const apiErsatz = async (a, d, o) => { aufrufe++; return { unterhaltungen: [{ id: "c" + aufrufe, ungelesen: 1 }], o }; };
const holen = new Function("api", "Date", h + "\nreturn unterhaltungenHolen;")(apiErsatz, { now: () => jetzt });
const a1 = await holen(); const a2 = await holen();
assert.equal(aufrufe, 1, "zweiter Abruf binnen 60 s aus dem gemeinsamen Stand");
a2.unterhaltungen[0].ungelesen = 0; assert.equal((await holen()).unterhaltungen[0].ungelesen, 1, "jede Stelle bekommt eine eigene Kopie"); void a1;
await holen(true); assert.equal(aufrufe, 2, "frisch holt immer");
jetzt += 61000; await holen(); assert.equal(aufrufe, 3, "nach 60 s neu");
const [x, y] = await Promise.all([holen(true), holen(true)]); assert.equal(aufrufe, 4, "gleichzeitige Abrufe zusammengelegt"); void x; void y;
assert.ok(/let u = \[\]; try \{ u = \(\(await unterhaltungenHolen\(true\)\)/.test(app), "Vorlesen ungelesener Nachrichten: frisch");
assert.ok(/async function unterhLaden\(\) \{\n\s+try \{\n\s+const \{ unterhaltungen \} = await unterhaltungenHolen\(true, \{ warten: true \}\);/.test(app), "Chat-Übersicht: frisch");
assert.ok(/id: "zentrale"[^\n]*laden: \(\) => unterhaltungenHolen\(\), neuMin: 5 \}/.test(app), "Kachel alle 5 Min. über gemeinsamen Abruf");
console.log("egress-sparen: ok");
