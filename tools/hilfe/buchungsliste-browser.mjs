// KC-CLUB-ERSTATTUNG-BUCHUNGEN (11.11.2026): Browser-Prüfung der Buchungsliste – Summen, Filter (▸/▾), je Buchung/je Mitglied, Druck im Club-Design, CSV; nur Testdaten.

// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/buchungsliste-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8821);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close());
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8821/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const TEST = { jahr: 2026, zeilen: [
  { id: "a1:0", a: "a1", p: "P1", d: "2026-10-03", art: "fahrt", km: 64, b: 24.32, st: "offen", bar: null, ueb: null },
  { id: "a1:1", a: "a1", p: "P1", d: "2026-10-03", art: "parken", km: 0, b: 4.5, st: "offen", bar: null, ueb: null },
  { id: "a2:0", a: "a2", p: "P2", d: "2026-09-12", art: "einkauf", km: 0, b: 86.4, st: "erstattet", bar: "2026-09-20", ueb: null },
  { id: "a3:0", a: "a3", p: "P3", d: "2026-10-21", art: "fahrt", km: 120, b: 45.6, st: "erstattet", bar: null, ueb: "2026-10-25" },
  { id: "a3:1", a: "a3", p: "P3", d: "2026-11-02", art: "kraftstoff", km: 0, b: 52.1, st: "erstattet", bar: null, ueb: "2026-11-05" } ],
  personen: { P1: { nr: "KC-0011", vorname: "Manfred", nachname: "Muster" }, P2: { nr: "KC-0004", vorname: "Anne", nachname: "Beispiel" }, P3: { nr: "KC-0020", vorname: "Klaus", nachname: "Probe" } },
  gruppen: [{ id: "G1", name: "Küchenteam", symbol: "👨‍🍳", personen: ["P1", "P3"] }] };
await seite.evaluate((T) => { ICH = { ...(ICH || {}), person_id: "P9", name: "Kassen Wart", vorname: "Kassen", admin: false, vorstand: false, aemter: ["Kassenwart"] }; $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  window.__api = []; api = async (a, p) => { __api.push({ a, p }); return a === "erstattung_buchungen" ? JSON.parse(JSON.stringify(T)) : a === "unterhaltungen" ? { unterhaltungen: [] } : {}; };
  try { localStorage.removeItem("kc_club_ebl"); } catch {} }, TEST);
