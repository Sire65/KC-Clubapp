// KC-CLUB-ANFRAGE-ANDERE-ZEIT (22.11.2026): Browser-Prüfung – „🕐 Ja, aber zu anderer Zeit“ wählen, Anzeige in der Anfrage und im Terminplan (Kalender-Tag).
// Nur ausgedachte Testdaten; die App spricht mit keinem Server (api() nachgebildet, alles Fremde abgebrochen).
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/anfrage-andere-zeit-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8832);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ colorScheme: "light", viewport: { width: 390, height: 844 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e.stack || e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close());
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8832/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
const B = process.env.BILDER;
const tag = (d, h, m) => { const x = new Date(Date.now() + d * 86400000); x.setUTCHours(h - 1, m, 0, 0); return x.toISOString(); }; // Berlin-Winterzeit (UTC+1)
const ANF = [
  { id: "A1", vonMir: false, anlass: "Probe Vorbereitung", beginn: tag(1, 14, 30), ende: tag(1, 18, 0), ort: "Vereinsheim", notiz: "", status: "offen", gegenvorschlag: true, anlagen: [],
    von: { person_id: "P9", name: "Hans Test", vorname: "Hans" }, meine: null, meineZeit: null, meinVorschlag: null, meinGelesen: tag(-1, 9, 0), erinnerung: null, erinnerungStandard: 0,
    empfaenger: [
      { person_id: "P1", name: "Fritz Beispiel", vorname: "Fritz", antwort: null, notiz: null, gelesen_am: tag(-1, 9, 0), vorschlag: null, vorschlagAlt: null, zeit: null },
      { person_id: "P2", name: "Carla Probe", vorname: "Carla", antwort: "ja", notiz: null, gelesen_am: tag(-1, 9, 0), vorschlag: null, vorschlagAlt: null, zeit: { beginn: tag(1, 17, 0), ende: null } },
      { person_id: "P3", name: "Otto Test", vorname: "Otto", antwort: "ja", notiz: null, gelesen_am: tag(-1, 9, 0), vorschlag: null, vorschlagAlt: null, zeit: null },
      { person_id: "P4", name: "Nina Muster", vorname: "Nina", antwort: null, notiz: null, gelesen_am: tag(-1, 9, 0), vorschlag: { beginn: tag(3, 10, 0), ende: null }, vorschlagAlt: null, zeit: null },
    ] },
];
await seite.evaluate((ANF) => { ICH = { ...(ICH || {}), person_id: "P1", name: "Fritz Beispiel", vorname: "Fritz" }; $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  document.documentElement.style.colorScheme = "light"; window.__api = []; window.__ANF = ANF;
  api = async (a, p) => { __api.push({ a, p });
    if (a === "terminanfragen_liste") return { anfragen: JSON.parse(JSON.stringify(__ANF)) };
    if (a === "kalender") return { treffen: [], dienste: [], fristen: [], geburtstage: [], aktionen: [], anfragen: JSON.parse(JSON.stringify(__ANF)), privat: [], schulungen: [] };
    if (a === "terminanfrage_antwort") { const x = __ANF[0], z = p.zeit_beginn ? { beginn: p.zeit_beginn, ende: p.zeit_ende } : null; // nachgebildet wie der Server
      x.meine = p.antwort; x.meineZeit = z; x.meineNotiz = p.notiz || null; Object.assign(x.empfaenger[0], { antwort: p.antwort, zeit: z }); return { ok: true }; }
    return a === "unterhaltungen" ? { unterhaltungen: [] } : {}; };
  erinAnfrage = () => {}; neuLaden = () => {}; zeige("termine"); }, ANF);
await seite.waitForTimeout(1200); await seite.evaluate(() => { termineArt = "liste"; return taLaden(); }); await seite.waitForTimeout(500);
await seite.evaluate(() => document.querySelectorAll(".meldung, .blatt:not(#taAzBlatt)").forEach((e) => e.remove()));
// 1) Knopf „🕐 Ja, aber zu anderer Zeit“ → Blatt → 16:30–18:00 → zusagen
await seite.click("#ta-A1 .ta-az-knopf"); await seite.waitForTimeout(300);
ok(await seite.isVisible("#taAzBlatt"), "Blatt „andere Zeit“ geht auf");
await seite.fill("#taAzVon", "16:30"); await seite.fill("#taAzBis", "18:00");
if (B) await seite.screenshot({ path: B + "/andere-zeit-blatt.png" });
await seite.click("#taAzOk"); await seite.waitForTimeout(800);
const ant = (await seite.evaluate(() => __api)).find((x) => x.a === "terminanfrage_antwort")?.p;
ok(ant && ant.antwort === "ja" && /T15:30:00/.test(ant.zeit_beginn) && /T17:00:00/.test(ant.zeit_ende), "gesendet: Ja + 16:30–18:00 (" + JSON.stringify(ant) + ")");
const karte = await seite.evaluate(() => { const k = $("ta-A1"); return { az: k.querySelector(".ta-az:not(.ta-az-mein)")?.textContent || "", mein: k.querySelector(".ta-az-mein")?.textContent || "",
  summe: k.querySelector("details summary")?.textContent || "", wer: [...k.querySelectorAll(".ta-wer")].map((z) => z.textContent.replace(/\s+/g, " ").trim()), jaHaupt: k.querySelector(".ta-antw .knopf.haupt")?.textContent || "", breit: document.documentElement.scrollWidth }; });
