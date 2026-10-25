// 2.654.0 KC-CLUB-NACHSENDEN: Browser-Test des echten app.js – Knopf nur für den Admin, erst Namen zeigen und fragen, dann senden.
// Start: PW_CORE=… PW_CHROME=… node tools/nachsenden/nachsenden-browser.mjs
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8799);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage(); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8799/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const r = await seite.evaluate(async () => {
  const e = {}; window.__a = [];
  NA.nachrichten.set("m1", { id: "m1", text: "Hier die Matrix", anlagen: [], eigen: true }); NA.nachrichten.set("m2", { id: "m2", text: VN_PRE + "xyz", anlagen: [], eigen: true });
  CHAT = { id: "t1", teilnehmer: [{ person_id: "P1" }, { person_id: "P2" }, { person_id: "P3" }] };
  ICH = { ...(ICH || {}), person_id: "P1", admin: false }; nachrichtMenue("m1"); e.mitgliedOhne = !/nachschicken/.test($("naMenue")?.textContent || ""); $("naMenue")?.remove();
  ICH.admin = true; nachrichtMenue("m1"); e.adminMit = /Per E-Mail nachschicken/.test($("naMenue")?.textContent || ""); $("naMenue")?.remove();
  nachrichtMenue("m2"); e.verschluesseltOhne = !/nachschicken/.test($("naMenue")?.textContent || ""); $("naMenue")?.remove();
  let gefragt = ""; frage = async (t) => { gefragt = t; return true; }; let gemeldet = ""; melde = (t) => { gemeldet = t; };
  api = async (a, d) => { __a.push({ a, d }); return d.nur_pruefen ? { personen: [{ person_id: "P3", name: "Thomas Hess", mail: true }] } : { ok: true, gesendet: 1, namen: ["Thomas Hess"] }; };
  await naNachsenden("m1"); e.gefragt = gefragt; e.gemeldet = gemeldet; e.aufrufe = __a.slice();
  __a.length = 0; api = async () => ({ personen: [] }); await naNachsenden("m1"); e.keiner = gemeldet; e.einAufruf = true;
  return e;
});
ok(r.mitgliedOhne && r.adminMit && r.verschluesseltOhne, "Knopf nur für den Admin, nicht bei verschlüsselten Nachrichten");
ok(/Thomas Hess/.test(r.gefragt) && /bleibt eingeschaltet/.test(r.gefragt), "zeigt vor dem Senden, wer die Mail bekommt");
ok(r.aufrufe.length === 2 && r.aufrufe[0].d.nur_pruefen && r.aufrufe[1].d.personen?.[0] === "P3" && /Nachgeschickt an Thomas Hess/.test(r.gemeldet), "erst prüfen, dann nur an die Gewählten senden");
ok(/niemand auf „Keine Benachrichtigungen“/.test(r.keiner), "niemand stumm → Hinweis, nichts gesendet");
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
