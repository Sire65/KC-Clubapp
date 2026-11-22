// KC-KARTEI-WEGE (22.11.2026): Browser-Prüfung mit dem echten app.js – „?“ oben rechts auf der Karteikarte (Chats-Kartei in 💬 Nachrichten und
// Mitglieder-Kartei): nur Admin, nur wenn die Person online ist; Antippen öffnet ihre Wege (spur_liste mit person_id). 390 px ohne Überlauf.
// Nur Testdaten (ausgedachte Namen, keine echten Nachrichten) – nichts an den Server (KC-TESTS-OHNE-ECHTSERVER).
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/kartei-wege-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8858);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e) + (process.env.STAPEL ? e.stack : "")));
// KC-TESTS-OHNE-ECHTSERVER: eigene Seite durchlassen; …/functions/v1/… mit leeren Testdaten beantworten; alles andere abbrechen
await seite.route("**/*", (r) => {
  const u = r.request().url();
  if (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(u)) return r.continue();
  if (/\/functions\/v1\//.test(u)) return r.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  return r.abort();
});
await seite.routeWebSocket(/realtime\/v1\/websocket/, (ws) => ws.close());
await seite.addInitScript(() => { try { localStorage.setItem("kc_club_rk_chats", "an"); localStorage.setItem("kc_club_mg_ansicht", "kartei"); } catch {} });
await seite.goto("http://localhost:8858/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
const bild = async (n) => { if (process.env.BILDER) await seite.screenshot({ path: `${process.env.BILDER}/${n}.png` }); };
const ueberlauf = () => seite.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
await seite.evaluate(() => {
  const jetzt = new Date().toISOString();
  window.__api = []; window.__mg = [
    { person_id: "P1", name: "Admin Probe", vorname: "Admin", aktiv: true },
    { person_id: "P2", name: "Anna Beispiel", vorname: "Anna", aktiv: true },
    { person_id: "P3", name: "Otto Muster", vorname: "Otto", aktiv: true }];
  window.__uh = [
    { id: "U2", teilnehmer: ["Anna Beispiel"], anzahl: 2, ungelesen: 0, letzte: { zeit: jetzt, text: "Testtext" } },
    { id: "U3", teilnehmer: ["Otto Muster"], anzahl: 2, ungelesen: 0, letzte: { zeit: jetzt, text: "Testtext" } }];
  api = async (a, p) => { __api.push({ a, p });
    if (a === "unterhaltungen") return { unterhaltungen: __uh };
    if (a === "unterhaltung") return { nachrichten: [{ von: "Test", text: "Beispieltext", zeit: jetzt }] };
    if (a === "mitglieder") return { mitglieder: __mg };
    if (a === "spur_liste") return { personen: [], schritte: [], liste: [], jetztDa: [] };
    if (a === "mitglied_details") return { kontakt: {}, darfKontakte: false };
    return {}; };
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
});
const als = (admin, ansicht) => seite.evaluate(async ([admin, ansicht]) => {
  ICH = { ...(ICH || {}), person_id: "P1", name: "Admin Probe", vorname: "Admin", admin, vorstand: admin, buero: false }; document.body.classList.toggle("ist-admin", admin);
  MITGLIEDER = __mg; MITGLIEDER_STAND = Date.now(); ONL.stand = Date.now(); ONL.ids = new Set(["P2"]); // Anna online, Otto nicht
  zeige(ansicht); await new Promise((r) => setTimeout(r, 300)); if (ansicht === "nachrichten") await unterhLaden(); else mitgliederZeichnen();
}, [admin, ansicht]);
const fragen = (sel) => seite.evaluate((sel) => [...document.querySelectorAll(`${sel} .rk-was`)].map((b) => { const r = b.getBoundingClientRect(), k = b.closest("details").getBoundingClientRect(); return { pid: b.getAttribute("onclick").match(/'(P\d)'/)[1], rechts: k.right - r.right < 30, oben: r.top - k.top < 50 }; }), sel);
// 1) Admin, Chats-Kartei
await als(true, "nachrichten"); await seite.waitForTimeout(800);
ok(await seite.evaluate(() => !!document.querySelector("#uhKartei")), "Chats als Rollkartei");
let f = await fragen("#uhKartei");
ok(f.length === 1 && f[0].pid === "P2" && f[0].rechts && f[0].oben, "Chats-Kartei: „?“ nur bei Anna (online), oben rechts: " + JSON.stringify(f));
ok(!(await ueberlauf()), "390 px ohne Überlauf (Chats-Kartei)");
await bild("kartei-wege");
await seite.evaluate(() => { __api.length = 0; }); await seite.click("#uhKartei .rk-was"); await seite.waitForTimeout(500);
ok(await seite.evaluate(() => __api.some((x) => x.a === "spur_liste" && x.p.person_id === "P2")), "Antippen öffnet die Wege von Anna (spur_liste, person_id P2)");
ok(await seite.evaluate(() => /Wege der Mitglieder/.test(document.body.textContent)), "Wege-Fenster ist offen");
await bild("kartei-wege-2-offen");
await seite.evaluate(() => { document.querySelectorAll(".blatt, .dlg-blatt").forEach((b) => { if (/Wege der Mitglieder/.test(b.textContent)) b.remove(); }); });
// 2) Admin, Mitglieder-Kartei
await als(true, "mitglieder"); await seite.waitForTimeout(800);
f = await fragen("#mgKartei");
ok(f.length === 1 && f[0].pid === "P2" && f[0].rechts && f[0].oben, "Mitglieder-Kartei: „?“ nur bei Anna (online), nicht bei mir/Otto: " + JSON.stringify(f));
ok(!(await ueberlauf()), "390 px ohne Überlauf (Mitglieder-Kartei)");
await bild("kartei-wege-3-mitglieder");
// 3) offline → kein „?“
await seite.evaluate(() => { ONL.ids = new Set(); }); await als(true, "nachrichten"); await seite.evaluate(() => { ONL.ids = new Set(); return unterhLaden(); }); await seite.waitForTimeout(500);
ok((await fragen("#uhKartei")).length === 0, "niemand online → kein „?“");
// 4) Nicht-Admin → kein „?“
await als(false, "nachrichten"); await seite.waitForTimeout(500);
ok((await fragen("#uhKartei")).length === 0, "Mitglied (kein Admin) → kein „?“ in der Chats-Kartei");
await als(false, "mitglieder"); await seite.waitForTimeout(500);
ok((await fragen("#mgKartei")).length === 0, "Mitglied (kein Admin) → kein „?“ in der Mitglieder-Kartei");
ok(!fehler.length, "keine Seitenfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log(process.exitCode ? "kartei-wege-browser: FEHLER" : "kartei-wege-browser: alle Prüfungen bestanden");
