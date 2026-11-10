// KC-CLUB-RT-CLUBABEND-MITFAHRT (10.11.2026): Browser-Prüfung – Signal „clubabend“ lädt das offene Clubabend-Fenster sofort, „mitfahrt“ lädt Termine neu (nie beim Eintippen).

// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/rt-clubabend-mitfahrt-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8817);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close());
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8817/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
await seite.evaluate(() => { ICH = { ...(ICH || {}), person_id: "P1", name: "Klaus Test", vorname: "Klaus", admin: false }; $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  api = async (a) => (a === "unterhaltungen" ? { unterhaltungen: [] } : {}); });
const r = await seite.evaluate(async () => {
  const warte = (ms) => new Promise((x) => setTimeout(x, ms)), aus = {};
  // Clubabend: Fenster offen → Signal → holen() wird aufgerufen
  document.body.insertAdjacentHTML("beforeend", '<div id="caBlatt"></div>'); let geholt = 0; CA.holen = async () => { geholt++; };
  rtSignal({ art: "clubabend" }); await warte(1400); aus.ca = geholt;
  $("caBlatt").remove(); rtSignal({ art: "clubabend" }); await warte(1400); aus.caZu = geholt; // Fenster zu → nichts
  // Mitfahrt: Termine offen → neu laden; mit Fokus in einem Eingabefeld → nicht
  let neu = 0; window.mitfahrtNeuLaden = () => { neu++; }; aktuelleAnsicht = "termine";
  rtSignal({ art: "mitfahrt" }); await warte(2200); aus.mf = neu;
  document.body.insertAdjacentHTML("beforeend", '<input id="mfTest">'); $("mfTest").focus(); rtSignal({ art: "mitfahrt" }); await warte(2200); aus.mfTippen = neu; $("mfTest").remove();
  aktuelleAnsicht = "start"; rtSignal({ art: "mitfahrt" }); await warte(2200); aus.mfStart = neu;
  return aus; });
console.log(JSON.stringify(r));
ok(r.ca === 1, "Signal „clubabend“: offenes Clubabend-Fenster lädt sofort");
ok(r.caZu === 1, "Clubabend-Fenster zu: nichts wird geladen");
ok(r.mf === 1, "Signal „mitfahrt“: Termine laden neu");
ok(r.mfTippen === 1, "beim Eintippen wird nicht neu geladen");
ok(r.mfStart === 1, "auf der Startseite: nichts (die Fahrten stehen bei den Terminen)");
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? " – " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log("rt-clubabend-mitfahrt-browser: alle Prüfungen bestanden");
