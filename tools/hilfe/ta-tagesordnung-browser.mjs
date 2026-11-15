// KC-CLUB-TA-TAGESORDNUNG (12.11.2026): Browser-Prüfung – Terminanfrage → Häkchen „Als Tagesordnung übernehmen“ → Besprechungsvorlage; nur Testdaten.

// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/ta-tagesordnung-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8827);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ colorScheme: "light", viewport: { width: 400, height: 800 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close());
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8827/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
const B = process.env.BILDER;
const ANF = [{ id: "A1", vonMir: true, anlass: "Vorbereitung Weihnachtsmarkt", beginn: new Date(Date.now() + 3 * 86400000).toISOString(), ende: null, ort: "Vereinsheim",
  notiz: "1. Dienstplan Stand\n- Einkauf Glühwein; Kasse und Wechselgeld\n• Deko für die Hütte", status: "offen", gegenvorschlag: true, anlagen: [],
  von: { person_id: "P1", name: "Hans Test", vorname: "Hans" }, empfaenger: [{ person_id: "P2", name: "Klaus Probe", antwort: "ja" }] }];
await seite.evaluate((ANF) => { ICH = { ...(ICH || {}), person_id: "P1", name: "Hans Test", vorname: "Hans" }; $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  try { localStorage.removeItem("kc_club_ta_tagesordnung"); } catch {} document.documentElement.style.colorScheme = "light";
  window.__api = []; window.__aendern = null; api = async (a, p) => { __api.push(a); if (a === "terminanfrage_aendern") { __aendern = p; ANF[0].notiz = p.notiz; return { ok: true, neu: 2, informiert: 1 }; }
    return a === "terminanfragen_liste" ? { anfragen: JSON.parse(JSON.stringify(ANF)) } : a === "unterhaltungen" ? { unterhaltungen: [] } : {}; };
  zeige("termine"); }, ANF);
await seite.waitForTimeout(1200); await seite.evaluate(() => taLaden()); await seite.waitForTimeout(500);
await seite.evaluate(() => document.querySelectorAll(".meldung, .blatt:not(.versteckt)").forEach((e) => e.remove()));
const lage = () => seite.evaluate(() => { const k = $("ta-A1"); return { schalter: !!k?.querySelector(".ta-to-schalter input"), an: !!k?.querySelector(".ta-to-schalter input")?.checked,
  punkte: [...(k?.querySelectorAll(".ta-to-liste li") || [])].map((l) => (l.querySelector("input").checked ? "☑ " : "☐ ") + l.querySelector("span").textContent), knopf: k?.querySelector('[onclick^="druckStarten"]')?.textContent || "" }; });
let l = await lage(); ok(l.schalter && !l.an && !l.punkte.length, "Häkchen „Als Tagesordnung übernehmen“ da, anfangs aus");
await seite.click("#ta-A1 .ta-to-schalter input"); await seite.waitForTimeout(200);
l = await lage(); ok(l.an && l.punkte.join("|") === "☑ Dienstplan Stand|☑ Einkauf Glühwein|☑ Kasse und Wechselgeld|☑ Deko für die Hütte" && /4 Punkte/.test(l.knopf), "Punkte aus der Notiz übernommen: " + l.punkte.join(" · "));
await seite.click("#ta-A1 .ta-to-liste li:nth-child(4) input"); await seite.fill("#taToNeu-A1", "Termine 2027"); await seite.press("#taToNeu-A1", "Enter"); await seite.waitForTimeout(200);
l = await lage(); ok(l.punkte.length === 5 && l.punkte[3].startsWith("☐") && l.punkte[4] === "☑ Termine 2027" && /4 Punkte/.test(l.knopf), "Punkt abgewählt, eigener Punkt ergänzt");
if (B) { const r = await seite.evaluate(() => { const b = $("ta-A1").getBoundingClientRect(); return { x: 0, y: Math.max(0, b.y + scrollY - 8), width: innerWidth, height: b.height + 16 }; }); await seite.screenshot({ path: B + "/ta-karte.png", clip: r, fullPage: true }); }
await seite.evaluate(() => taLaden()); await seite.waitForTimeout(400);
l = await lage(); ok(l.an && l.punkte.length === 5 && l.punkte[3].startsWith("☐"), "nach Neuladen gemerkt");
const d = await seite.evaluate(() => { const r = taBesprechungDruck("A1"); return { titel: r.titel, tops: (r.html.match(/>TOP \d+: /g) || []).length, linien: (r.html.match(/height:8\.5mm/g) || []).length, html: r.html }; });
ok(d.titel === "Besprechung: Vorbereitung Weihnachtsmarkt" && d.tops === 4 && d.linien >= 16 && /Klaus Probe/.test(d.html) && /Hans Test/.test(d.html) && /Beschlüsse \/ Sonstiges/.test(d.html) && !/Deko für die Hütte/.test(d.html) && /Termine 2027/.test(d.html), `Vorlage: ${d.tops} TOPs mit Schreiblinien (${d.linien}), Anwesende, abgewählter Punkt fehlt`);
await seite.click('#ta-A1 [onclick^="druckStarten"]'); await seite.waitForTimeout(2500);
ok(await seite.evaluate(() => !$("druckVorschau").classList.contains("versteckt") && /Tagesordnung/.test($("druckVorschauRahmen").contentDocument?.body?.textContent || "")), "Knopf öffnet die Druckvorschau");
if (B) { await seite.evaluate(async () => { druckVorschauZu(); await druckSeiteBauen(); }); await seite.waitForTimeout(800); await seite.emulateMedia({ colorScheme: "light" });
  await seite.pdf({ path: B + "/Beispiel-Besprechungsvorlage.pdf", format: "A4", printBackground: true, preferCSSPageSize: true }); }
