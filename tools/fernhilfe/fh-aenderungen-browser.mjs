// KC-CLUB-FERNHILFE F2: Browser-Test des echten app.js (Chromium über playwright-core): echte App, echter Sender (spgSenderStart/mlSenden),
// echter Empfänger (fhBildFolge/spgZeigen). Die Leitung ist im Browser nachgebildet (JSON hin und zurück wie bei Realtime).
// Start: node tools/fernhilfe/fh-aenderungen-browser.mjs  (PW_CORE = Pfad zu playwright-core, PW_CHROME = Chromium/headless_shell)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8798);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } });
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8798/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const erg = await seite.evaluate(async () => {
  const r = {}, warte = (ms) => new Promise((x) => setTimeout(x, ms));
  api = async () => ({ ok: true, status: "live" });
  document.body.insertAdjacentHTML("beforeend", `<div id="tListe" style="position:fixed;inset:0;overflow:auto;z-index:2400;background:#fff"><ul>${Array.from({ length: 3000 }, (_, i) => `<li id="z${i}">Mitglied ${i} · Termin ${i % 7} · unverändert</li>`).join("")}</ul></div>
    <div id="tBuehne" style="position:fixed;left:0;top:0;width:200px;height:400px;z-index:2500;visibility:hidden"></div>`);
  const nachrichten = [], zumSender = []; let verlieren = false;
  const Z = { senden: async (o) => { zumSender.push(JSON.parse(JSON.stringify(o))); return true; } };
  const S = { ok: true, f2: true, senden: async (o) => { const t = JSON.stringify(o); nachrichten.push({ art: o.d ? "aend" : o.f ? "voll" : "leer", zeichen: t.length });
    if (verlieren) { verlieren = false; return true; }
    const f = await fhBildFolge(Z, JSON.parse(t)); if (f) await spgZeigen(document.getElementById("tBuehne"), f); return true; }, mess: () => ({}), schliessen() {} };
  const zuschauerText = () => document.querySelector("#tBuehne iframe")?.contentDocument?.body?.textContent || "";
  Object.assign(MSCH, { id: "t1", wer: "Hansi", bis: Date.now() + 600000, fhL: S, fhHallo: true, fhPruef: Date.now(), bedienen: false, befehle: 0 });
  spgSenderStart(mlSenden, false); await warte(1500);
  r.erstes = nachrichten[0]?.art; r.anfang = zuschauerText().includes("Mitglied 2999");
  const n0 = nachrichten.length;
  document.getElementById("z1234").textContent = "Mitglied 1234 · GEÄNDERT ✅"; await warte(1200);
  r.nachAenderung = nachrichten.slice(n0).filter((x) => x.art !== "leer"); r.angekommen = zuschauerText().includes("GEÄNDERT ✅");
  // Verlust: nächste Änderung geht verloren, die übernächste passt nicht → Zuschauer fordert Vollbild an
  verlieren = true; document.getElementById("z10").textContent = "Mitglied 10 · VERLOREN"; await warte(1200);
  document.getElementById("z20").textContent = "Mitglied 20 · DANACH"; await warte(1200);
  r.hallo = zumSender.some((x) => x.hallo === 1 && x.f2 === 1); r.nichtFalsch = !zuschauerText().includes("DANACH");
  for (const x of zumSender.splice(0)) if (x.hallo) { S.d.neu = true; fhNeuSenden(); } // so macht es fhLeitung + mlStart beim „hallo“
  await warte(1500); r.wieder = zuschauerText().includes("VERLOREN") && zuschauerText().includes("DANACH");
  r.letztesVoll = nachrichten.filter((x) => x.art !== "leer").at(-1)?.art;
  r.groesste = Math.max(...nachrichten.map((x) => x.zeichen)); r.voll = nachrichten.filter((x) => x.art === "voll").map((x) => x.zeichen);
  spgSenderStopp(); MSCH.id = null; return r;
});
ok(erg.erstes === "voll" && erg.anfang, "erstes Bild voll, ganze Liste beim Zuschauer");
ok(erg.nachAenderung.length >= 1 && erg.nachAenderung.every((x) => x.art === "aend" && x.zeichen < 3000), `Änderung einer Zeile: nur Änderung (${erg.nachAenderung.map((x) => x.zeichen).join(", ")} Zeichen; Vollbild ${erg.voll[0]})`);
ok(erg.angekommen, "Änderung ist im Live-Bild beim Zuschauer zu sehen");
ok(erg.hallo && erg.nichtFalsch, "Verlust erkannt: kein falsches Bild, Vollbild angefordert");
ok(erg.wieder && erg.letztesVoll === "voll", "nach dem Verlust wieder vollständig");
ok(erg.groesste < 200 * 1024, `keine Nachricht über 200 KB (größte ${Math.round(erg.groesste / 1024)} KB)`);
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