const lage = () => seite.evaluate(() => { const f = $("eblBlatt"); return { summen: f?.querySelector(".ebl-summen")?.innerText.replace(/\s+/g, " ").trim(), zeilen: f?.querySelectorAll(".ebl-tab tbody tr").length, kopf: [...(f?.querySelectorAll(".ebl-tab thead th") || [])].map((t) => t.textContent.trim()) }; });
await seite.evaluate(() => ersBuchOeffnen()); await seite.waitForTimeout(800);
let l = await lage(); console.log(JSON.stringify(l));
ok(/5 Buchungen/.test(l.summen) && /184 km/.test(l.summen) && /212,92 €/.test(l.summen) && l.zeilen === 5, "Summen oben: 5 Buchungen, 184 km, 212,92 € gesamt");
ok(/28,82 € ⏳ offen/.test(l.summen) && /86,40 € 💶 bar/.test(l.summen) && /97,70 € 🏦 überwiesen/.test(l.summen), "davon offen, bar, überwiesen");
ok(["ID", "Name", "Vorname", "Datum", "Art", "km", "Betrag", "💶 Bar am", "🏦 Überwiesen am"].every((t, i) => l.kopf[i]?.startsWith(t)), "Spalten: ID, Name, Vorname, Datum, Art, km, Betrag, Bar am, Überwiesen am");
const auf = await seite.evaluate(async () => { const d = document.querySelector('#eblBlatt details[data-k="monat"]'); const vor = d.open; d.querySelector("summary").click(); await new Promise((r) => setTimeout(r, 200)); const sum = document.querySelector('#eblBlatt details[data-k="monat"] summary'), pf = getComputedStyle(sum, "::before").content + getComputedStyle(sum, "::after").content; return [vor, document.querySelector('#eblBlatt details[data-k="monat"]').open, pf, document.querySelectorAll("#eblBlatt .ebl-pfeil").length]; });
ok(auf[0] === false && auf[1] === true && auf[3] === 0, "Filter klappt mit dem üblichen Pfeil der App auf (" + auf[2] + ")");
await seite.evaluate(() => document.querySelector('#eblBlatt [data-ebl="monat"][data-w="10"]').click()); await seite.waitForTimeout(200);
l = await lage(); ok(l.zeilen === 3 && /3 Buchungen/.test(l.summen) && /74,42 €/.test(l.summen), "Monat Oktober: 3 Buchungen, 74,42 €");
ok(await seite.evaluate(() => document.querySelector('#eblBlatt details[data-k="monat"]').open), "aufgeklappter Filter bleibt offen");
await seite.evaluate(() => { document.querySelector('#eblBlatt [data-ebl="monat"][data-w="0"]').click(); }); await seite.waitForTimeout(150);
await seite.evaluate(() => { document.querySelector('#eblBlatt [data-ebl="art"][data-w="fahrt"]').click(); }); await seite.waitForTimeout(150);
l = await lage(); ok(l.zeilen === 2 && /184 km/.test(l.summen) && /69,92 €/.test(l.summen), "Kostenart nur Fahrtkosten angehakt: 2 Buchungen, 184 km, 69,92 €");
await seite.evaluate(() => { document.querySelector('#eblBlatt [data-ebl="art"][data-w=""]').click(); document.querySelector('#eblBlatt [data-ebl="gruppe"][data-w="G1"]').click(); }); await seite.waitForTimeout(150);
l = await lage(); ok(l.zeilen === 4 && /126,52 €/.test(l.summen), "Gruppe Küchenteam: 4 Buchungen, 126,52 €");
await seite.evaluate(() => { document.querySelector('#eblBlatt [data-ebl="gruppe"][data-w=""]').click(); document.querySelector('#eblBlatt [data-ebl="person"][data-w="P2"]').click(); }); await seite.waitForTimeout(150);
l = await lage(); ok(l.zeilen === 1 && /86,40 €/.test(l.summen), "einzelnes Mitglied angehakt: Anne, 86,40 €");
await seite.evaluate(() => { document.querySelector('#eblBlatt [data-k="zurueck"]').click(); document.querySelector('#eblBlatt [data-ebl="ansicht"][data-w="mitglied"]').click(); }); await seite.waitForTimeout(150);
l = await lage(); ok(l.zeilen === 3, "je Mitglied: 3 Zeilen");
await seite.evaluate(() => document.querySelector('#eblBlatt [data-m="P3"]').click()); await seite.waitForTimeout(150);
l = await lage(); ok(l.zeilen === 5, "Antippen klappt die Buchungen des Mitglieds auf");
if (process.env.BILDER) { await seite.evaluate(() => document.querySelectorAll(".meldung").forEach((e) => e.remove())); await seite.screenshot({ path: process.env.BILDER + "/buchungsliste-mitglied.png" }); }
await seite.evaluate(() => document.querySelector('#eblBlatt [data-ebl="ansicht"][data-w="buchung"]').click()); await seite.waitForTimeout(150);
if (process.env.BILDER) { await seite.evaluate(() => document.querySelectorAll(".meldung").forEach((e) => e.remove())); await seite.screenshot({ path: process.env.BILDER + "/buchungsliste-handy.png", fullPage: false }); }
// Druck im Club-Design
const d = await seite.evaluate(async () => { const r = await eblDruck(); return { titel: r.titel, quer: r.quer, zeilen: (r.html.match(/<tr>/g) || []).length, summe: /212,92 €/.test(r.html) }; });
ok(d.titel === "Buchungsliste Erstattungen 2026" && d.quer && d.zeilen === 7 && d.summe, "Druck: Titel, A4 quer, Kopfzeile + 5 Buchungen + Summenzeile");
await seite.evaluate(() => druckStarten("buchungsliste")); await seite.waitForTimeout(2500);
const dv = await seite.evaluate(() => { const v = $("druckVorschau"), f = $("druckVorschauRahmen"); return { offen: v && !v.classList.contains("versteckt"), text: f?.contentDocument?.body?.textContent?.replace(/\s+/g, " ").slice(0, 2000) || "" }; });
ok(dv.offen && /Buchungsliste Erstattungen 2026/.test(dv.text) && /KC-0020/.test(dv.text), "Druckvorschau öffnet mit Club-Kopf und Liste");
if (process.env.BILDER) await seite.screenshot({ path: process.env.BILDER + "/buchungsliste-druck.png" });
await seite.evaluate(() => druckVorschauZu());
// Zugriff: ohne Amt kein Abruf
const zu = await seite.evaluate(async () => { const n = __api.length; ICH.aemter = []; await ersBuchOeffnen(); return __api.slice(n).filter((x) => x.a === "erstattung_buchungen").length; });
ok(zu === 0, "ohne Kassenwart/Clubsprecher/Admin: kein Abruf");
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? " – " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log("buchungsliste-browser: alle Prüfungen bestanden");
