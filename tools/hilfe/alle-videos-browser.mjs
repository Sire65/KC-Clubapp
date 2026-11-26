// 3.33.0 KC-CLUB-HILFE-3330: alle Erklär-Videos (RUNDGAENGE) Schritt für Schritt im echten app.js – Browser abgeschirmt, nur Testdaten.
// Meldet je Video: Pflicht-Ziele (mussSel) nicht sichtbar, Stationen ganz ohne sichtbares Ziel (nur Hinweis), Programmfehler, Server-Aufrufe, die etwas ändern würden.
// So fällt auf, wenn eine Station nach einem Umbau ihr Ziel verloren hat (sie würde sonst still übersprungen).
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/alle-videos-browser.mjs [video-id …]
//   BREITE=360 (Standard 400) · SCHRITT_MS=1200 (Wartezeit je Station, Standard 450) · STAPEL=1 (Fehler mit Aufrufstapel) · BERICHT=datei.json
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8797);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: Number(process.env.BREITE || 400), height: 800 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(process.env.STAPEL ? String(e.stack).slice(0, 600) : String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close());
await seite.goto("http://localhost:8797/index.html"); await seite.waitForTimeout(2500);
await seite.evaluate(() => {
  ICH = { ...(ICH || {}), person_id: "P1", name: "Klaus Test", vorname: "Klaus", admin: false, vorstand: false, buero: false }; MITGLIEDER = MITGLIEDER || [];
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  window.__api = []; window.__apiEcht = async (a, p) => { __api.push({ a, p }); return a === "mitglieder" ? { mitglieder: [], aemter: [], onlineSichtbar: true } : a === "init" ? { ok: true, ich: ICH } : {}; }; api = __apiEcht; // leere, aber gültige Antworten
  try { speechSynthesis.speak = () => {}; } catch {}
});
await seite.evaluate(() => teilLaden("videos")); await seite.evaluate(() => teilLaden("hilfe"));
const ids = process.argv.slice(2).length ? process.argv.slice(2) : await seite.evaluate(() => RUNDGAENGE.filter((r) => !r.nur || r.nur()).map((r) => r.id));
let rot = 0; const bericht = [];
for (const id of ids) {
  const vorher = fehler.length, apiVorher = await seite.evaluate(() => __api.length);
  const r = await seite.evaluate(async ({ id, schritt }) => {
    const warte = (t) => new Promise((x) => setTimeout(x, t)), los = (q) => (typeof q === "function" ? q() : document.querySelector(q));
    SCHLAF.bedient = Date.now(); // ein Prüflauf über alle Videos dauert > 15 Min. ohne Antippen – sonst schläft die App ein (KC-CLUB-SCHLAFMODUS) und lädt mit Testdaten neu
    const schritte = []; try { rundgangStart(false, id); } catch (e) { return { fehler: String(e), schritte }; } await warte(600);
    for (let n = 0; n < 120 && RG.an; n++) {
      const s = RG.st[RG.i]; const ziele = (s.sel || []).map((q) => { try { return los(q); } catch { return null; } });
      schritte.push({ t: s.t, mitZiel: !!(s.sel || []).length, sichtbar: ziele.some((z) => z && rgSichtbar(z)), muss: !!s.mussSel });
      if (RG.i >= RG.st.length - 1) break;
      rundgangSchritt(1); await warte(schritt);
    }
    try { rundgangEnde(true); } catch {} await warte(400);
    return { schritte };
  }, { id, schritt: Number(process.env.SCHRITT_MS || 450) });
  const muss = (r.schritte || []).filter((s) => s.muss && !s.sichtbar).map((s) => s.t), ohne = (r.schritte || []).filter((s) => s.mitZiel && !s.muss && !s.sichtbar).map((s) => s.t);
  const neuF = fehler.slice(vorher);
  const geaendert = await seite.evaluate((n) => __api.slice(n).filter((x) => /senden|speichern|setzen|merken|loeschen|hochladen|anlegen|melden/.test(x.a) && !/gesehen|nutzung|spur|start_melden/.test(x.a) && !(x.a === "einstellung_setzen" && x.p?.schluessel === "rundgang")).map((x) => x.a), apiVorher); // erlaubt: Start-Messung, Wege, „Rundgang angesehen“
  if (process.env.STAPEL && geaendert.length) console.log(id, JSON.stringify(await seite.evaluate((n) => __api.slice(n).filter((x) => /setzen|melden/.test(x.a)), apiVorher)).slice(0, 600));
  if (geaendert.length) neuF.push("Server-Aufruf, der etwas ändert: " + [...new Set(geaendert)].join(", "));
  if (r.fehler || muss.length || neuF.length) rot++;
  bericht.push({ id, schritte: (r.schritte || []).length, muss, ohne, fehler: [r.fehler, ...neuF].filter(Boolean) });
  console.log(`${r.fehler || muss.length || neuF.length ? "ROT " : "ok  "} ${id.padEnd(14)} ${String((r.schritte || []).length).padStart(3)} Stationen` + (muss.length ? ` · Pflicht-Ziel fehlt: ${muss.join(" | ")}` : "") + (ohne.length ? ` · ohne sichtbares Ziel: ${ohne.join(" | ")}` : "") + (r.fehler || neuF.length ? ` · Fehler: ${[r.fehler, ...neuF].filter(Boolean).join(" | ")}` : ""));
}
const nach = await seite.evaluate(() => ({ sim: !!$("rgSim"), api: api === __apiEcht, senden: __api.filter((x) => /senden|speichern|setzen|merken|loeschen|hochladen|anlegen|melden/.test(x.a) && !/gesehen|nutzung|spur|start_melden/.test(x.a) && !(x.a === "einstellung_setzen" && x.p?.schluessel === "rundgang")).map((x) => x.a) }));
if (nach.sim || !nach.api || nach.senden.length) { rot++; console.log("ROT nach allen Videos:", JSON.stringify(nach)); } else console.log("ok   nach allen Videos: kein Beispielbild offen, nichts gesendet oder gespeichert");
fs.writeFileSync(process.env.BERICHT || "/dev/null", JSON.stringify(bericht, null, 1));
await browser.close(); srv.close();
console.log(rot ? `${rot} × ROT` : "ALLE VIDEOS GRÜN"); process.exit(rot ? 1 : 0);