// KC-CLUB-TA-AENDERN: Anfrage ändern/ergänzen, Klaus Bescheid geben
await seite.evaluate(() => druckVorschauZu?.());
await seite.evaluate(() => document.querySelectorAll(".meldung").forEach((e) => e.remove()));
await seite.click('#ta-A1 [onclick^="taAendern"]'); await seite.waitForTimeout(300);
const dlg = await seite.evaluate(() => ({ notiz: $("taAeNotiz")?.value, info: $("taAeInfo")?.checked, text: $("taAeBlatt")?.textContent.replace(/\s+/g, " ") }));
ok(dlg.info && /Klaus Bescheid geben/.test(dlg.text) && /Dienstplan Stand/.test(dlg.notiz), "Ändern-Fenster: Notiz vorbelegt, „Klaus Bescheid geben“ angehakt");
await seite.evaluate(() => { $("taAeNotiz").value += "\n- Neuer Finger-Barcode-Reader\n- Seltene Nutzung der Club-App"; $("taAeHinweis").value = "Es sind noch zwei Punkte dazugekommen."; });
if (B) { await seite.evaluate(() => document.querySelectorAll(".meldung").forEach((e) => e.remove())); await seite.screenshot({ path: B + "/ta-aendern.png" }); }
await seite.click("#taAeOk"); await seite.waitForTimeout(800);
const ae = await seite.evaluate(() => __aendern);
ok(ae && ae.id === "A1" && ae.informieren === true && /Finger-Barcode-Reader/.test(ae.notiz) && ae.hinweis === "Es sind noch zwei Punkte dazugekommen.", "gespeichert mit Bescheid und Hinweis");
const nachher = await seite.evaluate(() => [...document.querySelectorAll("#ta-A1 .ta-to-liste li span")].map((x) => x.textContent));
ok(nachher.includes("Neuer Finger-Barcode-Reader") && nachher.includes("Seltene Nutzung der Club-App"), "neue Punkte stehen in der Tagesordnung: " + nachher.join(" · "));
const fremd = (await seite.evaluate(() => __api)).filter((a) => a !== "terminanfrage_aendern" && !/^(terminanfragen_liste|terminanfrage_gelesen|unterhaltungen|spur_melden|start_melden|init|countdowns|treffen|treffen_liste|privattermine|todo_liste|terminfindung_liste|terminumfragen|terminumfragen_liste|privattermine_liste|einstellung_setzen)$/.test(a));
ok(!fremd.length, "nichts an den Server gespeichert" + (fremd.length ? " – " + fremd.join(",") : ""));
ok(!fehler.filter((f) => !/tdt|unterhaltung/i.test(f)).length, "keine Fehler auf der Seite" + (fehler.length ? " – " + fehler.slice(0, 3).join(" | ") : ""));
await browser.close(); srv.close();
console.log(process.exitCode ? "ta-tagesordnung-browser: ROT" : "ta-tagesordnung-browser: alle Prüfungen bestanden");
