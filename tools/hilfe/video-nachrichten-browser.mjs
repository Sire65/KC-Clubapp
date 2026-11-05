// KC-CLUB-VIDEO-NACHRICHTEN (Wunsch Hansi 05.11.2026): Browser-Prüfung des Erklär-Videos „Nachrichten – alles Schritt für Schritt“ mit dem echten app.js.
// Jeder Schritt: keine Fehler, Pflicht-Ziele sichtbar; danach kein Beispielbild offen, Ansicht/Leisten wie vorher, nichts an den Server. Dazu die Dauer.
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium node tools/hilfe/video-nachrichten-browser.mjs
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8796);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close());
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8796/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
await seite.evaluate(() => {
  ICH = { ...(ICH || {}), person_id: "P1", name: "Klaus Test", vorname: "Klaus", admin: false, vorstand: false, buero: false }; MITGLIEDER = MITGLIEDER || [];
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  window.__api = []; window.__apiEcht = async (a, p) => { __api.push({ a, p }); return a === "unterhaltungen" ? { unterhaltungen: [] } : {}; }; api = __apiEcht;
  try { speechSynthesis.speak = () => {}; } catch {}
});
await seite.evaluate(() => teilLaden("videos")); await seite.evaluate(() => teilLaden("hilfe"));
async function video(id, ms = 700) {
  return seite.evaluate(async ({ id, ms }) => {
    const warte = (t) => new Promise((x) => setTimeout(x, t)), los = (q) => (typeof q === "function" ? q() : document.querySelector(q));
    const schritte = []; rundgangStart(false, id); await warte(ms);
    for (let n = 0; n < 80 && RG.an; n++) {
      const s = RG.st[RG.i]; const ziele = (s.sel || []).map((q) => { try { return los(q); } catch { return null; } });
      schritte.push({ t: s.t, i: RG.i, sichtbar: ziele.some((z) => z && rgSichtbar(z)), muss: !!s.mussSel, x: typeof s.x === "function" ? s.x() : s.x });
      if (RG.i >= RG.st.length - 1) break;
      rundgangSchritt(1); await warte(RG.st[RG.i]?.tippVor ? ms + 2600 : ms); for (let w = 0; w < 20 && RG.tippLaeuft; w++) await warte(200);
    }
    rundgangEnde(true); await warte(500);
    return schritte;
  }, { id, ms });
}
const n = await video("nachrichten_alles");
for (const s of n) console.log(`${String(s.i).padStart(2)} ${s.muss ? (s.sichtbar ? "✓" : "✗") : s.sichtbar ? "·" : "-"} ${s.t}`);
const fehltPflicht = n.filter((s) => s.muss && !s.sichtbar).map((s) => s.t), fehltOhne = n.filter((s) => !s.muss && s.sel !== false && !s.sichtbar).map((s) => s.t);
ok(n.length >= 28, "alle Schritte durchlaufen (" + n.length + ")");
ok(!fehltPflicht.length, "alle Pflicht-Ziele sichtbar" + (fehltPflicht.length ? " – fehlt: " + fehltPflicht.join(" | ") : ""));
if (fehltOhne.length) console.log("Hinweis – ohne sichtbares Ziel (Text läuft trotzdem):", fehltOhne.join(" | "));
ok(n[0].t === "💬 Alles rund um Nachrichten" && n[1].t === "💬 Neue Nachricht" && n.at(-1).t === "✅ Fertig", "Reihenfolge: Einstieg, Plus Neu … Fertig");
const reihe = ["📝 Normal senden", "❗ Wichtig", "🏎️ Express – höchstens 5 am Tag", "📬 Express mit Bestätigung", "🧰 Die kleine Zeile", "𝐅 Fett, kursiv, Farbe und Marker", "👥 Nur die Nachrichten des anderen",
  "🟢 Vom Club nach WhatsApp", "📋 Von WhatsApp in den Club", "📸 Bildschirmfoto", "🖍️ Markieren in Farbe", "📂 Nachrichten gruppiert", "⋮ Die drei Punkte oben rechts", "ⓘ Die Info an jeder Nachricht", "🗂️ Übersicht gegliedert", "🔒 Schloss an", "🔑 Bequemer: der Schlüsselbund"];
const pos = reihe.map((t) => n.findIndex((s) => s.t === t));
ok(pos.every((p, i) => p >= 0 && (i === 0 || p > pos[i - 1])), "alle Teile in Hansis Reihenfolge" + (pos.some((p) => p < 0) ? " – fehlt: " + reihe.filter((t, i) => pos[i] < 0).join(", ") : ""));
const nach = await seite.evaluate(() => ({ sim: !!$("rgSim"), api: api === __apiEcht, filter: CHAT_FILTER_STAND, format: !$("formatLeiste").classList.contains("versteckt"), blatt: !$("chatBlatt").classList.contains("versteckt"),
  senden: __api.filter((x) => /senden|speichern|setzen|einstellung|merken|gesehen|loeschen|hochladen|anlegen/.test(x.a)).map((x) => x.a), dauer: rgDauerSek(RUNDGAENGE.find((r) => r.id === "nachrichten_alles")) }));
ok(!nach.sim && nach.api && nach.filter === "alle" && !nach.format && !nach.blatt, "danach: kein Beispielbild, alle Nachrichten sichtbar, F-Leiste und ⋮-Fenster zu");
ok(!nach.senden.length, "nichts gesendet oder gespeichert" + (nach.senden.length ? " – " + nach.senden.join(",") : ""));
console.log(`Dauer laut Video: ${Math.round(nach.dauer)} s (≈ ${(nach.dauer / 60).toFixed(1)} Min.)`);
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? " – " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log("video-nachrichten-browser: alle Prüfungen bestanden");
