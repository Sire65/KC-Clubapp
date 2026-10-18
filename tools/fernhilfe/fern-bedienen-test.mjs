// KC-CLUB-FERNHILFE F3: Browser-Test des echten app.js (Chromium über playwright-core). Start: node tools/fernhilfe/fern-bedienen-test.mjs
// Lädt index.html lokal (ohne Anmeldung, Server-Aufrufe abgefangen), setzt eine laufende Mitschau-Sitzung mit erlaubtem Bedienen und prüft mlFern.
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8799);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } });
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8799/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const erg = await seite.evaluate(async () => {
  const r = {}; window.__api = []; api = async (a, p) => { __api.push(a); return { ok: true, status: "live" }; };
  document.body.insertAdjacentHTML("beforeend", `<div id="testFlaeche" style="position:fixed;left:0;top:0;width:400px;height:800px;z-index:2400;background:#fff">
    <button id="tHarmlos" style="position:absolute;left:20px;top:100px;width:120px;height:50px" onclick="window.__harmlos=(window.__harmlos||0)+1">Termine</button>
    <button id="tGefahr" style="position:absolute;left:200px;top:100px;width:120px;height:50px" onclick="window.__gefahr=(window.__gefahr||0)+1">Nachricht senden</button>
    <input id="tText" style="position:absolute;left:20px;top:300px;width:200px;height:40px">
    <input id="tPin" type="password" style="position:absolute;left:20px;top:400px;width:200px;height:40px"></div>`);
  Object.assign(MSCH, { id: "t1", wer: "Hansi", bis: Date.now() + 600000, fhL: { ok: true, senden: async () => true, mess: () => ({}), schliessen() {} }, fhHallo: true, bedienen: false, befehle: 0, befehlAm: 0 });
  document.body.insertAdjacentHTML("beforeend", `<div id="ssLiveLeiste" class="ss-live-leiste" style="z-index:2500"><span>Hansi schaut zu</span><button onclick="window.__ende=1">Beenden</button></div>`);
  mlBedienenKnopf(); r.knopf = document.getElementById("ssBedienen")?.textContent || "";
  const warte = (ms) => new Promise((x) => setTimeout(x, ms));
  await mlFern({ cmd: "tipp", x: 80 / 400, y: 125 / 800 }); r.ohneErlaubnis = window.__harmlos || 0;
  MSCH.bedienen = true;
  await mlFern({ cmd: "tipp", x: 80 / 400, y: 125 / 800 }); r.harmlos = window.__harmlos || 0; await warte(250);
  const p = mlFern({ cmd: "tipp", x: 260 / 400, y: 125 / 800 }); await warte(300); r.rueckfrage = !!document.querySelector(".dlg-blatt");
  document.querySelector(".dlg-blatt [data-w='0']")?.click(); await p; r.gefahrNein = window.__gefahr || 0; await warte(250);
  const p2 = mlFern({ cmd: "tipp", x: 260 / 400, y: 125 / 800 }); await warte(300); document.querySelector(".dlg-blatt [data-w='1']")?.click(); await p2; r.gefahrJa = window.__gefahr || 0; await warte(250);
  const leiste = document.getElementById("ssLiveLeiste").getBoundingClientRect(); const b = document.querySelector("#ssLiveLeiste button:last-child").getBoundingClientRect();
  await mlFern({ cmd: "tipp", x: (b.left + b.width / 2) / innerWidth, y: (b.top + b.height / 2) / innerHeight }); r.leisteFern = window.__ende || 0; await warte(250);
  await mlFern({ cmd: "tipp", x: 120 / 400, y: 320 / 800 }); r.fokusText = document.activeElement?.id; await warte(250);
  await mlFern({ cmd: "text", t: "Hallo" }); r.text = document.getElementById("tText").value; await warte(250);
  document.getElementById("tPin").focus(); await mlFern({ cmd: "text", t: "1234" }); r.pin = document.getElementById("tPin").value;
  await warte(250); r.schnell = (() => { const n = MSCH.befehle; mlFern({ cmd: "scroll", dy: 0.1 }); mlFern({ cmd: "scroll", dy: 0.1 }); return MSCH.befehle - n; })();
  return r;
});
ok(erg.knopf === "🖱️ Bedienen erlauben", "Knopf „Bedienen erlauben“ in der Leiste");
ok(erg.ohneErlaubnis === 0, "ohne Erlaubnis passiert nichts");
ok(erg.harmlos === 1, "harmloser Knopf wird aus der Ferne getippt");
ok(erg.rueckfrage && erg.gefahrNein === 0, "riskanter Knopf: Rückfrage, bei Nein nichts");
ok(erg.gefahrJa === 1, "riskanter Knopf: bei Ja getippt");
ok(erg.leisteFern === 0, "Fernhilfe-Leiste (Beenden) aus der Ferne nicht bedienbar");
ok(erg.fokusText === "tText" && erg.text === "Hallo", "Textfeld fokussiert und Text eingetragen");
ok(erg.pin === "", "nie Text in Passwortfelder");
ok(erg.schnell === 1, "Bremse: höchstens ein Befehl je 200 ms");
const helfer = await seite.evaluate(async () => {
  const gesendet = []; document.body.insertAdjacentHTML("beforeend", `<div id="stdBuehne" style="position:fixed;left:0;top:0;width:200px;height:400px;z-index:2700"><div class="spg-rahmen" style="width:200px;height:400px"></div></div>`);
  Object.assign(SS, { id: "t2", bedienen: false, fhL: { ok: true, senden: async (c) => { gesendet.push(c); return true; }, schliessen() {} } });
  ssFernFlaeche(); const ohne = !!document.querySelector(".spg-fern");
  ssFhDaten({ bedienen: true }); const f = document.querySelector(".spg-fern");
  const ev = (t, x, y) => f.dispatchEvent(new PointerEvent(t, { clientX: x, clientY: y, bubbles: true }));
  ev("pointerdown", 50, 100); ev("pointerup", 50, 100); ev("pointerdown", 100, 300); ev("pointerup", 100, 100);
  ssFhDaten({ bedienen: false }); const weg = !document.querySelector(".spg-fern");
  return { ohne, gesendet, weg };
});
ok(!helfer.ohne, "Helfer: ohne Erlaubnis keine Bedienfläche");
ok(helfer.gesendet[0]?.cmd === "tipp" && Math.abs(helfer.gesendet[0].x - 0.25) < 0.01 && Math.abs(helfer.gesendet[0].y - 0.25) < 0.01, "Helfer: Antippen → richtige Stelle (Anteil am Bild)");
ok(helfer.gesendet[1]?.cmd === "scroll" && helfer.gesendet[1].dy > 0, "Helfer: nach oben wischen → weiterblättern");
ok(helfer.weg, "Helfer: Erlaubnis zurückgenommen → Fläche weg");
const ton = await seite.evaluate(async () => {
  Object.assign(SS, { id: null }); MSCH.vonPid = "KC-P-HANSI"; RUF = null; msTonZeigen();
  const aus = document.getElementById("ssTon")?.textContent || "";
  RUF = { rolle: "angerufen", ms: true, gegen: { vorname: "Hansi" } }; rufLeisten();
  const klingelt = document.getElementById("ssTon")?.textContent || "";
  const schirm = document.getElementById("anrufSchirm")?.classList.contains("versteckt");
  let aufgelegt = false; const alt = anrufAuflegen; anrufAuflegen = async () => { aufgelegt = true; RUF = null; };
  mlEnde(true, "Test-Ende"); anrufAuflegen = alt;
  return { aus, klingelt, schirm, aufgelegt, partner: (MSCH.id = "t3", msPartner()) };
});
ok(ton.aus.includes("🔊 Ton an"), "Ton: Knopf „Ton an“ in der Mitschau-Leiste");
ok(ton.klingelt.includes("möchte mit dir sprechen") && ton.klingelt.includes("Annehmen"), "Ton: Anruf vom Helfer kompakt in der Leiste, Mikro erst nach Annehmen");
ok(ton.schirm !== false, "Ton: kein Vollbild-Anrufschirm");
ok(ton.aufgelegt, "Ton: Ende der Sitzung legt auf");
ok(ton.partner === "KC-P-HANSI", "Ton: Partner ist der Helfer der Sitzung");
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
