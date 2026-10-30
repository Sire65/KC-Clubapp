// 2.766.0 KC-CLUB-RUNDER-TISCH-LIVE: echter Live-Test im Browser – drei Fenster (A leitet, B, C) sitzen am selben Tisch und schalten Live dazu.
// Ton und Bild laufen wirklich (WebRTC zwischen den Fenstern, Kamera/Mikrofon künstlich von Chromium), die Live-Leitung (Supabase Realtime)
// ist im Test nachgebaut: ein kleiner Verteiler reicht jede Broadcast-Nachricht an alle anderen Fenster weiter. Kein echter Server, keine echten Daten.
// Geprüft: alle sehen sich; offenes Gespräch – jeder hört die beiden anderen (Ton kommt an); Kamera von A kommt bei B als Bild an;
// A zeigt ein PDF – B sieht es und folgt beim Blättern; B schaltet Live aus – A und C sehen es und bauen ab; A teilt den Bildschirm;
// Redestab (✋ melden, Stab geben und zurücknehmen). Rot bei Programmfehlern.
// Braucht Playwright mit Chromium. Läuft eigenständig: node tests/tisch-live.browser.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MUSIK = "dddddddd-2222-3333-4444-555555555555"; // 🎵 Testlied = simjue-orgel.mp3 aus dem Repo
const VIDEO = "eeeeeeee-2222-3333-4444-555555555555";
// 2.776.0 KC-CLUB-RUNDER-TISCH-GAST: externer Tischgast mit Gast-Link (eigener Start, nur erlaubte Anfragen)
const GAST_TOKEN = "tg_" + "c0ffee".repeat(8), GAST_ID = "ffffffff-2222-3333-4444-555555555555", GAST_PID = "TG-" + GAST_ID;
const GAST_ERLAUBT = new Set(["tischgast_init", "tisch_platz", "tisch_verlassen", "anlage_url", "anruf_wege", "diagnose", "ping"]); // = TISCHGAST_AKTIONEN im Server // 🎬 Testvideo = film/sicherheit-datenschutz.mp4 aus dem Repo
const TISCH = "aaaaaaaa-2222-3333-4444-555555555555", CHAT = "bbbbbbbb-2222-3333-4444-555555555555", PDF = "cccccccc-2222-3333-4444-555555555555";
const LIVE = { kanal: "kc-fh-" + "ab".repeat(16), schluessel: Buffer.alloc(32, 7).toString("base64") };
const LEUTE = [{ id: "KC-P-LIVE-A", name: "Anna Probe" }, { id: "KC-P-LIVE-B", name: "Bernd Probe" }, { id: "KC-P-LIVE-C", name: "Carla Probe" }];
const jetzt = Date.now(), iso = (m) => new Date(jetzt + m * 60000).toISOString();
const tisch = { id: TISCH, art: "besprechung", thema: "Weihnachtsmarkt", beschreibung: "", beginn: iso(-5), ende: iso(55), dauer: 60, verlaengert: 0, plaetze: 4, text: "Heute · 60 Min.", phase: "offen",
  gastgeber: LEUTE[0].id, gastgeberName: LEUTE[0].name, darfLeiten: false, chat: CHAT, imChat: true, tagesordnung: ["Schilder"], meineZusage: "ja", ichSitze: true,
  zusagen: [], amTisch: LEUTE.map((p) => ({ ...p, sicher: true })), warenDa: 0 };
const lage = (ich) => ({ aktiv: true, gruppen: [], regeln: { plaetzeMin: 4, plaetzeMax: 18, dauern: [30, 60, 90], vorlaufMin: 15, herzSek: 60 }, tische: [{ ...tisch, darfLeiten: ich === LEUTE[0].id }] });

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".mp3": "audio/mpeg", ".wasm": "application/wasm", ".woff2": "font/woff2", ".pdf": "application/pdf" };
const server = http.createServer((req, res) => {
  const p = path.normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const datei = path.join(WURZEL, p || "index.html");
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(datei)] || "application/octet-stream" }); fs.createReadStream(datei).pipe(res);
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const BASIS = `http://127.0.0.1:${server.address().port}`;

