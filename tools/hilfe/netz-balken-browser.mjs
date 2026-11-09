// KC-CLUB-NETZ-BALKEN (09.11.2026): Browser-Prüfung mit dem echten app.js – Verbindungsbalken auf der Startseite (Striche/Farbe je Qualität),
// Antippen öffnet das Verbindungs-Blatt, abschaltbar; keine Fehler, nichts an den Server.
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/netz-balken-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8811);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close());
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8811/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
await seite.evaluate(() => {
  ICH = { ...(ICH || {}), person_id: "P1", name: "Klaus Test", vorname: "Klaus", admin: false, vorstand: false, buero: false }; MITGLIEDER = MITGLIEDER || [];
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  window.__api = []; api = async (a, p) => { __api.push({ a, p }); return a === "unterhaltungen" ? { unterhaltungen: [] } : {}; };
  zeige("start", true); for (const b of document.querySelectorAll("body > *")) if (/Welche Stimme soll dir/.test(b.textContent || "") && b.id !== "app") b.remove();
});
const bild = async (n) => { if (process.env.BILDER) await seite.screenshot({ path: process.env.BILDER + "/" + n + ".png", clip: { x: 0, y: 0, width: 400, height: 330 } }); };
const stand = (ms, art) => seite.evaluate(({ ms, art }) => {
  try { localStorage.setItem("kc_club_netzart", art); } catch {}
  for (const e of document.querySelectorAll(".meldung, .blatt:not(.versteckt)")) e.remove(); document.body.classList.remove("blatt-offen");
  VB.letzteOk = Date.now(); VB.zeiten = [ms, ms, ms]; SCHNECKE.an = false; vbStatusLed(); netzSymbolZeigen();
  const b = $("netzBalken"); return { sichtbar: !b.classList.contains("versteckt") && b.offsetWidth > 0, an: b.querySelectorAll(".nb-striche i.an").length, kl: b.className, text: b.textContent };
}, { ms, art });
let s = await stand(200, "wlan"); ok(s.sichtbar && s.an === 4 && /nb-gruen/.test(s.kl) && /📶/.test(s.text) && /Sehr gut/.test(s.text), "WLAN sehr gut: 4 grüne Striche"); await bild("netz-wlan-sehr-gut");
s = await stand(800, "mobil"); ok(s.an === 3 && /nb-gruen/.test(s.kl) && /📱/.test(s.text), "Mobilfunk gut: 3 Striche"); await bild("netz-mobil-gut");
s = await stand(1800, "mobil"); ok(s.an === 2 && /nb-gelb/.test(s.kl) && /Mäßig/.test(s.text), "mäßig: 2 gelbe Striche"); await bild("netz-maessig");
s = await stand(4000, "wlan"); ok(s.an === 1 && /nb-rot/.test(s.kl) && /Schwach/.test(s.text), "schwach: 1 roter Strich"); await bild("netz-schwach");
await seite.setViewportSize({ width: 360, height: 780 }); await seite.waitForTimeout(300); await bild("netz-schmal");
ok(await seite.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1 && !$("netzBalken").querySelector(".nb-text").offsetWidth), "schmales Handy (360 px): nur Symbol + Striche, nichts läuft über");
await seite.setViewportSize({ width: 400, height: 800 });
await seite.evaluate(() => $("netzBalken").click()); await seite.waitForTimeout(300);
ok(await seite.evaluate(() => !$("verbindungBlatt").classList.contains("versteckt") && /Verbindungsqualität/.test($("vbInhalt").textContent)), "Antippen öffnet das Verbindungs-Blatt");
await seite.evaluate(() => $("verbindungBlatt").classList.add("versteckt"));
await seite.evaluate(() => { einstellung("netzBalken", false); netzSymbolZeigen(); });
ok(await seite.evaluate(() => $("netzBalken").classList.contains("versteckt")), "abschaltbar (⚙️ → Effekte)");
await seite.evaluate(() => { einstellung("netzBalken", true); netzSymbolZeigen(); });
console.log("Seitenfehler (Info):", fehler.join(" | ") || "keine");
const senden = await seite.evaluate(() => __api.filter((x) => !/^(spur_melden|unterhaltungen|start_melden|countdowns|init|pinnwand|pinnwand_neu|einstellung_setzen)$/.test(x.a)).map((x) => x.a));
ok(!senden.length, "nichts an den Server" + (senden.length ? " – " + senden.join(",") : ""));
ok(!fehler.filter((f) => !/tdt|unterhaltung/i.test(f)).length, "keine Fehler auf der Seite" + (fehler.length ? " – " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log("netz-balken-browser: alle Prüfungen bestanden");
