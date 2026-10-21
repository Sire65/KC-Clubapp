// KC-CLUB-ANRUF-TURN (2.563.0, 21.10.2026, Wunsch Hansi „als Sicherheit beim Anrufen und Video“): Browser-Test der Umleitung (TURN).
// Start: node tools/anruf/anruf-turn-browser.mjs <pfad-zu-node_modules-mit-node-turn>
//   (node-turn ist kein Teil der App – nur für diesen Test, z. B. „npm install node-turn@0.0.6“ in einem leeren Ordner)
// Zwei Browser-Kontexte = zwei Handys (Anna ruft, Bert nimmt an). Damit es keinen direkten Weg gibt, erlauben beide Seiten nur
// umgeleitete Wege (iceTransportPolicy „relay“) – wie in einem Netz, in dem sich zwei Handys nicht direkt finden. Der Umleitungs-Server
// läuft lokal (node-turn, Zugangsdaten wie bei Metered: Benutzer + Passwort). api() ist ein Schein-Server in Node (wie anruf-browser.mjs).
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire("/opt/node-tools/node_modules/");
const { chromium } = require("playwright");
const modulOrt = process.argv[2] || process.env.KC_NODE_TURN || "";
let Turn; try { Turn = createRequire(path.join(path.resolve(modulOrt), "x.js"))("node-turn"); } catch { console.log("node-turn nicht gefunden – Aufruf: node tools/anruf/anruf-turn-browser.mjs <ordner mit node_modules/node-turn>"); process.exit(2); }
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => {
  const rel = decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
  if (rel === "sw.js") { a.writeHead(404); return a.end(); }
  const f = path.join(wurzel, rel); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); });
}).listen(0);
const PORT = srv.address().port;
let fehler = 0; const ok = (b, t) => { console.log((b ? "ok:   " : "FEHLER: ") + t); if (!b) fehler++; };
const warte = (ms) => new Promise((x) => setTimeout(x, ms));
const bis = async (f, ms = 15000, schritt = 200) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await f()) return true; await warte(schritt); } return false; };

// ---------- lokaler Umleitungs-Server ----------
const TURN_PORT = 34780, TURN_USER = "kc-test", TURN_PW = "geheim-" + Math.random().toString(36).slice(2);
const turn = new Turn({ authMech: "long-term", credentials: { [TURN_USER]: TURN_PW }, listeningPort: TURN_PORT, listeningIps: ["127.0.0.1"], relayIps: ["127.0.0.1"], debugLevel: "OFF" });
turn.start();