// Nachgebaute Live-Leitung: wer einem Kanal beitritt, bekommt jede Broadcast-Nachricht der anderen (wie Supabase Realtime, self: false)
const verteiler = new Set();
function leitung(ws) {
  const s = { ws, topics: new Set() }; verteiler.add(s);
  ws.onMessage((roh) => {
    let m; try { m = JSON.parse(String(roh)); } catch { return; }
    if (m.event === "phx_join") { s.topics.add(m.topic); ws.send(JSON.stringify({ topic: m.topic, event: "phx_reply", ref: m.ref, payload: { status: "ok", response: {} } })); }
    else if (m.event === "heartbeat") ws.send(JSON.stringify({ topic: "phoenix", event: "phx_reply", ref: m.ref, payload: { status: "ok", response: {} } }));
    else if (m.event === "broadcast") for (const x of verteiler) if (x !== s && x.topics.has(m.topic)) x.ws.send(JSON.stringify({ topic: m.topic, event: "broadcast", payload: m.payload }));
  });
  ws.onClose(() => verteiler.delete(s));
}

const fehler = [], melde = (t) => fehler.push(t);
const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
const TL_HERZ_PRUEF_MS = 16000; // ein Lebenszeichen-Takt (15 s) – danach darf nichts wieder anspringen
const seiten = [];
try {
  for (const p of LEUTE) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: "block", locale: "de-DE", timezoneId: "Europe/Berlin", permissions: ["microphone", "camera"],
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" });
    const seite = await ctx.newPage(), name = p.name.split(" ")[0];
    seite.on("pageerror", (e) => melde(`[${name}] Programmfehler: ${String(e.message || e).slice(0, 200)}`));
    await seite.routeWebSocket(/realtime\/v1\/websocket/, leitung);
    await seite.route("**/*", (r) => {
      const u = new URL(r.request().url());
      if (u.origin === BASIS || u.protocol === "data:" || u.protocol === "blob:") return r.continue();
      if (/\/functions\/v1\/kc-club$/.test(u.pathname)) {
        let a = "", body = {}; try { body = JSON.parse(r.request().postData() || "{}"); a = body.action; } catch {}
        const ant = {
          init: { ok: true, ich: { person_id: p.id, vorname: name, name: p.name, admin: true, vorstand: true, aemter: [], rollen: [] }, rtKanal: "kc-rt-" + p.id.toLowerCase(),
            einstellungen: { begruessung: { gesehen: true }, unterstuetzung: "normal", einweisung: { an: false, gesehen: {} }, spiel_einladung: { an: false }, ansicht: { art: "erweitert", gewaehlt: true }, einladung: { aus: true } },
            mitglieder: [], treffen: [], chats: [], pinnwand: [], termine: [], zaehler: {}, kacheln: null, freigaben: { runder_tisch: "alle" } },
          fotos_liste: { fotos: [], themen: [], jahre: [], anlaesse: [], speicher: { prozent: 0, belegt: 0, grenze: 1 }, papierkorb: 0, alben: [], albenKorb: 0, album: null },
          tisch_liste: lage(p.id), tisch_platz: { ok: true, ergebnis: "da", lage: lage(p.id), live: LIVE }, anruf_wege: { ice: [], bis: iso(60) },
          tisch_gast_einladen: { ok: true, link: `${BASIS}/index.html?g=${GAST_TOKEN}`, gast: { id: GAST_ID, name: "Dr. Probe", rolle: "Experte" }, gueltig: { ab: iso(-35), bis: iso(55) }, lage: lage(p.id) },
          anlage_url: { url: body.id === VIDEO ? `${BASIS}/film/sicherheit-datenschutz.mp4` : body.id === MUSIK ? `${BASIS}/simjue-orgel.mp3` : `${BASIS}/dokumente/Vertretung_Admin_V1.pdf` },
          // 2.774.0 KC-CLUB-TISCH-TASCHE: Anna hat vorher ein PDF und ein Lied eingepackt
          tisch_tasche: { tisch: TISCH, darfVorab: true, max: 20, vorab: [], meine: p.id !== LEUTE[0].id ? [] : [
            { id: "t1", a: PDF, name: "Ablauf.pdf", mime: "application/pdf", art: "pdf", pos: 1, vorab: false, gezeigt: false },
            { id: "t2", a: MUSIK, name: "Club-Song.mp3", mime: "audio/mpeg", art: "musik", pos: 2, vorab: false, gezeigt: false }] },
        }[a] ?? { ok: true };
        return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(ant) });
      }
      if (/\/functions\/v1\//.test(u.pathname)) return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: "{}" });
      return r.abort();
    });
    await seite.goto(`${BASIS}/index.html?k=0123456789abcdef0123456789abcdef`);
    await seite.waitForFunction(() => typeof ICH !== "undefined" && !!ICH, null, { timeout: 30000 }).catch(() => melde(`[${name}] Start: nicht angemeldet`));
    await seite.waitForTimeout(1500);
    await seite.evaluate(() => { try { bwEinSetzen({ spaeter: Date.now() + 3600000 }); } catch {} document.querySelectorAll("button.blatt-x").forEach((b) => b.click()); });
    seiten.push({ seite, name, id: p.id });
  }
  const [A, B, C] = seiten;
  // alle setzen sich an den Tisch und schalten Live dazu
  for (const s of seiten) await s.seite.evaluate(async (id) => { await rundOeffnen(); await rundTischZeigen(id); }, TISCH).catch((e) => melde(`[${s.name}] Tisch: ${e}`));
  for (const s of seiten) {
    const knopf = await s.seite.$(".tl-start"); if (!knopf) { melde(`[${s.name}] Knopf „🔴 Live dazuschalten“ fehlt`); continue; }
    await knopf.click(); await s.seite.waitForTimeout(300);
  }
  const warte = async (s, fn, arg, ms, was) => { try { await s.seite.waitForFunction(fn, arg, { timeout: ms, polling: 250 }); return true; } catch { melde(`[${s.name}] ${was}`); return false; } };
  // 1. alle sehen sich, offenes Gespräch, Mikro an
  for (const s of seiten) await warte(s, () => TL.live && TL.L?.ok && tlLiveIds().length === 2 && TL.micAn && tlRegel().frei, null, 15000, "sieht nicht beide anderen live / Mikro nicht an");
  // 2. Ton kommt an: jeder empfängt von beiden anderen (verbunden, Bytes fließen)
  for (const s of seiten) await warte(s, () => [...TL.pcs.values()].filter((v) => !v.raus && v.ok).length === 2 && [...TL.pcs.values()].filter((v) => v.raus && v.ok).length === 2, null, 20000, "Ton-Verbindungen nicht alle verbunden (je 2 rein, 2 raus)");
  for (const s of seiten) { // Ton fließt: empfangene Bytes wachsen (bis zu 10 s Zeit)
    let bytes = 0;
    for (let i = 0; i < 20 && bytes <= 4000; i++) { await s.seite.waitForTimeout(500);
      bytes = await s.seite.evaluate(async () => { let n = 0; for (const v of TL.pcs.values()) if (!v.raus) (await v.pc.getStats()).forEach((x) => { if (x.type === "inbound-rtp" && x.kind === "audio") n += x.bytesReceived || 0; }); return n; }); }
    if (!(bytes > 4000)) melde(`[${s.name}] es kommt kein Ton an (${bytes} Bytes)`);
  }
  // 3. Kamera von A kommt bei B als Bild an
  await A.seite.evaluate(() => tlKamera());
  await warte(B, (a) => { const v = document.querySelector(`#tlLeute video[data-cam="${a}"]`); return !!v && v.videoWidth > 0; }, A.id, 20000, "Kamerabild von Anna kommt nicht an");
  // 4. A zeigt ein PDF – B und C sehen Seite 1, A blättert → B folgt auf Seite 2; B blättert selbst zurück → „Folgen“
  await A.seite.evaluate((a) => tlZeigeSetzen({ a, n: "Kurzanleitung.pdf", m: "application/pdf", s: 1 }), PDF);
  for (const s of [B, C]) await warte(s, () => !!document.querySelector("#tlBuehne img.tl-seite") && TL.seite === 1, null, 20000, "gezeigtes PDF erscheint nicht");
  await A.seite.evaluate(() => tlBlaettern(1));
  await warte(B, () => TL.seite === 2 && /Seite 2/.test(document.querySelector("#tlBuehne")?.textContent || ""), null, 15000, "folgt beim Blättern nicht auf Seite 2");
  await B.seite.evaluate(() => tlBlaettern(-1));
  await warte(B, () => TL.seite === 1 && !TL.folgen && !!document.querySelector('#tlBuehne button[onclick="tlFolgen()"]'), null, 8000, "selbst blättern / „Folgen“-Knopf fehlt");
  // 5. Mikro aus bei C → A sieht 🔇; 6. B schaltet Live aus → A und C sehen nur noch einen
  await C.seite.evaluate(() => tlMikro(false));
  await warte(A, (c) => TL.peers.get(c)?.mic === false, C.id, 8000, "sieht nicht, dass Carla stumm ist");
  await B.seite.evaluate(() => tlStopp(true));
  for (const s of [A, C]) await warte(s, (b) => !TL.peers.has(b) && ![...TL.pcs.values()].some((v) => v.an === b), B.id, 8000, "baut nach „Live aus“ von Bernd nicht ab");
  // 7. Bildschirm zeigen (PC): A teilt den Bildschirm → B sieht ihn groß auf der Bühne
  await B.seite.evaluate(async (id) => { await tlStart(id); }, TISCH);
  await warte(B, () => TL.live && tlLiveIds().length === 2, null, 15000, "kommt nach „Live aus“ nicht wieder rein");
  const schirm = await A.seite.evaluate(async () => { await tlSchirm(); return !!TL.schirm; });
  if (!schirm) melde("[Anna] Bildschirm zeigen hat nicht gestartet (getDisplayMedia)");
  else await warte(B, () => { const v = document.querySelector("#tlBuehne video.tl-gross"); return !!v && v.videoWidth > 0 && /Anna zeigt den Bildschirm/.test(document.querySelector("#tlBuehne")?.textContent || ""); }, null, 20000, "geteilter Bildschirm von Anna erscheint nicht groß");
  if (schirm) await A.seite.evaluate(() => tlSchirm());
  // 7b. 🎵 Musik für alle: Anna spielt ein Lied – alle drei spielen es gleichzeitig (höchstens 0,35 s auseinander); Pause hält alle an
  await A.seite.evaluate((m) => tlMusikSetzen({ a: m, n: "Club-Song.mp3", start: Date.now() + 3000, pause: null }), MUSIK);
  for (const s of seiten) await warte(s, () => { const el = document.getElementById("tlMusikTon"); return !!el && !el.paused && el.currentTime > 1; }, null, 20000, "spielt das Lied nicht");
  const pos = await Promise.all(seiten.map((s) => s.seite.evaluate(() => { const el = document.getElementById("tlMusikTon"); return { pos: el.currentTime, jetzt: Date.now() }; })));
  const imTakt = pos.map((p) => p.pos - (p.jetzt - pos[0].jetzt) / 1000), spanne = Math.max(...imTakt) - Math.min(...imTakt);
  if (!(spanne <= 0.35)) melde(`🎵 Lied läuft nicht gleichzeitig (Abstand ${spanne.toFixed(2)} s)`);
  for (const s of [B, C]) if (!/Anna spielt/.test(await s.seite.evaluate(() => document.querySelector("#tlBereich .tl-musik")?.textContent || ""))) melde(`[${s.name}] 🎵 Anzeige „Anna spielt“ fehlt`);
  await A.seite.evaluate(() => tlMusikPause());
  for (const s of [B, C]) await warte(s, () => document.getElementById("tlMusikTon")?.paused === true, null, 8000, "🎵 Pause kommt nicht an");
  await A.seite.evaluate(() => tlMusikSetzen(null));
  for (const s of [B, C]) await warte(s, () => !document.getElementById("tlMusikTon") && !TL.musik, null, 8000, "🎵 Musik aus kommt nicht an");
  // 7b2. 2.774.0 KC-CLUB-TISCH-MUSIK-STOPP (Fund Hansi „konnte nicht Stop drücken – es gab keinen Knopf“): Knöpfe direkt an der Musik.
  //     Bernd spielt: Bernd sieht ⏸️/⏹️, Carla „🔇 Für mich aus“ (schaltet nur bei ihr ab), Anna (Leitung) „⏹️ Für alle aus“ – das stoppt bei allen,
  //     auch beim Abspielenden, und Lebenszeichen starten es nicht wieder. Ist der Tisch nicht zu sehen, hängt die Musik-Leiste unten.
  await B.seite.evaluate((m) => tlMusikSetzen({ a: m, n: "Club-Song.mp3", start: Date.now() + 1500, pause: null }), MUSIK);
  for (const s of seiten) await warte(s, () => { const el = document.getElementById("tlMusikTon"); return !!el && !el.paused; }, null, 20000, "spielt Bernds Lied nicht");
  const knoepfe = async (s) => s.seite.evaluate(() => [...document.querySelectorAll("#tlBereich .tl-musik button")].map((b) => b.textContent.trim()).join("|"));
  if (!/⏸️ Pause/.test(await knoepfe(B)) || !/⏹️ Aus/.test(await knoepfe(B))) melde("[Bernd] 🎵 Pause/Aus fehlen an der Musik: " + (await knoepfe(B)));
  if (!/🔇 Für mich aus/.test(await knoepfe(C)) || /⏹️/.test(await knoepfe(C))) melde("[Carla] 🎵 nur „Für mich aus“ erwartet: " + (await knoepfe(C)));
  if (!/⏹️ Für alle aus/.test(await knoepfe(A))) melde("[Anna] 🎵 Leitung: „Für alle aus“ fehlt: " + (await knoepfe(A)));
  await C.seite.evaluate(() => document.querySelector('#tlBereich .tl-musik button[onclick="tlMusikStumm()"]').click());
  await warte(C, () => document.getElementById("tlMusikTon")?.muted === true && !document.getElementById("tlMusikTon").paused, null, 5000, "🔇 Für mich aus schaltet nicht stumm");
  if (await B.seite.evaluate(() => document.getElementById("tlMusikTon")?.muted)) melde("[Bernd] 🔇 Carlas „Für mich aus“ wirkt auch bei Bernd");
  await C.seite.evaluate(() => { const b = document.getElementById("tlBereich"); if (b) b.style.display = "none"; tlMusikMini(); });
  if (!(await C.seite.evaluate(() => /Club-Song/.test(document.getElementById("tlMusikMini")?.textContent || "") && !!document.querySelector("#tlMusikMini button")))) melde("[Carla] Musik-Leiste unten fehlt, wenn der Tisch nicht zu sehen ist");
  await C.seite.evaluate(() => { const b = document.getElementById("tlBereich"); if (b) b.style.display = ""; tlMusikMini(); });
  await A.seite.evaluate(() => document.querySelector('#tlBereich .tl-musik button[onclick="tlMusikFuerAlleAus()"]').click());
  for (const s of seiten) await warte(s, () => !document.getElementById("tlMusikTon") && !TL.musik && !document.getElementById("tlMusikMini"), null, 8000, "⏹️ Für alle aus kommt nicht überall an");
  await A.seite.waitForTimeout(TL_HERZ_PRUEF_MS);
  for (const s of seiten) if (await s.seite.evaluate(() => !!TL.musik)) melde(`[${s.name}] 🎵 Musik startet nach „Für alle aus“ von selbst wieder`);
  // 7d. 2.774.0 KC-CLUB-TISCH-TASCHE: Anna hat vorher gepackt – die Dateien liegen beim Platznehmen schon auf dem Gerät; „💼 Nächstes“ zeigt der Reihe nach:
  //     erst das PDF (alle sehen es), dann das Lied (alle hören es) – ohne Suchen. Danach ist nichts Ungezeigtes mehr übrig.
  await warte(A, (ids) => ids.every((x) => RUND_DATEIEN.has(x)), [PDF, MUSIK], 15000, "💼 Tasche wird beim Platznehmen nicht vorgeladen");
  if (!(await A.seite.evaluate(() => !!document.querySelector('#tlBereich button[onclick="tlTascheNaechstes()"]')))) melde("[Anna] Knopf „💼 Nächstes“ fehlt");
  await A.seite.evaluate(() => tlTascheNaechstes());
  for (const s of [B, C]) await warte(s, (pdf) => TL.zeige?.a === pdf && !!document.querySelector("#tlBuehne img.tl-seite"), PDF, 20000, "💼 PDF aus der Tasche erscheint nicht");
  await A.seite.evaluate(() => tlTascheNaechstes());
  for (const s of seiten) await warte(s, (m) => TL.musik?.a === m && !document.getElementById("tlMusikTon")?.paused, MUSIK, 20000, "💼 Lied aus der Tasche spielt nicht");
  if (await A.seite.evaluate(() => tlTasche().some((x) => !x.gezeigt) || !!document.querySelector('#tlBereich button[onclick="tlTascheNaechstes()"]'))) melde("[Anna] 💼 nach dem letzten Teil steht noch „Nächstes“ da");
  await A.seite.evaluate(() => { tlMusikSetzen(null); tlZeigeSetzen(null); });
  for (const s of [B, C]) await warte(s, () => !TL.musik && !TL.zeige, null, 8000, "💼 Aus/Zeigen beenden kommt nicht an");
  // 7c. 🎬 Video für alle: Anna spielt ein kurzes Video – bei allen groß auf der Bühne, gleichzeitig; 📸 „Ins Album“ nur bei Anna (zeigt) – nicht bei Bernd
  await A.seite.evaluate((v) => tlMusikSetzen({ a: v, n: "Probe.mp4", art: "video", start: Date.now() + 3000, pause: null }), VIDEO);
  for (const s of seiten) await warte(s, () => { const v = document.querySelector("#tlBuehne video#tlMusikTon"); return !!v && !v.paused && v.currentTime > 1 && v.videoWidth > 0; }, null, 25000, "🎬 Video läuft nicht auf der Bühne");
  const vpos = await Promise.all(seiten.map((s) => s.seite.evaluate(() => ({ pos: document.getElementById("tlMusikTon").currentTime, jetzt: Date.now() }))));
  const vt = vpos.map((p) => p.pos - (p.jetzt - vpos[0].jetzt) / 1000), vsp = Math.max(...vt) - Math.min(...vt);
  if (!(vsp <= 0.4)) melde(`🎬 Video läuft nicht gleichzeitig (Abstand ${vsp.toFixed(2)} s)`);
  if (!(await A.seite.evaluate(() => /Ins Album/.test(document.querySelector("#tlBuehne")?.textContent || "")))) melde("[Anna] 📸 „Ins Album“ fehlt");
  if (await B.seite.evaluate(() => /Ins Album/.test(document.querySelector("#tlBuehne")?.textContent || ""))) melde("[Bernd] 📸 „Ins Album“ darf nur, wer zeigt oder leitet");
  await A.seite.evaluate(() => tlMusikSetzen(null));
  for (const s of [B, C]) await warte(s, () => !document.querySelector("#tlBuehne video#tlMusikTon") && !TL.musik, null, 8000, "🎬 Video aus kommt nicht an");
  // 8. Redestab (Grenze im Test auf 2 gesetzt → bei 3 Personen gilt der Redestab): nur Anna (Leitung) spricht, Bernd meldet sich ✋,
  //    Anna gibt ihm den Stab → Bernd spricht, Anna hört ihn; Anna nimmt den Stab zurück → Bernd ist wieder stumm und sendet nicht mehr
  for (const s of seiten) await s.seite.evaluate(() => { TL.freiBis = 2; tlAufraeumen(); });
  await warte(B, () => !tlRegel().darfSprechen && !TL.micAn && ![...TL.pcs.values()].some((v) => v.raus), null, 10000, "Redestab-Modus: Bernd sendet noch");
  await warte(A, () => tlRegel().darfSprechen && TL.micAn, null, 10000, "Redestab-Modus: Anna (Leitung) darf nicht sprechen");
  await B.seite.evaluate(() => tlHand());
  await warte(A, (b) => TL.peers.get(b)?.hand === true && /Gemeldet: Bernd/.test(document.querySelector("#tlBereich")?.textContent || ""), B.id, 8000, "sieht Bernds ✋ nicht");
  await A.seite.evaluate((b) => tlStab(b), B.id);
  await warte(B, () => TL.stab === TL.ich && TL.micAn && !TL.hand, null, 8000, "bekommt den Redestab nicht / Mikro geht nicht an");
  await warte(A, (b) => [...TL.pcs.values()].some((v) => !v.raus && v.an === b && v.ok), B.id, 15000, "hört Bernd mit dem Redestab nicht");
  await A.seite.evaluate((b) => tlStab(b), B.id);
  await warte(B, () => TL.stab !== TL.ich && !TL.micAn && ![...TL.pcs.values()].some((v) => v.raus), null, 10000, "Redestab zurück: Bernd sendet weiter");
  // Anzeige: nichts ragt über den Rand, Live-Bereich da
  for (const s of seiten) { const r = await s.seite.evaluate(() => ({ quer: document.documentElement.scrollWidth > innerWidth + 2, da: !!document.querySelector("#tlBereich .tl-leiste") }));
    if (!r.da) melde(`[${s.name}] Live-Bereich fehlt`); if (r.quer) melde(`[${s.name}] ragt seitlich über den Rand`); }
  // 8b. 🙋 Tischgast: Anna lädt ein (Link wird angezeigt), der Gast öffnet den Link in einem eigenen Browser, sieht den Datenschutz-Hinweis,
  //     setzt sich an den Tisch, schaltet Live dazu und hört Anna. Er hat keine Datei-Knöpfe, keine Einladen-Funktion, und seine App fragt nur Erlaubtes an.
  for (const s of seiten) await s.seite.evaluate(() => { TL.freiBis = 6; tlAufraeumen(); });
  if (!(await A.seite.evaluate(() => /Gast von außen einladen/.test(document.querySelector("#rundTischInhalt")?.textContent || "")))) melde("[Anna] 🙋 „Gast von außen einladen“ fehlt");
  await A.seite.evaluate((t) => rundGastEinladen(t), TISCH); await A.seite.fill("#rgName", "Dr. Probe"); await A.seite.click('.dlg [data-a="los"], [data-a="los"]');
  await warte(A, (tok) => document.getElementById("rgLink")?.value.endsWith(tok), GAST_TOKEN, 8000, "🙋 Gast-Link wird nicht angezeigt");
  await A.seite.evaluate(() => document.querySelectorAll('[data-a="zu2"]').forEach((b) => b.click()));
  const gastAnfragen = new Set();
  const gctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, serviceWorkers: "block", locale: "de-DE", timezoneId: "Europe/Berlin", permissions: ["microphone", "camera"],
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36" });
  const G = { seite: await gctx.newPage(), name: "Gast", id: GAST_PID };
  G.seite.on("pageerror", (e) => melde(`[Gast] Programmfehler: ${String(e.message || e).slice(0, 200)}`));
  await G.seite.routeWebSocket(/realtime\/v1\/websocket/, leitung);
  const gastLage = () => ({ ...lage(GAST_PID), tische: lage(GAST_PID).tische.map((t) => ({ ...t, chat: null, zusagen: [], gaeste: [], darfLeiten: false, gastgeberName: "Anna", amTisch: t.amTisch.map((x) => ({ ...x, name: x.name.split(" ")[0] })) })) });
  await G.seite.route("**/*", (r) => {
    const u = new URL(r.request().url());
    if (u.origin === BASIS || u.protocol === "data:" || u.protocol === "blob:") return r.continue();
    if (/\/functions\/v1\/kc-club$/.test(u.pathname)) {
      let a = "", h = r.request().headers(); try { a = JSON.parse(r.request().postData() || "{}").action; } catch {}
      gastAnfragen.add(a); if (h["x-club-token"] !== GAST_TOKEN || !/^[0-9a-f]{32}$/.test(h["x-tg-geraet"] || "")) melde(`[Gast] Anfrage „${a}“ ohne Gast-Link/Geräte-Kennung`);
      const ant = { tischgast_init: { ok: true, ich: { person_id: GAST_PID, name: "Dr. Probe", vorname: "Dr. Probe", gast: true }, tisch: TISCH, lage: gastLage(), hinweis: "Du bist als Gast zu genau diesem Tisch eingeladen." },
        tisch_platz: { ok: true, ergebnis: "ok", lage: gastLage(), live: LIVE }, anruf_wege: { ice: [], bis: iso(60) } }[a];
      return r.fulfill({ status: ant ? 200 : 403, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(ant || { error: "Als Tischgast geht nur der Tisch, zu dem du eingeladen bist." }) });
    }
    return r.abort();
  });
  await G.seite.goto(`${BASIS}/index.html?g=${GAST_TOKEN}`);
  await warte(G, () => /Verstanden – zum Tisch/.test(document.body.textContent), null, 20000, "Datenschutz-Hinweis für den Gast fehlt");
  await G.seite.evaluate(() => [...document.querySelectorAll("button")].find((b) => /Verstanden – zum Tisch/.test(b.textContent))?.click());
  await warte(G, () => !!document.querySelector(".tl-start"), null, 15000, "Gast: Tisch / „Live dazuschalten“ erscheint nicht");
  await G.seite.click(".tl-start").catch(() => melde("[Gast] „Live dazuschalten“ nicht antippbar"));
  await warte(G, () => TL.live && tlLiveIds().length === 3, null, 15000, "Gast sieht die drei Mitglieder nicht live");
  await warte(G, (a) => [...TL.pcs.values()].some((v) => !v.raus && v.an === a && v.ok), A.id, 20000, "Gast hört Anna nicht");
  await warte(A, (g) => TL.peers.has(g), GAST_PID, 10000, "Anna sieht den Gast nicht live");
  const gr = await G.seite.evaluate(() => ({ zeigen: !!document.querySelector('[onclick="tlUnterlagen()"]') || !!document.querySelector('[onclick="tlMusik()"]'), einladen: /Gast von außen einladen/.test(document.body.textContent),
    speicher: (() => { try { return localStorage.getItem("kc_club_key"); } catch { return null; } })(), app: !document.getElementById("app")?.classList.contains("versteckt"), quer: document.documentElement.scrollWidth > innerWidth + 2 }));
  if (gr.zeigen) melde("[Gast] hat Datei-Knöpfe (📎/🎵) – Gäste haben keinen Tisch-Chat");
  if (gr.einladen) melde("[Gast] darf keine Gäste einladen");
  if (gr.speicher) melde("[Gast] Gast-Link wurde als Mitglieder-Link gespeichert");
  if (gr.app) melde("[Gast] Mitglieder-Oberfläche ist sichtbar");
  if (gr.quer) melde("[Gast] ragt seitlich über den Rand");
  const verboten = [...gastAnfragen].filter((a) => !GAST_ERLAUBT.has(a));
  if (verboten.length) melde("[Gast] App fragt Nicht-Erlaubtes an: " + verboten.join(", "));
  await G.seite.evaluate(() => tlStopp(true)); await gctx.close();
  // 9. 📸 Ins Album: Anna übernimmt ein Foto aus dem Tisch → Album-Hochladeformular mit genau dieser Datei (erst „Hochladen“ legt es ab)
  const album = await A.seite.evaluate(async (v) => { await tlInsAlbum(v, "Probe.mp4", "video/mp4"); await new Promise((r) => setTimeout(r, 1500));
    return { ansicht: aktuelleAnsicht, offen: faGeteilt === null, datei: document.querySelector("#v-fotos")?.textContent.includes("Probe.mp4") || [...document.querySelectorAll("input[type=file]")].some((i) => i.files?.length) }; }, VIDEO).catch((e) => ({ fehler: String(e).slice(0, 120) }));
  if (album.ansicht !== "fotos" || !album.offen) melde("[Anna] 📸 Ins Album öffnet das Hochladen nicht " + JSON.stringify(album));
  for (const s of seiten) { const fp = await s.seite.evaluate(() => (window.KCFP?.lies() || []).filter((e) => /^(skript|versprechen|gefangen|instabil|schutz)$/.test(e.art)).map((e) => e.art + ": " + String(e.text || "").slice(0, 120)));
    for (const e of fp) melde(`[${s.name}] Fehlerprotokoll ${e}`); }
} finally { await browser.close(); server.close(); }

if (fehler.length) { console.error("❌ Tisch-Live: " + fehler.length + " Fund(e)\n" + fehler.join("\n")); process.exit(1); }
console.log("OK – Tisch-Live: 3 Fenster, Ton in alle Richtungen, Kamera, PDF zeigen + Blättern + Folgen, Stumm, Live aus/wieder an, Bildschirm, 🎵 Musik gleichzeitig + Pause, 🎬 Video gleichzeitig + Album-Knopf, Redestab + ✋, 🙋 Tischgast");
