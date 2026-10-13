// KC-CLUB-VIDEO-STIMMEN-DOWNLOAD (2.348.0, Wunsch Hansi „User sucht sich eine Stimme aus, klickt sie an – die App holt sie und installiert sie,
// egal welcher Browser“). Läuft als Hintergrund-Arbeiter (Web Worker), damit die App beim Sprechen nicht hakt.
// Piper-Stimmen (freie Stimmen, Rhasspy Piper) + ONNX Runtime Web + eSpeak-Aussprache – alles liegt neben der App unter stimmen/.
// Einmal geladen, liegen die Dateien im Browser-Speicher (Cache „kc-stimmen-v1“) und funktionieren danach auch ohne Netz.
// Nachrichten: laden {id} · sprich {nr, text, tempo} · da {} · weg {id}. Antworten: fortschritt, bereit, audio, da, fehler.
"use strict";
const CACHE = "kc-stimmen-v1";
const BASIS = new URL("./", self.location.href).href; // …/stimmen/
const LIB = BASIS + "lib/";
importScripts(LIB + "ort.wasm.min.js", LIB + "piper_phonemize.js");
ort.env.wasm.numThreads = 1; // GitHub Pages ohne Cross-Origin-Isolation → ohne Threads
ort.env.wasm.wasmPaths = LIB;

const S = { id: null, sitzung: null, konfig: null, phonDaten: null, phonWasm: null };
const melde = (typ, d = {}) => self.postMessage({ typ, ...d });

