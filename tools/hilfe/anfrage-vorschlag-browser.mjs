// KC-CLUB-ANFRAGE-VORSCHLAG-BLEIBT (22.11.2026): Browser-Prüfung – früherer Gegenvorschlag bleibt nach „Nein“ als Hinweis sichtbar; nur ausgedachte Testdaten.

// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/anfrage-vorschlag-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8831);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ colorScheme: "light", viewport: { width: 390, height: 844 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close());
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8831/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
const B = process.env.BILDER;
const tag = (d, h, m) => { const x = new Date(Date.now() + d * 86400000); x.setUTCHours(h - 1, m, 0, 0); return x.toISOString(); }; // Berlin-Winterzeit (UTC+1)
const ANF = [
  { id: "A1", vonMir: true, anlass: "Probe Menüplanung", beginn: tag(3, 19, 0), ende: tag(3, 21, 0), ort: "Vereinsheim", notiz: "", status: "offen", gegenvorschlag: true, anlagen: [],
    von: { person_id: "P1", name: "Hans Test", vorname: "Hans" }, empfaenger: [
      { person_id: "P2", name: "Frida Beispiel", vorname: "Frida", antwort: "nein", notiz: null, geantwortet_am: tag(-1, 10, 0), gelesen_am: tag(-3, 9, 0), vorschlag: null,
        vorschlagAlt: { beginn: tag(4, 16, 30), ende: tag(4, 18, 0), am: tag(-5, 9, 0), status: null } },
      { person_id: "P3", name: "Klaus Probe", vorname: "Klaus", antwort: "ja", notiz: null, geantwortet_am: tag(-2, 10, 0), gelesen_am: tag(-3, 9, 0), vorschlag: null,
        vorschlagAlt: { beginn: tag(5, 18, 0), ende: null, am: tag(-4, 9, 0), status: "abgelehnt" } },
      { person_id: "P4", name: "Olga Muster", vorname: "Olga", antwort: null, notiz: null, geantwortet_am: tag(-1, 11, 0), gelesen_am: tag(-3, 9, 0), vorschlag: { beginn: tag(6, 17, 0), ende: null }, vorschlagAlt: null },
    ] },
  { id: "A2", vonMir: false, anlass: "Probe Einkauf", beginn: tag(4, 10, 0), ende: null, ort: "", notiz: "", status: "offen", gegenvorschlag: true, anlagen: [],
    von: { person_id: "P3", name: "Klaus Probe", vorname: "Klaus" }, meine: "nein", meinVorschlag: null, meinGelesen: tag(-1, 9, 0),
    meinVorschlagAlt: { beginn: tag(5, 11, 0), ende: tag(5, 12, 0), am: tag(-2, 9, 0), status: null },
    empfaenger: [{ person_id: "P1", name: "Hans Test", vorname: "Hans", antwort: "nein", vorschlag: null, vorschlagAlt: { beginn: tag(5, 11, 0), ende: tag(5, 12, 0), am: tag(-2, 9, 0), status: null } }] },
];
await seite.evaluate((ANF) => { ICH = { ...(ICH || {}), person_id: "P1", name: "Hans Test", vorname: "Hans" }; $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  document.documentElement.style.colorScheme = "light"; window.__api = [];
  api = async (a) => { __api.push(a); return a === "terminanfragen_liste" ? { anfragen: JSON.parse(JSON.stringify(ANF)) } : a === "unterhaltungen" ? { unterhaltungen: [] } : {}; };
  zeige("termine"); }, ANF);
await seite.waitForTimeout(1200); await seite.evaluate(() => taLaden()); await seite.waitForTimeout(500);
await seite.evaluate(() => document.querySelectorAll(".meldung, .blatt:not(.versteckt)").forEach((e) => e.remove()));
const l = await seite.evaluate(() => { const zeilen = [...document.querySelectorAll("#ta-A1 .ta-wer")].map((z) => ({ text: z.textContent.replace(/\s+/g, " ").trim(), valt: z.querySelector(".ta-valt")?.textContent || "", knoepfe: !!z.querySelector(".ta-vk") }));
  return { zeilen, mein: document.querySelector("#ta-A2 .ta-valt")?.textContent || "", breit: document.documentElement.scrollWidth }; });
const frida = l.zeilen.find((z) => /Frida/.test(z.text)), klaus = l.zeilen.find((z) => /Klaus/.test(z.text)), olga = l.zeilen.find((z) => /Olga/.test(z.text));
ok(frida && /abgelehnt/.test(frida.text) && /^🔄 hatte \S+ \d\d\.\d\d\., 16:30–18:00 vorgeschlagen \(\d\d\.\d\d\.\)$/.test(frida.valt) && !frida.knoepfe, "Frida (Nein) zeigt früheren Vorschlag: " + frida?.valt);
ok(klaus && /· ❌ abgelehnt$/.test(klaus.valt) && !klaus.knoepfe, "Klaus: entschiedener Vorschlag mit „abgelehnt“: " + klaus?.valt);
ok(olga && !olga.valt && olga.knoepfe, "Olga: offener Vorschlag mit Annehmen-Knöpfen, kein Hinweis");
ok(/^🔄 Du hattest .* vorgeschlagen \(\d\d\.\d\d\.\)$/.test(l.mein), "eigene Ansicht: " + l.mein);
ok(l.breit <= 390, "keine waagrechte Verschiebung bei 390 px (" + l.breit + ")");
if (B) { const r = await seite.evaluate(() => { const b = $("ta-A1").getBoundingClientRect(); return { x: 0, y: Math.max(0, b.y + scrollY - 8), width: innerWidth, height: b.height + 16 }; }); await seite.screenshot({ path: B + "/anfrage-vorschlag.png", clip: r, fullPage: true }); }
const fremd = (await seite.evaluate(() => __api)).filter((a) => !/^(terminanfragen_liste|terminanfrage_gelesen|unterhaltungen|spur_melden|start_melden|init|countdowns|treffen|treffen_liste|privattermine|todo_liste|terminfindung_liste|terminumfragen|terminumfragen_liste|privattermine_liste|einstellung_setzen)$/.test(a));
ok(!fremd.length, "nichts an den Server gespeichert" + (fremd.length ? " – " + fremd.join(",") : ""));
ok(!fehler.filter((f) => !/tdt|unterhaltung/i.test(f)).length, "keine Fehler auf der Seite" + (fehler.length ? " – " + fehler.slice(0, 3).join(" | ") : ""));
await browser.close(); srv.close();
console.log(process.exitCode ? "anfrage-vorschlag-browser: ROT" : "anfrage-vorschlag-browser: alle Prüfungen bestanden");
