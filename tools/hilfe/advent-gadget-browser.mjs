// KC-CLUB-ADVENT-GADGETS (22.11.2026): Browser-Prüfung mit dem echten app.js – am 3.12. steht unter dem normalen Türchen-Inhalt zusätzlich
// „🎁 Heute zu gewinnen“ mit Foto, „🎲 Ich mache mit“ meldet an; nach der Auslosung „🎉 Gewonnen hat“. 390 px ohne Überlauf.
// Nur Testdaten – nichts an den Server (KC-TESTS-OHNE-ECHTSERVER).
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/advent-gadget-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".webp": "image/webp" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8858);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
// KC-TESTS-OHNE-ECHTSERVER: eigene Seite durchlassen; …/functions/v1/… mit Testdaten beantworten; alles andere abbrechen
await seite.route("**/*", (r) => {
  const u = r.request().url();
  if (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(u)) return r.continue();
  if (/\/functions\/v1\//.test(u)) return r.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  return r.abort();
});
await seite.routeWebSocket(/realtime\/v1\/websocket/, (ws) => ws.close());
await seite.goto("http://localhost:8858/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
await seite.evaluate(() => {
  window.__api = []; window.__dabei = false; window.__gezogen = false;
  api = async (a, p) => { __api.push({ a, p });
    if (a === "advent_gadget_stand" || a === "advent_gadget_mitmachen") { if (a === "advent_gadget_mitmachen") __dabei = true;
      return __gezogen ? { ok: true, tag: p.tag, phase: "vorbei", gezogen: true, gewinnerVorname: "Anne", teilnehmer: 5, ichDabei: true, ichGewonnen: false }
        : { ok: true, tag: p.tag, phase: "offen", gezogen: false, ichDabei: __dabei, teilnehmer: __dabei ? 5 : 4, schonGewonnen: false }; }
    return {}; };
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  ICH = { ...(ICH || {}), person_id: "P2", name: "Test", vorname: "Test", admin: false, zugang: "mitglied" };
  UHR_VERSATZ = Date.parse("2026-12-03T15:00:00+01:00") - Date.now();
  akZeigen(); akTuer(3);
});
await seite.waitForTimeout(800);
const st = await seite.evaluate(() => ({ karten: document.querySelectorAll("#akInhalt .ak-karte").length, titel: document.querySelector(".ak-gadget b")?.textContent, foto: document.querySelector(".ak-gadget-foto")?.getAttribute("loading"), knopf: !!document.querySelector("#akGadget button") }));
ok(st.karten === 2 && /Heute zu gewinnen: ausziehbares USB-Ladekabel/.test(st.titel) && st.foto === "lazy" && st.knopf, "Türchen-Inhalt bleibt, Gadget-Block dazu mit Foto (lazy) und Knopf: " + JSON.stringify(st));
await seite.click("#akGadget button"); await seite.waitForTimeout(500);
ok(/Du bist dabei/.test(await seite.evaluate(() => $("akGadget").textContent)) && await seite.evaluate(() => __api.some((x) => x.a === "advent_gadget_mitmachen" && x.p.tag === 3)), "„🎲 Ich mache mit“ → „Du bist dabei“");
await seite.evaluate(() => { for (const e of document.querySelectorAll(".meldung")) e.remove(); document.querySelector(".ak-gadget").scrollIntoView({ block: "center" }); });
await seite.waitForTimeout(500);
ok(await seite.evaluate(() => document.querySelector(".ak-gadget-foto").naturalWidth > 0), "Foto geladen");
ok(await seite.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "390 px ohne Überlauf");
if (process.env.BILDER) await seite.screenshot({ path: `${process.env.BILDER}/advent-gadget.png` });
await seite.evaluate(() => { __gezogen = true; akGadgetLaden(3); }); await seite.waitForTimeout(300);
ok(/Gewonnen hat: Anne/.test(await seite.evaluate(() => $("akGadget").textContent)), "nach der Auslosung: „🎉 Gewonnen hat: Anne“");
ok(!fehler.length, "keine Seitenfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log(process.exitCode ? "advent-gadget-browser: FEHLER" : "advent-gadget-browser: alle Prüfungen bestanden");