ok(karte.az === "🕐 andere Zeit: Fritz 16:30–18:00, Carla ab 17:00", "Zeile in der Anfrage: " + karte.az);
ok(/Du kommst 16:30–18:00 Uhr – zählt als Zusage/.test(karte.mein), "eigener Hinweis: " + karte.mein);
ok(/✅ 3 \(🕐 2 andere Zeit\)/.test(karte.summe), "zählt als Zusage: " + karte.summe);
ok(karte.wer.some((z) => /✅ bestätigt · 🕐 16:30–18:00 Uhr Fritz/.test(z)), "Fritz bestätigt mit Zeit");
ok(karte.wer.some((z) => /🔄 schlägt anderen Termin vor: .* Nina/.test(z)), "Gegenvorschlag klar getrennt (Nina)");
ok(!karte.jaHaupt, "„✅ Ja“ nicht hervorgehoben (andere Zeit ist es)");
ok(karte.breit <= 390, "keine waagrechte Verschiebung bei 390 px (" + karte.breit + ")");
const bildKarte = await seite.evaluate(() => { const b = $("ta-A1").getBoundingClientRect(); return { x: 0, y: Math.max(0, b.y + scrollY - 8), width: innerWidth, height: b.height + 16 }; });
// 2) Terminplan (Kalender-Tag)
await seite.evaluate((t) => { zumTag(t); }, ANF[0].beginn.slice(0, 10)); await seite.waitForTimeout(1500);
await seite.evaluate(() => document.querySelectorAll(".meldung").forEach((e) => e.remove()));
const kal = await seite.evaluate(() => { const e = [...document.querySelectorAll("#kalTag .keintrag")].find((x) => /Probe Vorbereitung/.test(x.textContent)); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; });
ok(/🕐 du kommst 16:30–18:00 Uhr/.test(kal) && /✅ 3 von 4 zugesagt/.test(kal) && /🕐 andere Zeit: Fritz 16:30–18:00, Carla ab 17:00/.test(kal), "Terminplan: " + kal);
if (B) { // ein Bild: Anfrage oben, Terminplan-Tag darunter
  const kalRect = await seite.evaluate(() => { const b = $("kalTag").getBoundingClientRect(); return { x: 0, y: Math.max(0, b.y + scrollY - 8), width: innerWidth, height: Math.min(b.height + 16, 500) }; });
  await seite.screenshot({ path: B + "/andere-zeit-terminplan.png", clip: kalRect, fullPage: true });
  await seite.evaluate(() => { termineArt = "liste"; return treffenLaden(); }); await seite.waitForTimeout(1200); await seite.evaluate(() => taLaden()); await seite.waitForTimeout(500);
  await seite.evaluate(() => document.querySelectorAll(".meldung").forEach((e) => e.remove()));
  const r = await seite.evaluate(() => { const b = $("ta-A1").getBoundingClientRect(); return { x: 0, y: Math.max(0, b.y + scrollY - 8), width: innerWidth, height: b.height + 16 }; });
  await seite.screenshot({ path: B + "/andere-zeit-anfrage.png", clip: r || bildKarte, fullPage: true });
  // Gesamtbild: Anfrage oben, Terminplan darunter (nur lokale Bilder, eigene leere Seite ohne Netz)
  const bild = (n) => "data:image/png;base64," + fs.readFileSync(B + "/" + n).toString("base64");
  const s2 = await browser.newPage({ viewport: { width: 390, height: 400 } });
  await s2.route("**/*", (q) => (/^(data:|about:)/.test(q.request().url()) ? q.continue() : q.abort())); // KC-TESTS-OHNE-ECHTSERVER
  await s2.setContent(`<body style="margin:0;background:#222"><img src="${bild("andere-zeit-anfrage.png")}" style="display:block;width:390px"><img src="${bild("andere-zeit-terminplan.png")}" style="display:block;width:390px"></body>`);
  await s2.waitForTimeout(300); await s2.screenshot({ path: B + "/andere-zeit.png", fullPage: true }); await s2.close();
}
const fremd = (await seite.evaluate(() => __api.map((x) => x.a))).filter((a) => !/^(terminanfragen_liste|terminanfrage_gelesen|terminanfrage_antwort|kalender|ferien|todo_liste|unterhaltungen|spur_melden|start_melden|init|countdowns|treffen|treffen_liste|privattermine|terminfindung_liste|terminumfragen|terminumfragen_liste|privattermine_liste|einstellung_setzen)$/.test(a));
ok(!fremd.length, "nur nachgebildete Aufrufe" + (fremd.length ? " – " + fremd.join(",") : ""));
ok(!fehler.filter((f) => !/tdt|unterhaltung|vbStatusLed/i.test(f)).length /* vbStatusLed: Kopfzeilen-Lampe der Testseite, hat mit Terminanfragen nichts zu tun */, "keine Fehler auf der Seite" + (fehler.length ? " – " + fehler.slice(0, 3).join(" | ") : ""));
await browser.close(); srv.close();
console.log(process.exitCode ? "anfrage-andere-zeit-browser: ROT" : "anfrage-andere-zeit-browser: alle Prüfungen bestanden");
