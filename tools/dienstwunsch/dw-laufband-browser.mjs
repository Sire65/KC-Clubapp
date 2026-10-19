// KC-CLUB-DW-LAUFBAND (2.493.0): Browser-Test des echten app.js – Laufband-Meldung „Dienstplan Weihnachtsmarkt: Wünsche eingeben?“
// nur wenn noch nicht abgegeben, öffnet Twinkey. Start: node tools/dienstwunsch/dw-laufband-browser.mjs (PW_CORE, PW_CHROME)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8794);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } });
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8794/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const erg = await seite.evaluate(async () => {
  const r = {}; window.__auf = 0; dwOeffnen = () => { window.__auf++; };
  ICH = { ...(ICH || {}), person_id: "P1", admin: false };
  INIT = { ...(INIT || {}), kz: {}, dienstwunschFehlt: true }; DW_LB.geoeffnet = false;
  const m = ilMeldungen().find((x) => x.id === "dw-fehlt"); r.da = !!m && m.stufe === "rot" && /Weihnachtsmarkt/.test(m.t) && m.auf === "dwLaufbandAuf()";
  INIT.dienstwunschFehlt = false; r.abgegebenWeg = !ilMeldungen().some((x) => x.id === "dw-fehlt");
  INIT.dienstwunschFehlt = null; r.unbekanntWeg = !ilMeldungen().some((x) => x.id === "dw-fehlt");
  INIT.dienstwunschFehlt = true; dwLaufbandAuf(); r.twinkey = window.__auf === 1; r.danachWeg = !ilMeldungen().some((x) => x.id === "dw-fehlt");
  return r;
});
ok(erg.da, "noch nicht abgegeben: rote Meldung „Dienstplan Weihnachtsmarkt: Wünsche eingeben?“");
ok(erg.abgegebenWeg, "schon abgegeben: keine Meldung");
ok(erg.unbekanntWeg, "Stand unbekannt (Fehler/Gast/Phase zu): keine Meldung");
ok(erg.twinkey && erg.danachWeg, "Antippen öffnet Twinkey (Dienstwünsche), danach bis zum nächsten Start weg");
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
