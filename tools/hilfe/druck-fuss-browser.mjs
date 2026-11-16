// KC-CLUB-DRUCK-FUSS-NIE-ALLEIN (16.11.2026, Fund Hansi Buchungsliste „Fußzeile auf Seite 2“): PDF einer Querformat-Liste mit 10–60 Zeilen –
// auf der letzten Seite steht nie nur die Fußzeile (vorher bei 18/19/41/42 Zeilen nur Fußzeile, bei 39/40 leere Seite). Nur Testdaten, nichts an den Server.
// Start: PW_CORE=playwright node tools/hilfe/druck-fuss-browser.mjs
// KC-CLUB-KOPF-EIN-KNOPF / KC-CLUB-KOPF-4-STUFEN (11.11.2026): Browser-Prüfung mit dem echten app.js – ein Knopf, vier Stufen (offen → Felder weg → halb → ganz → offen),
// Punkte zeigen die Stufe, lange drücken klappt sofort auf, Leuchten bei Neuem, nichts verdeckt; nur Testdaten, nichts an den Server.
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/kopf-knopf-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8831);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 }, deviceScaleFactor: 2 }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.goto("http://localhost:8831/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
await seite.evaluate(() => { ICH = { ...(ICH || {}), person_id: "P1", name: "Hans Test", vorname: "Hans" }; });
const erg = await seite.evaluate(async () => {
  const raus = [];
  for (let n = 10; n <= 60; n += 1) {
    DRUCKARTEN.__test = { bauen: () => ({ titel: "Buchungsliste Erstattungen 2026", unter: "Stand: 16.11.2026", rechts: "", quer: true,
      html: `<p>Filter: alle</p><table style="width:100%;border-collapse:collapse;font-size:10.5pt"><thead><tr><th>ID</th><th>Name</th><th>Betrag</th></tr></thead><tbody>${Array.from({ length: n }, (_, i) => `<tr><td style="padding:4px 6px;border-bottom:1px solid #ddd">M${i}</td><td style="padding:4px 6px;border-bottom:1px solid #ddd">Test ${i}</td><td style="padding:4px 6px;border-bottom:1px solid #ddd">12,00 €</td></tr>`).join("")}</tbody></table>` }) };
    DRUCK = { art: "__test" }; await druckSeiteBauen();
    let seiten = null; const alt = pdfAusCanvas; pdfAusCanvas = (c, q, s) => { seiten = s; return new Blob(["x"]); };
    try { await druckPdfBlob(); } finally { pdfAusCanvas = alt; }
    if (!seiten) { raus.push([n, 1, "-"]); continue; }
    const letzte = seiten[seiten.length - 1], g = letzte.getContext("2d"), d = g.getImageData(0, 0, letzte.width, letzte.height).data;
    let unten = 0; const k = letzte.width / 1123;
    for (let y = letzte.height - 1; y >= 0 && !unten; y--) for (let x = 0; x < letzte.width; x += 4) { const i = (y * letzte.width + x) * 4; if (d[i] < 200 || d[i + 1] < 200) { unten = y / k; break; } }
    raus.push([n, seiten.length, Math.round(unten - 85)]); // Inhalt unter dem Seitenkopf (RAND+KOPF = 85 px)
  }
  return raus;
});
const mehr = erg.filter((x) => x[1] > 1);
console.log(mehr.map((x) => x.join(":")).join("  "));
ok(mehr.every((x) => x[2] > 80), "auf der letzten Seite steht nie nur die Fußzeile");
ok(!fehler.length, "keine Fehler " + fehler.join(" | "));
await browser.close(); srv.close();