async function holen(url, fortschritt) { // aus dem Browser-Speicher oder vom Server (mit Fortschritt) – dann merken
  const c = await caches.open(CACHE);
  const da = await c.match(url); if (da) return da.blob();
  const r = await fetch(url); if (!r.ok) throw new Error("Laden fehlgeschlagen (" + r.status + ")");
  const gesamt = +(r.headers.get("Content-Length") || 0), teile = []; let geladen = 0;
  const leser = r.body?.getReader();
  if (!leser) { const b = await r.blob(); await c.put(url, new Response(b)); return b; }
  for (;;) { const { done, value } = await leser.read(); if (done) break; teile.push(value); geladen += value.length; fortschritt?.(geladen, gesamt); }
  const b = new Blob(teile, { type: r.headers.get("Content-Type") || "application/octet-stream" });
  await c.put(url, new Response(b, { headers: { "Content-Length": String(b.size) } }));
  return b;
}
const LIB_DATEIEN = ["piper_phonemize.data", "piper_phonemize.wasm", "ort-wasm-simd.wasm"];
async function laden(id) {
  if (S.id === id && S.sitzung) return melde("bereit", { id });
  // Größen für die Fortschrittsanzeige: Bibliothek (einmalig für alle Stimmen) + Stimme
  const dateien = [...LIB_DATEIEN.map((f) => LIB + f), BASIS + id + ".onnx.json", BASIS + id + ".onnx"];
  const stand = new Map();
  const zeigen = () => { let g = 0, t = 0; for (const [, x] of stand) { g += x.g; t += x.t; } melde("fortschritt", { id, geladen: g, gesamt: t }); };
  const blobs = await Promise.all(dateien.map((u) => holen(u, (g, t) => { stand.set(u, { g, t }); zeigen(); })));
  const [daten, wasm, , json, modell] = blobs;
  S.phonDaten = URL.createObjectURL(daten); S.phonWasm = URL.createObjectURL(wasm);
  S.konfig = JSON.parse(await json.text());
  S.sitzung = await ort.InferenceSession.create(new Uint8Array(await modell.arrayBuffer()), { executionProviders: ["wasm"] });
  S.id = id; melde("bereit", { id });
}
// Laut-Nummern immer aus der Laut-Tabelle DIESER Stimme bilden (ältere/kleine Stimmen kennen weniger Laute als die eingebaute Tabelle):
// ^ Anfang, zwischen jedem Laut _ (Pause-Zeichen), $ Ende – wie Piper selbst. Unbekannte Laute werden ausgelassen.
function idsAusLauten(j) {
  const map = S.konfig?.phoneme_id_map, laute = j?.phonemes;
  if (!map || !Array.isArray(laute) && typeof laute !== "string") return null;
  const liste = Array.isArray(laute) ? laute : [...laute], id = (x) => map[x]?.[0], ids = [];
  const pad = id("_"), anf = id("^"), ende = id("$");
  if (anf != null) ids.push(anf); if (pad != null) ids.push(pad);
  for (const l of liste) { const n = id(l); if (n == null) continue; ids.push(n); if (pad != null) ids.push(pad); }
  if (ende != null) ids.push(ende);
  return ids.length > 3 ? ids : null;
}
function lautIds(text) { // Text → Laut-Nummern (eSpeak über Piper-Phonemize); je Satz eine Liste
  return new Promise((ok, schief) => {
    const listen = [];
    createPiperPhonemize({
      print: (zeile) => { try { const j = JSON.parse(zeile); listen.push(idsAusLauten(j) || j.phoneme_ids); } catch {} },
      printErr: () => {},
      locateFile: (u) => (u.endsWith(".wasm") ? S.phonWasm : u.endsWith(".data") ? S.phonDaten : u),
    }).then((m) => {
      try { m.callMain(["-l", S.konfig.espeak.voice, "--input", JSON.stringify([{ text }]), "--espeak_data", "/espeak-ng-data"]); } catch (e) { if (!listen.length) return schief(e); }
      ok(listen);
    }, schief);
  });
}
async function sprich(nr, text, tempo) {
  if (typeof nr === "number" && nr <= (S.abbruch || 0)) return; // inzwischen weitergeblättert
  if (!S.sitzung) throw new Error("Stimme nicht geladen");
  const listen = await lautIds(String(text || "").trim());
  const inf = S.konfig.inference || {}, rate = S.konfig.audio.sample_rate, teile = [];
  for (const ids of listen) {
    if (!ids?.length) continue;
    const feeds = {
      input: new ort.Tensor("int64", BigInt64Array.from(ids.map(BigInt)), [1, ids.length]),
      input_lengths: new ort.Tensor("int64", BigInt64Array.from([BigInt(ids.length)]), [1]),
      scales: new ort.Tensor("float32", Float32Array.from([inf.noise_scale ?? 0.667, (inf.length_scale ?? 1) / (tempo || 1), inf.noise_w ?? 0.8]), [3]),
    };
    if (Object.keys(S.konfig.speaker_id_map || {}).length) feeds.sid = new ort.Tensor("int64", BigInt64Array.from([0n]), [1]);
    const { output } = await S.sitzung.run(feeds);
    teile.push(output.data, new Float32Array(Math.round(rate * 0.18))); // kurze Pause zwischen den Sätzen
  }
  const n = teile.reduce((a, t) => a + t.length, 0), pcm = new Float32Array(n); let p = 0;
  for (const t of teile) { pcm.set(t, p); p += t.length; }
  melde("audio", { nr, pcm, rate, ids: nr === "pruefen" ? listen : undefined });
}
async function vorhanden() {
  const c = await caches.open(CACHE), keys = await c.keys();
  return keys.map((k) => k.url).filter((u) => u.endsWith(".onnx")).map((u) => u.split("/").pop().replace(/\.onnx$/, ""));
}
let REIHE = Promise.resolve(); // eine Aufgabe nach der anderen (die Stimme kann nicht zwei Sätze gleichzeitig rechnen)
self.onmessage = (e) => { if (e.data?.typ === "abbruch") { S.abbruch = e.data.bis; return; } REIHE = REIHE.then(() => arbeiten(e)); }; // abbruch: alte Sätze nicht mehr rechnen
async function arbeiten(e) {
  const d = e.data || {};
  try {
    if (d.typ === "laden") await laden(d.id);
    else if (d.typ === "sprich") await sprich(d.nr, d.text, d.tempo);
    else if (d.typ === "da") melde("da", { liste: await vorhanden() });
    else if (d.typ === "weg") { const c = await caches.open(CACHE); await c.delete(BASIS + d.id + ".onnx"); await c.delete(BASIS + d.id + ".onnx.json"); if (S.id === d.id) { S.id = null; S.sitzung = null; } melde("da", { liste: await vorhanden() }); }
  } catch (f) { melde("fehler", { nr: d.nr, id: d.id, text: String(f?.message || f) }); }
}