// ---------- Schein-Server ----------
const ANRUFE = new Map(), LOG = [], DIAG = []; let nr = 0, WEGE = "turn";
const LEUTE = { pa: { person_id: "pa", name: "Anna Test", vorname: "Anna" }, pb: { person_id: "pb", name: "Bert Test", vorname: "Bert" } };
const ICE_TURN = [{ urls: [`turn:127.0.0.1:${TURN_PORT}`, `turn:127.0.0.1:${TURN_PORT}?transport=tcp`], username: TURN_USER, credential: TURN_PW }];
async function server(wer, action, p) {
  LOG.push({ wer, action, t: Date.now() });
  const holen = () => { const a = ANRUFE.get(String(p.id)); if (!a || (a.von !== wer && a.an !== wer)) throw new Error("Anruf nicht gefunden."); return a; };
  switch (action) {
    case "anruf_wege":
      if (WEGE === "langsam") { await warte(4000); return { ice: ICE_TURN, bis: new Date(Date.now() + 3600000).toISOString() }; }
      if (WEGE === "fehler") throw new Error("Metered gestört");
      if (WEGE === "kaputt") return { ice: [null, { urls: 5 }, { foo: 1 }, ...ICE_TURN], bis: new Date(Date.now() + 3600000).toISOString() };
      return WEGE === "keine" ? { ice: [], bis: null } : { ice: ICE_TURN, bis: new Date(Date.now() + 3600000).toISOString() };
    case "anruf_start": { const id = "r" + ++nr; ANRUFE.set(id, { id, von: wer, an: p.an, art: p.art, status: "klingelt", angebot: p.angebot, antwort: null }); return { ok: true, id }; }
    case "anruf_status": { const a = holen(), ichRufe = a.von === wer; return { id: a.id, status: a.status, ichRufe, art: a.art, konferenz: null, gegenueber: LEUTE[ichRufe ? a.an : a.von], ...(ichRufe ? { antwort: a.antwort, kurzantwort: null } : { angebot: a.angebot }) }; }
    case "anruf_annehmen": { const a = holen(); if (a.an !== wer || a.status !== "klingelt") throw new Error("409"); Object.assign(a, { status: "angenommen", antwort: p.antwort }); return { ok: true }; }
    case "anruf_ende": { const a = holen(); if (["klingelt", "angenommen"].includes(a.status)) a.status = a.status === "klingelt" ? "verpasst" : "beendet"; return { ok: true }; }
    case "diagnose": DIAG.push({ wer, ...p }); return { ok: true };
    default: return { ok: true };
  }
}
const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
async function geraet(pid, nurUmleitung = true) {
  const ctx = await browser.newContext({ viewport: { width: 400, height: 800 } });
  // kein direkter Weg: nur umgeleitete Kandidaten erlaubt (die App selbst setzt das nie – sie nimmt die Umleitung nur bei Bedarf)
  if (nurUmleitung) await ctx.addInitScript(() => { const Echt = window.RTCPeerConnection; window.__pcConfig = [];
    window.RTCPeerConnection = function (cfg) { window.__pcConfig.push(cfg); return new Echt({ ...(cfg || {}), iceTransportPolicy: "relay" }); };
    window.RTCPeerConnection.prototype = Echt.prototype; });
  const s = await ctx.newPage();
  s.on("pageerror", (e) => console.log(`[${pid}] Seitenfehler:`, String(e.message).slice(0, 200)));
  await s.route(/supabase\.co|googleapis|gstatic/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
  await s.exposeFunction("__srv", async (action, p) => { try { return { ok: true, r: await server(pid, action, p || {}) }; } catch (e) { return { ok: false, f: String(e.message) }; } });
  await s.goto(`http://localhost:${PORT}/index.html`); await s.waitForTimeout(2500);
  await s.evaluate((ich) => { ICH = ich; RT.ok = false; frage = async () => false; api = async (a, p) => { const x = await window.__srv(a, p); if (!x.ok) throw new Error(x.f); return x.r; }; }, LEUTE[pid]);
  return s;
}
async function anrufAufbauen(A, B, mitBild) {
  await A.evaluate((b) => { anrufen("pb", b); }, mitBild);
  await bis(() => [...ANRUFE.values()].some((a) => a.status === "klingelt"), 10000);
  const id = [...ANRUFE.values()].reverse().find((a) => a.status === "klingelt").id;
  await B.evaluate((i) => anrufEingehend(i), id); await warte(1500);
  const tAn = Date.now(); await B.evaluate((b) => anrufAnnehmen(b), mitBild);
  const da = await bis(async () => (await A.evaluate(() => !!RUF?.verbunden)) && (await B.evaluate(() => !!RUF?.verbunden)), 25000);
  return { id, da, ms: Date.now() - tAn };
}

// ---------- 1. Wege holen: Zusammensetzen, Merken, Zeitgrenze, Fehler, kaputte Einträge ----------
{
  const S = await geraet("pa", false);
  const lauf = async (wege) => { WEGE = wege; const n0 = LOG.filter((x) => x.action === "anruf_wege").length;
    const r = await S.evaluate(async () => { RUF_ICE = null; const t = performance.now(); const l = await rufIce(); return { l, ms: Math.round(performance.now() - t) }; });
    return { ...r, abrufe: LOG.filter((x) => x.action === "anruf_wege").length - n0 }; };
  const a = await lauf("turn");
  ok(a.l.length === 2 && /^stun:/.test(a.l[0].urls[0]) && a.l[1].username === TURN_USER, "Wege = bisherige STUN-Server + Umleitung mit Zugangsdaten");
  const zweit = await S.evaluate(async () => { const t = performance.now(); const l = await rufIce(); return { n: l.length, ms: Math.round(performance.now() - t) }; });
  ok(zweit.n === 2 && LOG.filter((x) => x.action === "anruf_wege").length === 1, "zweiter Anruf: gemerkte Wege, keine neue Server-Abfrage");
  const l = await lauf("langsam");
  ok(l.l.length === 1 && l.ms >= 2400 && l.ms < 3200, `Server zu langsam → nach ${l.ms} ms nur STUN (Grenze 2,5 s), Anruf wartet nicht länger`);
  const f = await lauf("fehler");
  ok(f.l.length === 1 && f.l[0].urls[0].startsWith("stun:"), "Umleitung gestört → nur STUN, kein Fehler für den Anruf");
  const k = await lauf("kaputt");
  ok(k.l.length === 2 && k.l[1].username === TURN_USER, "kaputte Einträge vom Server werden verworfen");
  const kein = await lauf("keine");
  const kein2 = await S.evaluate(async () => (await rufIce()).length);
  const nAbrufe = LOG.filter((x) => x.action === "anruf_wege").length; // turn, langsam, fehler, kaputt, keine = 5; der zweite „keine“-Aufruf kommt aus dem Merker
  ok(kein.l.length === 1 && kein2 === 1 && kein.abrufe === 1 && nAbrufe === 5, `ohne Umleitung: STUN, 10 Min. gemerkt – keine Abfrage-Flut (${nAbrufe} Abfragen für 7 Aufrufe)`);
  await S.context().close();
}

// ---------- 2. Videoanruf ohne direkten Weg → läuft über die Umleitung ----------
WEGE = "turn"; ANRUFE.clear(); LOG.length = 0;
let A = await geraet("pa"), B = await geraet("pb");
const v = await anrufAufbauen(A, B, true);
ok(v.da, `Videoanruf ohne direkten Weg über die Umleitung verbunden (Annehmen → verbunden ${v.ms} ms)`);
const cfg = await A.evaluate(() => window.__pcConfig.at(-1)?.iceServers?.map((x) => [].concat(x.urls).join(",")));
ok(cfg?.some((u) => u.includes(`turn:127.0.0.1:${TURN_PORT}`)), "Verbindung mit den Wegen vom Server aufgebaut (STUN + Umleitung)");
const weg = await bis(async () => (await A.evaluate(() => RUF?.weg)) === "umleitung" && (await B.evaluate(() => RUF?.weg)) === "umleitung", 12000);
ok(weg, "beide Seiten erkennen „über Umleitung“ (getStats: Kandidat relay)");
const rate = await A.evaluate(() => { const s = RUF.pc.getSenders().find((x) => x.track?.kind === "video"); return s.getParameters().encodings?.[0]?.maxBitrate; });
ok(rate === 300000, `Bild über Umleitung auf 300 kbit/s begrenzt (${rate}) – schont das freie Kontingent`);
const pakete = (s, art) => s.evaluate(async (k) => { let n = 0; (await RUF.pc.getStats()).forEach((x) => { if (x.type === "inbound-rtp" && x.kind === k) n += x.packetsReceived || 0; }); return n; }, art);
const t1 = await pakete(B, "audio"), b1 = await pakete(B, "video"); await warte(2000); const t2 = await pakete(B, "audio"), b2 = await pakete(B, "video");
ok(t2 > t1 && b2 > b1, `Ton und Bild kommen über die Umleitung an (${t2 - t1} Ton-, ${b2 - b1} Bild-Pakete in 2 s)`);
const stufen = await A.evaluate(async () => { const R = RUF, Q = R.q; Q.stufe = 1; await rufVideoRate(R.pc, rufQRate(R, 1), true); const s1 = R.pc.getSenders().find((x) => x.track?.kind === "video").getParameters().encodings[0].maxBitrate;
  Q.stufe = 0; await rufVideoRate(R.pc, rufQRate(R, 0), true); const s0 = R.pc.getSenders().find((x) => x.track?.kind === "video").getParameters().encodings[0].maxBitrate; return { s1, s0 }; });
ok(stufen.s1 === 150000 && stufen.s0 === 300000, `schwaches Netz über Umleitung: 150 kbit/s, danach zurück auf höchstens 300 (nicht 500) (${stufen.s1}/${stufen.s0})`);
await A.evaluate(() => anrufAuflegen()); await warte(800);
ok(DIAG.some((d) => d.wer === "pa" && d.art === "anruf" && d.daten?.umleitung === true), "Messung beim Auflegen: „umleitung: true“ (zeigt, wie oft die Umleitung gebraucht wird)");
await A.context().close(); await B.context().close();

// ---------- 3. Tonanruf ohne direkten Weg und OHNE Umleitung → scheitert wie bisher (Beweis, dass die Umleitung es rettet) ----------
WEGE = "keine"; ANRUFE.clear(); LOG.length = 0; DIAG.length = 0;
A = await geraet("pa"); B = await geraet("pb");
const ohne = await anrufAufbauen(A, B, false);
const weg2 = await bis(() => A.evaluate(() => !RUF), 40000);
ok(!ohne.da && weg2, "ohne Umleitung kommt in diesem Netz keine Verbindung zustande – die App meldet es wie bisher");
ok(DIAG.some((d) => d.art === "anruf" && d.daten?.verbunden === false && d.daten?.umleitungDa === false), "Fehlschlag-Messung sagt „Umleitung war nicht da“");
await A.context().close(); await B.context().close();

// ---------- 4. Tonanruf über die Umleitung ----------
WEGE = "turn"; ANRUFE.clear();
A = await geraet("pa"); B = await geraet("pb");
await A.evaluate(() => { RUF_ICE = null; }); await B.evaluate(() => { RUF_ICE = null; });
const ton = await anrufAufbauen(A, B, false);
ok(ton.da, `Tonanruf über die Umleitung verbunden (${ton.ms} ms)`);
const tt1 = await pakete(A, "audio"); await warte(1500); const tt2 = await pakete(A, "audio");
ok(tt2 > tt1, `Ton fließt (${tt2 - tt1} Pakete in 1,5 s)`);
await B.evaluate(() => anrufAuflegen()); await warte(500);
await A.context().close(); await B.context().close();

await browser.close(); srv.close(); turn.stop();
console.log(fehler ? `${fehler} FEHLER` : "alles ok"); process.exit(fehler ? 1 : 0);
