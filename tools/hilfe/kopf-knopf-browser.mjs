// KC-CLUB-KOPF-EIN-KNOPF / KC-CLUB-KOPF-4-STUFEN (11.11.2026): Browser-Prüfung mit dem echten app.js – ein Knopf, vier Stufen (offen → Felder weg → halb → ganz → offen),
// Punkte zeigen die Stufe, lange drücken klappt sofort auf, Leuchten bei Neuem, nichts verdeckt; nur Testdaten, nichts an den Server.
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/kopf-knopf-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8826);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 }, deviceScaleFactor: 2 }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.goto("http://localhost:8826/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
await seite.evaluate(() => {
  ICH = { ...(ICH || {}), person_id: "P1", name: "Hans Test", vorname: "Hans", admin: false }; MITGLIEDER = MITGLIEDER || [];
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt"); api = async (a) => (a === "unterhaltungen" ? { unterhaltungen: [] } : {});
  try { localStorage.removeItem(KOPF_ROLLO); } catch {} zeige("start", true); kopfRolloSetzen("offen");
  for (const b of document.querySelectorAll("body > *")) if (/Welche Stimme soll dir/.test(b.textContent || "") && b.id !== "app") b.remove();
});
const weg = () => seite.evaluate(() => { for (const e of document.querySelectorAll(".meldung, .blatt:not(.versteckt)")) e.remove(); document.body.classList.remove("blatt-offen"); });
const lage = () => seite.evaluate(() => { const g = $("kopfPfeil"); return { stand: kopfRolloStand(), punkte: g.querySelectorAll(".kp-dots i.an").length, dreh: g.classList.contains("dreh"), aria: g.getAttribute("aria-expanded"), halb: !!$("kopfPfeilHalb") }; });
const bild = async (n) => { if (process.env.BILDER) await seite.screenshot({ path: `${process.env.BILDER}/kopf-${n}.png`, clip: { x: 0, y: 0, width: 400, height: 460 } }); };
const tipp = async () => { await weg(); await seite.click("#kopfPfeil"); await seite.waitForFunction(() => !document.querySelector("#v-start .hero")?.dataset.rollt, null, { timeout: 8000 }); await seite.waitForTimeout(300); };
await weg(); let l = await lage();
const sicht = () => seite.evaluate(() => ({ felder: !!document.querySelector("#heroInfo .kacheln3")?.getClientRects().length, lauf: !!$("heroInfo")?.getClientRects().length, leiste: !!document.querySelector("#v-start .statusleiste")?.getClientRects().length }));
let v = await sicht();
ok(!l.halb && l.stand === "offen" && l.punkte === 4 && !l.dreh && l.aria === "true" && v.felder && v.lauf && v.leiste, "nur ein Knopf; offen: ●●●● – alles zu sehen"); await bild("1-offen");
await tipp(); l = await lage(); v = await sicht(); ok(l.stand === "felder" && l.punkte === 3 && !v.felder && v.lauf && v.leiste, "1× tippen: drei Felder weg ●●●○"); await bild("2-felder");
await tipp(); l = await lage(); v = await sicht(); ok(l.stand === "halb" && l.punkte === 2 && !v.lauf && v.leiste, "2× tippen: Info-Laufschrift weg ●●○○"); await bild("3-halb");
await tipp(); l = await lage(); v = await sicht(); ok(l.stand === "ganz" && l.punkte === 1 && l.dreh && !v.leiste, "3× tippen: LED-/Statusleiste weg ●○○○, Pfeil nach unten"); await bild("4-ganz");
ok(await seite.evaluate(() => { try { return localStorage.getItem(KOPF_ROLLO) === "1"; } catch { return false; } }), "Stufe gemerkt");
await tipp(); l = await lage(); v = await sicht(); ok(l.stand === "offen" && l.punkte === 4 && v.felder, "4× tippen: wieder alles da");
await tipp(); ok(await seite.evaluate(() => { try { return localStorage.getItem(KOPF_ROLLO) === "felder"; } catch { return false; } }), "Stufe „felder“ gemerkt");
await seite.evaluate(() => { kopfRolloSetzen("offen"); try { localStorage.removeItem(KOPF_ROLLO); } catch {} });
// lange drücken aus „ganz“ → sofort auf, ohne dass der Klick danach weiterschaltet
await tipp(); await tipp(); await tipp(); await weg();
const b = await seite.locator("#kopfPfeil").boundingBox();
await seite.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await seite.mouse.down(); await seite.waitForTimeout(800); await seite.mouse.up();
await seite.waitForFunction(() => !document.querySelector("#v-start .hero")?.dataset.rollt, null, { timeout: 8000 }); await seite.waitForTimeout(400);
l = await lage(); ok(l.stand === "offen" && l.punkte === 4, "lange drücken: sofort ganz auf (Klick danach zählt nicht)");
// Leuchten bei Neuem in beiden eingerollten Stufen
for (const s of ["felder", "halb", "ganz"]) { await seite.evaluate((s) => { kopfRolloSetzen(s); KPN.an = true; kopfPfeilNeuZeigen(s); }, s);
  ok(await seite.evaluate(() => $("kopfPfeil").classList.contains("kp-neu")), `Neues: Knopf leuchtet (${s})`); if (s === "ganz") { await weg(); await seite.waitForTimeout(1000); await bild("5-neu"); } }
await seite.evaluate(() => { kopfRolloSetzen("offen"); kopfPfeilNeuZeigen("offen"); });
ok(await seite.evaluate(() => !$("kopfPfeil").classList.contains("kp-neu")), "offen: kein Leuchten");
// nichts verdeckt, kein Überlauf (360 und 412 px)
for (const w of [360, 412]) { await seite.setViewportSize({ width: w, height: 780 }); await seite.waitForTimeout(250);
  const t = await seite.evaluate(() => { const ids = ["kopfPfeil", "spKnopf", "netzBalken"], r = ids.map((i) => $(i)?.getBoundingClientRect()), treff = [];
    for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) { const a = r[i], c = r[j]; if (a && c && a.width && c.width && !(a.right <= c.left || a.left >= c.right || a.bottom <= c.top || a.top >= c.bottom)) treff.push(ids[i] + "/" + ids[j]); }
    return { treff, ueber: document.documentElement.scrollWidth > innerWidth + 1 }; });
  ok(!t.treff.length && !t.ueber, `${w} px: Knopf, Flagge und Balken überlappen nicht` + (t.treff.length ? " – " + t.treff.join(", ") : "")); }
ok(!fehler.filter((f) => !/tdt|unterhaltung/i.test(f)).length, "keine Fehler auf der Seite" + (fehler.length ? " – " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log(process.exitCode ? "kopf-knopf-browser: ROT" : "kopf-knopf-browser: alle Prüfungen bestanden");
