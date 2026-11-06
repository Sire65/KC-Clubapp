// KC-CLUB-MARIENKAEFER + KC-CLUB-GLUECKSKLEE (06.11.2026): Browser-Prüfung mit dem echten app.js – Käfer krabbelt zur Mitte, steht, lächelt, geht;
// Kleeblatt wird hereingeweht, liegt, wird weggeweht; Antippen zeigt einen Spruch; danach ist alles wieder weg; keine Fehler, nichts an den Server.
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/glueck-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8809);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close());
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8809/index.html"); await seite.waitForTimeout(2500);
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
const bild = async (n) => { if (process.env.BILDER) await seite.screenshot({ path: process.env.BILDER + "/" + n + ".png" }); };
await seite.evaluate(() => { zeige("start", true); for (const b of document.querySelectorAll("body > *")) if (/Welche Stimme soll dir/.test(b.textContent || "") && b.id !== "app") b.remove(); });
// 🐞
const apiVorher = await seite.evaluate(() => __api.length);
await seite.evaluate(() => kaeferKommt(true)); await seite.waitForTimeout(800);
ok(await seite.evaluate(() => !!document.querySelector(".gl-kaefer")), "Käfer erscheint (Teil nachgeladen)");
await seite.waitForTimeout(1200); await bild("kaefer-unterwegs");
await seite.waitForTimeout(4400);
const mitte = await seite.evaluate(() => { const r = document.querySelector(".gl-kaefer").getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: innerWidth, h: innerHeight, vorn: document.querySelector(".gl-kaefer").classList.contains("vorn") }; });
ok(Math.abs(mitte.x - mitte.w / 2) < 40 && Math.abs(mitte.y - mitte.h * 0.5) < 60 && mitte.vorn, "Käfer steht in der Mitte und schaut nach vorn (" + Math.round(mitte.x) + "/" + Math.round(mitte.y) + ")");
await bild("kaefer-mitte");
await seite.click(".gl-kaefer"); await seite.waitForTimeout(400);
ok(await seite.evaluate(() => /Marienkäfer sagt/.test($("kaeferBlatt")?.textContent || "") && KAEFER_SPRUECHE.some((s) => $("kaeferBlatt").textContent.includes(s))), "Antippen: Glücksspruch vom Käfer");
await bild("kaefer-spruch");
await seite.evaluate(() => $("kaeferBlatt")?.remove());
await seite.waitForTimeout(7500);
ok(await seite.evaluate(() => !document.querySelector(".gl-kaefer")), "Käfer ist weitergekrabbelt und weg");
// 🍀
await seite.evaluate(() => kleeKommt(true)); await seite.waitForTimeout(700);
ok(await seite.evaluate(() => !!document.querySelector(".gl-klee") && document.querySelectorAll(".gl-wind").length > 0), "Windstoß weht das Kleeblatt herein");
await bild("klee-wind"); await seite.waitForTimeout(3600);
ok(await seite.evaluate(() => document.querySelector(".gl-klee")?.classList.contains("liegt")), "Kleeblatt liegt");
await bild("klee-liegt");
await seite.click(".gl-klee"); await seite.waitForTimeout(400);
ok(await seite.evaluate(() => KLEE_SPRUECHE.some((s) => ($("kleeBlatt")?.textContent || "").includes(s))), "Antippen: Glücksspruch vom Klee");
await bild("klee-spruch"); await seite.evaluate(() => $("kleeBlatt")?.remove());
await seite.waitForTimeout(7000); await bild("klee-weg"); await seite.waitForTimeout(3500);
ok(await seite.evaluate(() => !document.querySelector(".gl-klee") && !document.querySelector(".gl-wind")), "zweiter Windstoß: Kleeblatt ist weg");
// abgeschaltet: kommt nicht (ohne Vorschau)
await seite.evaluate(() => { einstellung("kaefer", false); einstellung("klee", false); kaeferKommt(); kleeKommt(); }); await seite.waitForTimeout(500);
ok(await seite.evaluate(() => !document.querySelector(".gl-kaefer, .gl-klee")), "abgeschaltet: kommt nicht");
await seite.evaluate(() => { einstellung("kaefer", true); einstellung("klee", true); });
const senden = await seite.evaluate((n) => __api.slice(n).filter((x) => !/^(spur_melden|unterhaltungen|start_melden|countdowns)$/.test(x.a)).map((x) => x.a), apiVorher);
ok(!senden.length, "nichts an den Server (außer den üblichen Start-Meldungen und Wegen)" + (senden.length ? " – " + senden.join(",") : ""));
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? " – " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log("glueck-browser: alle Prüfungen bestanden");
