// KC-CLUB-ANRUF-BESSER (21.10.2026, Wunsch Hansi „bau 2 bis 4 jetzt“): Browser-Test der App-Anrufe mit zwei echten Chromium-Geräten.
// Start: node tools/anruf/anruf-browser.mjs            (neuer Stand: Aufbau, ICE-Neustart, Opus-FEC, Netz-schwach-Stufen, Abfragen zählen)
//        node tools/anruf/anruf-browser.mjs --vorher   (nur Abfragen zählen mit app.js aus git HEAD – Vergleich vorher/nachher)
// Zwei Browser-Kontexte = zwei Handys (Anna ruft, Bert nimmt an). Kamera/Mikrofon sind Chromium-Attrappen; api() ist in beiden Seiten
// durch einen gemeinsamen Schein-Server in Node ersetzt (anruf_start/status/annehmen/neu_angebot/neu_antwort/ende), Supabase ist gesperrt.
// Die Verbindung selbst ist echtes WebRTC zwischen den beiden Seiten.
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module"; import { execSync } from "node:child_process";
const require = createRequire("/opt/node-tools/node_modules/");
const { chromium } = require("playwright");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname), VORHER = process.argv.includes("--vorher");
const appJs = VORHER ? execSync("git show HEAD:app.js", { cwd: wurzel, maxBuffer: 1 << 28 }) : fs.readFileSync(path.join(wurzel, "app.js"));
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => {
  const rel = decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html";
  if (rel === "app.js") { a.writeHead(200, { "content-type": "text/javascript" }); return a.end(appJs); }
  if (rel === "sw.js") { a.writeHead(404); return a.end(); } // kein Service Worker im Test
  const f = path.join(wurzel, rel); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); });
}).listen(0);
const PORT = srv.address().port;
let fehler = 0; const ok = (b, t) => { console.log((b ? "ok:   " : "FEHLER: ") + t); if (!b) fehler++; };
const warte = (ms) => new Promise((x) => setTimeout(x, ms));
const bis = async (f, ms = 15000, schritt = 200) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await f()) return true; await warte(schritt); } return false; };

// ---------- Schein-Server (Regeln wie supabase/functions/kc-club/index.ts) ----------
const ANRUFE = new Map(), LOG = []; let nr = 0;
const ufrag = (s) => /a=ice-ufrag:(\S+)/.exec(String(s || ""))?.[1] || "";
const LEUTE = { pa: { person_id: "pa", name: "Anna Test", vorname: "Anna" }, pb: { person_id: "pb", name: "Bert Test", vorname: "Bert" } };
let seiten = {}, RT_AN = false;
const ping = (a) => { if (RT_AN) for (const pid of [a.von, a.an]) seiten[pid]?.evaluate(() => { try { rtSignal({ art: "anruf" }); } catch {} }).catch(() => {}); }; // wie Trigger kc_club_rt_anruf
function server(wer, action, p) {
  LOG.push({ wer, action, t: Date.now() });
  const holen = () => { const a = ANRUFE.get(String(p.id)); if (!a || (a.von !== wer && a.an !== wer)) throw new Error("Anruf nicht gefunden."); return a; };
  switch (action) {
    case "anruf_start": { const id = "r" + ++nr, a = { id, von: wer, an: p.an, art: p.art, status: "klingelt", angebot: p.angebot, antwort: null, konferenz_id: null }; ANRUFE.set(id, a); ping(a); return { ok: true, id }; }
    case "anruf_status": { const a = holen(), ichRufe = a.von === wer; return { id: a.id, status: a.status, ichRufe, art: a.art, konferenz: null, gegenueber: LEUTE[ichRufe ? a.an : a.von], ...(ichRufe ? { antwort: a.antwort, kurzantwort: null } : { angebot: a.angebot }) }; }
    case "anruf_annehmen": { const a = holen(); if (a.an !== wer || a.status !== "klingelt") throw new Error("409"); Object.assign(a, { status: "angenommen", antwort: p.antwort }); ping(a); return { ok: true }; }
    case "anruf_neu_angebot": { const a = holen(); if (a.von !== wer) throw new Error("403"); if (a.status !== "angenommen") throw new Error("409"); Object.assign(a, { angebot: p.angebot, antwort: null }); ping(a); return { ok: true }; }
    case "anruf_neu_antwort": { const a = holen(); if (a.an !== wer) throw new Error("403"); if (a.status !== "angenommen" || a.antwort || p.fuer !== ufrag(a.angebot)) throw new Error("Veraltete Verbindungsdaten."); a.antwort = p.antwort; ping(a); return { ok: true }; }
    case "anruf_ende": { const a = holen(); if (["klingelt", "angenommen"].includes(a.status)) { a.status = a.status === "klingelt" ? "verpasst" : "beendet"; ping(a); } return { ok: true, status: a.status }; }
    default: return { ok: true };
  }
}

