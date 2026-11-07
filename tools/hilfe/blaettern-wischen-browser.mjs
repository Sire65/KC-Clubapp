// KC-CLUB-BLAETTERN-WISCHEN + KC-CLUB-BLAETTERN-ZOOM (Fund Hansi 07.11.2026): Browser-Prüfung mit echten Touch-Gesten im Club-Magazin (Roman-Seite):
// langsames, leicht schräges Lesen-Schieben blättert NICHT um; ein zügiger waagerechter Wisch blättert; zwei Finger vergrößern die Schrift (höchstens 160 %).
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/blaettern-wischen-browser.mjs
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8813);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 }, hasTouch: true, isMobile: true }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close());
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8813/index.html"); await seite.waitForTimeout(2500);
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
await seite.evaluate(async () => { ICH.admin = true; for (const b of document.querySelectorAll("body > *")) if (/Welche Stimme soll dir/.test(b.textContent || "") && b.id !== "app") b.remove();
  await magStart(); await new Promise((x) => setTimeout(x, 1500)); blGehe(BL.seiten.findIndex((s) => s.register === "Fortsetzungsroman"), 0); await new Promise((x) => setTimeout(x, 800)); });
const cdp = await seite.context().newCDPSession(seite);
const tippe = (typ, punkte) => cdp.send("Input.dispatchTouchEvent", { type: typ, touchPoints: punkte.map(([x, y], i) => ({ x, y, id: i })) });
const warte = (ms) => seite.waitForTimeout(ms);
const seiteNr = () => seite.evaluate(() => BL.i);
const vorher = await seiteNr();
// 1) langsam lesen: nach oben schieben, dabei 75 px nach rechts abdriften – darf NICHT blättern
await tippe("touchStart", [[160, 600]]); for (let k = 1; k <= 20; k++) { await tippe("touchMove", [[160 + k * 3.75, 600 - k * 12]]); await warte(60); } await tippe("touchEnd", []); await warte(900);
ok(await seiteNr() === vorher, "langsames Lesen mit schrägem Finger blättert nicht um");
// 2) kurz nach unten, dann zur Seite – auch nicht
await tippe("touchStart", [[300, 400]]); await tippe("touchMove", [[300, 380]]); await tippe("touchMove", [[200, 375]]); await tippe("touchEnd", []); await warte(900);
ok(await seiteNr() === vorher, "erst geschoben, dann seitlich: kein Blättern");
// 3) zügiger waagerechter Wisch – blättert
await tippe("touchStart", [[320, 450]]); for (let k = 1; k <= 5; k++) { await tippe("touchMove", [[320 - k * 40, 452]]); await warte(20); } await tippe("touchEnd", []); await warte(900);
ok(await seiteNr() === vorher + 1, "zügiger Wisch nach links blättert weiter");
await seite.evaluate(() => blGehe(BL.i - 1, 0)); await warte(400);
// 4) zwei Finger auseinander: Schrift größer, höchstens 160 %
await tippe("touchStart", [[170, 400], [230, 400]]); for (let k = 1; k <= 10; k++) { await tippe("touchMove", [[170 - k * 12, 400], [230 + k * 12, 400]]); await warte(30); } await tippe("touchEnd", []); await warte(400);
const z = await seite.evaluate(() => ({ z: BL.zoom, css: getComputedStyle(document.querySelector(".bl-html")).zoom, breit: document.querySelector(".bl-html").getBoundingClientRect().width, seite: document.querySelector(".bl-seite").getBoundingClientRect().width, gemerkt: localStorage.getItem("kc_club_bl_zoom") }));
ok(z.z === 1.6 && Math.abs(Number(z.css) - 1.6) < 0.01 && z.gemerkt === "1.6", "Schrift vergrößert, gedeckelt bei 160 % und gemerkt (" + JSON.stringify(z) + ")");
ok(z.breit <= z.seite + 1, "Text bleibt in der Seite (bricht neu um)");
if (process.env.BILDER) await seite.screenshot({ path: process.env.BILDER + "/roman-zoom.png" });
ok(await seiteNr() === vorher, "Zwei-Finger-Zoom blättert nicht");
// 5) zusammenschieben: zurück auf 100 %
await tippe("touchStart", [[80, 400], [320, 400]]); for (let k = 1; k <= 10; k++) { await tippe("touchMove", [[80 + k * 10, 400], [320 - k * 10, 400]]); await warte(30); } await tippe("touchEnd", []); await warte(300);
ok(await seite.evaluate(() => BL.zoom) === 1, "zusammenschieben: zurück auf 100 %, nicht kleiner");
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? " – " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log("blaettern-wischen-browser: alle Prüfungen bestanden");
