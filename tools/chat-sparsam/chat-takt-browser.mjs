// KC-CLUB-CHAT-SPARSAM (2.509.0): Browser-Test des echten app.js (Chromium über playwright-core). Zählt, wie oft ein offener Chat in 2 Minuten
// neu lädt (chatTakt alle 2 s), alte Fassung (ALT = Ordner mit dem alten Stand, z. B. git worktree) gegen neue – mit und ohne direkte Leitung (Realtime).
// Start: PW_CORE=… PW_CHROME=… [ALT=/pfad/alter-stand] node tools/chat-sparsam/chat-takt-browser.mjs
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
let wurzel = path.resolve(new URL("../..", import.meta.url).pathname); const NEU = wurzel;
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
  fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8795);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
async function zaehlen(ordner) {
  wurzel = ordner; const seite = await browser.newPage();
  await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
  await seite.goto("http://localhost:8795/index.html"); await seite.waitForTimeout(2500);
  const erg = await seite.evaluate(async () => {
    const lauf = async (rt, fall) => {
      let n = 0; chatLaden = () => { n++; return Promise.resolve(); };
      ICH = { ...(ICH || {}), person_id: "P1" }; chatId = "t1"; aktuelleAnsicht = "chat"; RT.ok = rt; PUSH_AKTIV = true; ONL.ids = new Set(["P2"]); ONL.takt = 0; chatTakt.laeuft = false;
      CHAT = { teilnehmer: [{ person_id: "P1" }, { person_id: "P2" }], tippt: fall === "tippt" ? [{ name: "Klaus" }] : [],
        nachrichten: [{ eigen: true, haken: fall === "haken" ? "gesendet" : "angekommen" }] };
      CHAT_AKTIV = fall === "ruhig" ? 0 : Date.now(); HAKEN_SEIT = fall === "haken" ? Date.now() : 0;
      for (let i = 0; i < 60; i++) { chatTakt(); await new Promise((x) => setTimeout(x, 0)); } // 60 Takte à 2 s = 2 Minuten
      return n;
    };
    const r = {}; for (const rt of [true, false]) for (const fall of ["haken", "tippt", "ruhig"]) r[(rt ? "rt_" : "ohne_") + fall] = await lauf(rt, fall);
    return r;
  });
  await seite.close(); return erg;
}
const neu = await zaehlen(NEU); console.log("neu:", JSON.stringify(neu));
const alt = process.env.ALT ? await zaehlen(process.env.ALT) : null; if (alt) console.log("alt:", JSON.stringify(alt));
ok(neu.rt_haken <= 4, `mit Leitung nach dem Senden: höchstens 4 Ladevorgänge in 2 Min. (${neu.rt_haken}) – Haken kommen per Signal`);
ok(neu.rt_tippt >= 18 && neu.rt_tippt <= 21, `mit Leitung, der andere tippt: alle 6 s (${neu.rt_tippt}) – „schreibt …“ verschwindet nach höchstens 6 s`);
if (alt) {
  ok(alt.rt_haken > neu.rt_haken && alt.rt_tippt > neu.rt_tippt, `weniger als vorher (Haken ${alt.rt_haken} → ${neu.rt_haken}, Tippen ${alt.rt_tippt} → ${neu.rt_tippt})`);
  ok(neu.ohne_haken === alt.ohne_haken && neu.ohne_tippt === alt.ohne_tippt && neu.ohne_ruhig === alt.ohne_ruhig && neu.rt_ruhig === alt.rt_ruhig, "ohne Leitung und im Ruhefall genau wie vorher");
}
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