const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
async function geraet(pid) {
  const ctx = await browser.newContext({ viewport: { width: 400, height: 800 } });
  const s = await ctx.newPage();
  s.on("pageerror", (e) => console.log(`[${pid}] Seitenfehler:`, String(e.message).slice(0, 200)));
  await s.route(/supabase\.co|googleapis|gstatic/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
  await s.exposeFunction("__srv", (action, p) => { try { return { ok: true, r: server(pid, action, p || {}) }; } catch (e) { return { ok: false, f: String(e.message) }; } });
  await s.goto(`http://localhost:${PORT}/index.html`); await s.waitForTimeout(2500);
  await s.evaluate(({ ich, rt }) => {
    ICH = ich; RT.ok = rt; frage = async () => false; // „Nachricht schreiben?“ nach Fehlschlag: nein
    api = async (a, p) => { const x = await window.__srv(a, p); if (!x.ok) throw new Error(x.f); return x.r; };
  }, { ich: LEUTE[pid], rt: RT_AN });
  return s;
}
const zaehle = (von, bis2, wer) => LOG.filter((x) => x.t >= von && x.t < bis2 && (!wer || x.wer === wer) && x.action.startsWith("anruf_")).length;

async function anrufAufbauen(A, B, mitBild, klingelMs = 4000) {
  const t0 = Date.now();
  await A.evaluate((b) => { anrufen("pb", b); }, mitBild);
  await bis(() => [...ANRUFE.values()].some((a) => a.status === "klingelt"), 10000);
  const id = [...ANRUFE.values()].reverse().find((a) => a.status === "klingelt").id;
  await B.evaluate((i) => anrufEingehend(i), id); // im echten Leben: Push oder Online-Takt
  await warte(klingelMs);
  const tAn = Date.now();
  await B.evaluate((b) => anrufAnnehmen(b), mitBild);
  const da = await bis(async () => (await A.evaluate(() => !!RUF?.verbunden)) && (await B.evaluate(() => !!RUF?.verbunden)), 20000);
  return { id, t0, tAn, tDa: Date.now(), da };
}

// ---------- Vergleich vorher/nachher: Abfragen beim Aufbau und im laufenden Gespräch ----------
async function zaehlLauf(rt) {
  RT_AN = rt; ANRUFE.clear(); LOG.length = 0;
  const A = await geraet("pa"), B = await geraet("pb"); seiten = { pa: A, pb: B };
  const { t0, tAn, tDa, da } = await anrufAufbauen(A, B, false, 6000);
  const tRuhe = Date.now(); await warte(12000); const tEnde = Date.now();
  const erg = { rt, da, klingeln_s: Math.round((tAn - t0) / 100) / 10, annehmen_bis_verbunden_ms: tDa - tAn,
    aufbau_rufer: zaehle(t0, tDa, "pa"), aufbau_angerufen: zaehle(t0, tDa, "pb"), gespraech_12s: zaehle(tRuhe, tEnde) };
  await B.evaluate(() => anrufAuflegen()); await warte(500);
  await A.context().close(); await B.context().close();
  return erg;
}
if (VORHER) {
  console.log("VORHER (git HEAD), ohne direkte Leitung:", JSON.stringify(await zaehlLauf(false)));
  console.log("VORHER (git HEAD), mit direkter Leitung:", JSON.stringify(await zaehlLauf(true)));
  await browser.close(); srv.close(); process.exit(0);
}

// ---------- 1. Einzelteile in einer Seite: Opus-SDP, ICE-Sammeln ----------
{
  RT_AN = false; const S = await geraet("pa");
  const r = await S.evaluate(async () => {
    const o = {};
    const ohne = "v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111 0\r\na=rtpmap:111 opus/48000/2\r\na=rtpmap:0 PCMU/8000\r\n";
    const mit = "v=0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n";
    o.ohne = sdpOpus(ohne); o.mit = sdpOpus(mit); o.zweimal = sdpOpus(sdpOpus(mit)) === sdpOpus(mit); o.kaputt = sdpOpus(undefined); o.pcmu = sdpOpus("v=0\r\na=rtpmap:0 PCMU/8000\r\n");
    const schein = (sdp, fertigNach) => { const pc = new EventTarget(); pc.iceGatheringState = "gathering"; pc.localDescription = { sdp };
      if (fertigNach) setTimeout(() => { pc.iceGatheringState = "complete"; pc.dispatchEvent(new Event("icegatheringstatechange")); }, fertigNach); return pc; };
    const miss = async (pc) => { const t = performance.now(); await iceFertig(pc); return Math.round(performance.now() - t); };
    o.srflx = await miss(schein("a=candidate:1 1 udp 1 1.2.3.4 5 typ srflx raddr 0.0.0.0 rport 0"));
    o.nurHost = await miss(schein("a=candidate:1 1 udp 1 10.0.0.1 5 typ host"));
    o.fertig = await miss(schein("a=candidate:1 1 udp 1 10.0.0.1 5 typ host", 300));
    return o;
  });
  ok(/a=rtpmap:111 opus\/48000\/2\r\na=fmtp:111 useinbandfec=1;usedtx=1\r\n/.test(r.ohne), "Opus ohne fmtp → fmtp mit useinbandfec=1;usedtx=1 ergänzt");
  ok(/a=fmtp:111 minptime=10;useinbandfec=1;usedtx=1\r\n/.test(r.mit) && r.mit.split("useinbandfec").length === 2, "Opus mit fmtp → nur usedtx ergänzt, useinbandfec nicht doppelt");
  ok(r.zweimal, "Opus-Anpassung zweimal angewandt = einmal (stabil)");
  ok(r.kaputt === "undefined" || r.kaputt === undefined || typeof r.kaputt === "string", "kaputtes SDP wirft nicht");
  ok(!/fmtp/.test(r.pcmu), "ohne Opus bleibt das SDP unverändert");
  ok(r.srflx >= 1400 && r.srflx < 2000, `ICE: mit srflx-Kandidat fertig nach ${r.srflx} ms (Ziel ~1500, vorher bis 3500)`);
  ok(r.nurHost >= 2900 && r.nurHost < 3400, `ICE: nur Host-Kandidaten → harte Grenze ${r.nurHost} ms (vorher 3500)`);
  ok(r.fertig >= 250 && r.fertig < 700, `ICE: Sammeln fertig → sofort weiter (${r.fertig} ms)`);
  await S.context().close();
}

// ---------- 2. Echter Videoanruf zwischen zwei Seiten ----------
RT_AN = false; ANRUFE.clear(); LOG.length = 0;
const A = await geraet("pa"), B = await geraet("pb"); seiten = { pa: A, pb: B };
const auf = await anrufAufbauen(A, B, true, 2000);
ok(auf.da, `Videoanruf verbunden (Annehmen → verbunden ${auf.tDa - auf.tAn} ms)`);
const sdpA = await A.evaluate(() => ({ lokal: RUF.pc.localDescription.sdp, fern: RUF.pc.remoteDescription.sdp }));
const opusFmtp = (s) => { const pt = /a=rtpmap:(\d+) opus\/48000/.exec(s)?.[1]; return new RegExp(`a=fmtp:${pt} [^\\r\\n]*`).exec(s)?.[0] || ""; };
ok(/useinbandfec=1/.test(opusFmtp(sdpA.lokal)) && /usedtx=1/.test(opusFmtp(sdpA.lokal)), "Angebot (Anna): Opus mit useinbandfec=1 und usedtx=1 – " + opusFmtp(sdpA.lokal));
ok(/useinbandfec=1/.test(opusFmtp(sdpA.fern)) && /usedtx=1/.test(opusFmtp(sdpA.fern)), "Antwort (Bert): Opus mit useinbandfec=1 und usedtx=1");
const para = await A.evaluate(() => { const s = RUF.pc.getSenders().find((x) => x.track?.kind === "video"), p = s.getParameters(); return { max: p.encodings?.[0]?.maxBitrate, dp: p.degradationPreference ?? null }; });
ok(para.max === 500000, `Video-Sender startet mit maxBitrate 500 kbit/s (${para.max}, degradationPreference=${para.dp})`);
const takt = await A.evaluate(() => RUF.taktMs);
ok(takt === 3000, `Takt im Gespräch ohne direkte Leitung = 3 s wie vorher (${takt})`);

// ---------- 3. ICE-Neustart: Verbindung „wackelt“ > 3 s auf beiden Seiten → Anrufer baut neu auf ----------
const vorUfrag = await A.evaluate(() => ({ lokal: /a=ice-ufrag:(\S+)/.exec(RUF.pc.localDescription.sdp)[1], fern: /a=ice-ufrag:(\S+)/.exec(RUF.pc.remoteDescription.sdp)[1] }));
const stoeren = (s) => s.evaluate(() => { Object.defineProperty(RUF.pc, "connectionState", { get: () => "disconnected", configurable: true }); RUF.pc.onconnectionstatechange(); });
const heilen = (s) => s.evaluate(() => { delete RUF.pc.connectionState; });
await stoeren(A); await stoeren(B); await warte(3600);
const zustB = await B.evaluate(() => $("anrufZustand").textContent), zustA = await A.evaluate(() => $("anrufZustand").textContent);
ok(/neu aufgebaut/.test(zustA) && /neu aufgebaut/.test(zustB), `Hinweis „🔄 Verbindung wird neu aufgebaut …“ (Anna: ${zustA} · Bert: ${zustB})`);
await heilen(A); await heilen(B);
const neuOk = await bis(async () => LOG.some((x) => x.action === "anruf_neu_antwort") && (await A.evaluate(() => !RUF?.neu && RUF?.pc.signalingState === "stable" && RUF.pc.connectionState === "connected")), 15000);
const nachUfrag = await A.evaluate(() => ({ lokal: /a=ice-ufrag:(\S+)/.exec(RUF.pc.localDescription.sdp)[1], fern: /a=ice-ufrag:(\S+)/.exec(RUF.pc.remoteDescription.sdp)[1] }));
ok(neuOk, "ICE-Neustart über anruf_neu_angebot/anruf_neu_antwort abgeschlossen, Verbindung wieder „connected“");
ok(nachUfrag.lokal !== vorUfrag.lokal && nachUfrag.fern !== vorUfrag.fern, `neue ICE-Zugangsdaten auf beiden Seiten (ufrag ${vorUfrag.lokal}→${nachUfrag.lokal}, ${vorUfrag.fern}→${nachUfrag.fern})`);
const paket = () => A.evaluate(async () => { let n = 0; (await RUF.pc.getStats()).forEach((s) => { if (s.type === "inbound-rtp" && s.kind === "audio") n += s.packetsReceived || 0; }); return n; });
const p1 = await paket(); await warte(1500); const p2 = await paket();
ok(p2 > p1, `Ton fließt nach dem Neustart weiter (${p2 - p1} Pakete in 1,5 s)`);
await bis(() => B.evaluate(() => !RUF?.neu), 5000);
ok(await B.evaluate(() => !!RUF && !RUF.neu && RUF.verbunden), "Bert: Neuaufbau-Zustand beendet, Gespräch läuft");

// ---------- 4. Netzwechsel-Ereignis („online“) → früher Neustart, auch wenn die Verbindung noch steht ----------
const vorher = LOG.filter((x) => x.action === "anruf_neu_angebot").length;
await warte(5200); // Mindestabstand 5 s zum letzten Neustart
await A.evaluate(() => window.dispatchEvent(new Event("online")));
const frueh = await bis(() => LOG.filter((x) => x.action === "anruf_neu_angebot").length > vorher && LOG.filter((x) => x.action === "anruf_neu_antwort").length >= 2, 10000);
await bis(() => A.evaluate(() => RUF?.pc.signalingState === "stable" && RUF.pc.connectionState === "connected"), 8000);
ok(frueh && await A.evaluate(() => RUF?.pc.connectionState === "connected"), "„online“-Ereignis löst ICE-Neustart aus, Verbindung bleibt stehen");

// ---------- 5. Netz schwach (eingeschleuste Statistik) → Hinweis, 150 kbit/s, Bild pausiert, schrittweise zurück ----------
const q = await A.evaluate(async () => {
  clearInterval(RUF.q.uhr); const pc = RUF.pc, echt = pc.getStats.bind(pc); let lost = 0, recv = 0, schlecht = true;
  pc.getStats = async () => { recv += 100; if (schlecht) lost += 20; return new Map([["in1", { id: "in1", type: "inbound-rtp", kind: "audio", packetsLost: lost, packetsReceived: recv }]]); };
  const sender = () => { const p = pc.getSenders().find((x) => x.track?.kind === "video").getParameters().encodings[0]; return `${p.maxBitrate}/${p.active}`; };
  const schritt = async () => { await anrufQualitaet(); return { stufe: RUF.q.stufe, hinweis: $("anrufSchwach").classList.contains("versteckt") ? "" : $("anrufSchwach").textContent, sender: sender() }; };
  const o = []; for (let i = 0; i < 4; i++) o.push(await schritt());
  schlecht = false; for (let i = 0; i < 6; i++) o.push(await schritt());
  pc.getStats = echt; return o;
});
ok(q[0].hinweis === "" && q[1].hinweis === "📶 Verbindung schwach" && q[1].sender === "150000/true", `2× schlecht → Hinweis + 150 kbit/s (${JSON.stringify(q[1])})`);
ok(q[3].stufe === 2 && /Bild pausiert – Ton läuft weiter/.test(q[3].hinweis) && q[3].sender.endsWith("/false"), `weiter schlecht → Bild pausiert (${JSON.stringify(q[3])})`);
ok(q[6].stufe === 1 && q[6].sender === "150000/true", `3× gut → Bild wieder an mit 150 kbit/s (${JSON.stringify(q[6])})`);
ok(q[9].stufe === 0 && q[9].sender === "500000/true" && q[9].hinweis === "", `3× gut → 500 kbit/s, Hinweis weg (${JSON.stringify(q[9])})`);
const rtt = await A.evaluate(async () => { const pc = RUF.pc, echt = pc.getStats.bind(pc); RUF.q.schwach = false; RUF.q.schlecht = 0;
  pc.getStats = async () => new Map([["cp", { id: "cp", type: "candidate-pair", nominated: true, state: "succeeded", currentRoundTripTime: 0.9 }]]);
  await anrufQualitaet(); await anrufQualitaet(); pc.getStats = echt; return RUF.q.schwach; });
ok(rtt, "Laufzeit > 600 ms (2×) → ebenfalls „Verbindung schwach“");

// ---------- 6. Auflegen: Gegenseite merkt es, Zeitgeber weg ----------
await B.evaluate(() => anrufAuflegen());
ok(await bis(() => A.evaluate(() => RUF === null), 6000), "Bert legt auf → Anna beendet (RUF weg, Statistik-Zeitgeber geräumt)");
ok(await A.evaluate(() => $("anrufSchwach").classList.contains("versteckt")), "Hinweis „schwach“ nach dem Auflegen versteckt");

// ---------- 7. Reiner Tonanruf: schlechte Statistik → nur Hinweis, Ton-Sender unverändert ----------
const ton = await anrufAufbauen(A, B, false, 1000);
ok(ton.da, "Tonanruf verbunden");
const tq = await A.evaluate(async () => { clearInterval(RUF.q.uhr); const pc = RUF.pc; let lost = 0, recv = 0;
  pc.getStats = async () => { recv += 100; lost += 30; return new Map([["in1", { id: "in1", type: "inbound-rtp", kind: "audio", packetsLost: lost, packetsReceived: recv }]]); };
  for (let i = 0; i < 4; i++) await anrufQualitaet();
  const p = pc.getSenders().find((x) => x.track?.kind === "audio").getParameters().encodings[0];
  return { hinweis: $("anrufSchwach").textContent, stufe: RUF.q.stufe, aktiv: p.active !== false, max: p.maxBitrate ?? null, verbunden: RUF.verbunden }; });
ok(tq.hinweis === "📶 Verbindung schwach" && tq.stufe === 0 && tq.aktiv && tq.max === null && tq.verbunden, `Tonanruf: Hinweis ja, keine Bild-Stufe, Ton-Sender unberührt (${JSON.stringify(tq)})`);
await A.evaluate(() => anrufAuflegen()); await bis(() => B.evaluate(() => RUF === null), 6000);

// ---------- 8. Neustart scheitert dreimal → bisherige Fehlerbehandlung (mit kürzeren Fristen) ----------
const f = await anrufAufbauen(A, B, false, 500);
await B.evaluate(() => { rufNeuAntworten = async () => {}; }); // Bert antwortet nie
await A.evaluate(() => { RUF_NEU.versuch = 1500; RUF_NEU.frist = 10000; Object.defineProperty(RUF.pc, "connectionState", { get: () => "failed", configurable: true }); RUF.pc.onconnectionstatechange(); });
const aus = await bis(() => A.evaluate(() => RUF === null), 15000);
const versuche = LOG.filter((x) => x.wer === "pa" && x.action === "anruf_neu_angebot" && x.t > f.tDa).length;
ok(f.da && aus && versuche === 3, `3 vergebliche Neustarts → Anruf beendet wie bisher (${versuche} Versuche)`);
ok([...ANRUFE.values()].pop().status === "beendet", "Server: Anruf auf „beendet“ gesetzt");
await A.context().close(); await B.context().close();

// ---------- 9. Abfragen zählen (neuer Stand) ----------
console.log("NACHHER, ohne direkte Leitung:", JSON.stringify(await zaehlLauf(false)));
console.log("NACHHER, mit direkter Leitung:", JSON.stringify(await zaehlLauf(true)));

await browser.close(); srv.close();
console.log(fehler ? `${fehler} FEHLER` : "alles ok"); process.exit(fehler ? 1 : 0);
