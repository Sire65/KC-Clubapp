// KC-CLUB-SCHLAFMODUS (20.11.2026): Browser-Prüfung – unbediente, sichtbare App schläft nach 15 Min. ein (Bildschirmschoner, keine Anfrage mehr),
// ein Tipp weckt sie mit genau EINEM „init“. Abgeschirmt: Testdaten, kein echter Server (KC-TESTS-OHNE-ECHTSERVER).
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/schlafmodus-browser.mjs
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html");
  if (!f.startsWith(wurzel) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { a.writeHead(404); return a.end(); }
  a.writeHead(200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(a); });
await new Promise((ok) => srv.listen(0, "127.0.0.1", ok));
const BASIS = `http://127.0.0.1:${srv.address().port}`;
const INIT = { ok: true, ich: { person_id: "KC-P-TEST-SCHLAF", vorname: "Test", name: "Test Schlaf", admin: false, vorstand: false, aemter: [], rollen: [] },
  einstellungen: { begruessung: { gesehen: true }, unterstuetzung: "normal", einweisung: { an: false, gesehen: {} }, spiel_einladung: { an: false }, ansicht: { art: "erweitert", gewaehlt: true },
    filme: { ansichtfilm: { wie: "ende", z: "2026-11-02T08:00:00.000Z" }, kopffilm: { wie: "ende", z: "2026-11-04T08:00:00.000Z" } } },
  mitglieder: [], treffen: [], chats: [], pinnwand: [], termine: [], zaehler: {}, kacheln: null };
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER */ });
const ctx = await browser.newContext({ viewport: { width: 400, height: 800 }, serviceWorkers: "block", locale: "de-DE", timezoneId: "Europe/Berlin",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" });
const seite = await ctx.newPage(); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e.message || e).slice(0, 200)));
const anfragen = []; // [Zeit, Aktion]
let schlafEinst = null; // Einstellung „schlafmodus“, wie der Server sie in „init“ liefert
await seite.route("**/*", (r) => {
  const u = new URL(r.request().url());
  if (u.origin === BASIS || u.protocol === "data:" || u.protocol === "blob:") return r.continue();
  if (/\/functions\/v1\//.test(u.pathname)) {
    let a = ""; try { a = JSON.parse(r.request().postData() || "{}").action || ""; } catch {}
    anfragen.push([Date.now(), a || u.pathname.split("/").pop()]);
    return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(a === "init" ? { ...INIT, einstellungen: { ...INIT.einstellungen, ...(schlafEinst ? { schlafmodus: schlafEinst } : {}) } } : a === "online" ? { zeigen: true, online: [] } : { ok: true }) });
  }
  return r.abort(); // KC-TESTS-OHNE-ECHTSERVER: nichts nach draußen
});
await seite.routeWebSocket(/realtime\/v1\/websocket/, (ws) => ws.close()); // direkte Leitung blockiert
await seite.clock.install();
await seite.goto(`${BASIS}/index.html?k=0123456789abcdef0123456789abcdef`);
await seite.waitForFunction(() => typeof ICH !== "undefined" && !!ICH, null, { timeout: 30000 });
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
for (let t = 0; t < 20000; t += 1000) { await seite.clock.fastForward(1000); await seite.waitForTimeout(20); } // Start zu Ende laufen lassen
ok(await seite.evaluate(() => !SCHLAF.an && !document.getElementById("schlafSchicht")), "nach dem Start wach");
// 25 Min. ohne Eingabe vorspulen (in Schritten, damit Takte laufen)
for (let t = 0; t < 25 * 60000; t += 15000) { await seite.clock.fastForward(15000); await seite.waitForTimeout(15); }
ok(await seite.evaluate(() => SCHLAF.an && ruht()), "nach 25 Min. ohne Eingabe: App schläft");
ok(await seite.locator("#schlafSchicht").isVisible(), "Bildschirmschoner sichtbar");
ok(/Die App schläft/.test(await seite.textContent("#schlafSchicht")) && /\d\d:\d\d Uhr/.test(await seite.textContent("#schlafSchicht .sl-uhr")), "Text und Uhrzeit");
const vorher = anfragen.length;
for (let t = 0; t < 30 * 60000; t += 15000) { await seite.clock.fastForward(15000); await seite.waitForTimeout(10); }
const imSchlaf = anfragen.slice(vorher);
ok(imSchlaf.length === 0, `30 Min. im Schlaf: keine Anfrage an /functions/v1/ (${imSchlaf.length}: ${imSchlaf.map((x) => x[1]).join(", ")})`);
// Aufwecken: ein Klick → genau 1 init
const ab = anfragen.length;
await seite.click("#schlafSchicht");
for (let t = 0; t < 8000; t += 500) { await seite.clock.fastForward(500); await seite.waitForTimeout(30); }
const nach = anfragen.slice(ab).map((x) => x[1]);
ok(await seite.evaluate(() => !SCHLAF.an && !document.getElementById("schlafSchicht")), "Klick weckt, Schicht weg");
ok(nach.filter((a) => a === "init").length === 1, `genau ein init nach dem Aufwachen (${nach.join(", ")})`);
ok(await seite.evaluate(() => !document.getElementById("lsSperre") && !LS.offen), "ohne PIN: ein Tipp genügt – kein zweites „👆 Weiter“ (Liegen-Schutz zusammengelegt)");
// mit App-PIN: nach dem Weck-Tipp direkt die PIN-Abfrage
await seite.evaluate(() => { localStorage.setItem("kc_club_pin", JSON.stringify({ salz: "test", wert: "test", seit: "2026-11-20T08:00:00.000Z" })); });
for (let t = 0; t < 25 * 60000; t += 15000) { await seite.clock.fastForward(15000); await seite.waitForTimeout(10); }
ok(await seite.evaluate(() => SCHLAF.an && !document.getElementById("lsSperre")), "im Schlaf: keine zweite Sichtschutz-Schicht");
await seite.click("#schlafSchicht"); await seite.waitForTimeout(100);
ok(await seite.evaluate(() => !SCHLAF.an && !!document.querySelector("#lsSperre .ls-punkte")), "mit PIN: direkt die PIN-Abfrage");
await seite.evaluate(() => { localStorage.removeItem("kc_club_pin"); lsEntsperren(); });
// Einstellung „aus“: schläft nicht von selbst
schlafEinst = { art: "aus", von: "22:00", bis: "07:00" }; await seite.evaluate(() => neuLaden());
for (let t = 0; t < 20 * 60000; t += 15000) { await seite.clock.fastForward(15000); await seite.waitForTimeout(5); }
ok(await seite.evaluate(() => !SCHLAF.an), "Einstellung „Aus“: bleibt wach");
ok(!fehler.length, "keine Programmfehler" + (fehler.length ? " – " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
if (!process.exitCode) console.log("schlafmodus-browser: alle Prüfungen bestanden");
