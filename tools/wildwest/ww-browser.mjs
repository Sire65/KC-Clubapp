// KC-CLUB-WILDWEST (2.529.0, 2.532.0: + Indianer, Kakteen, Steppenläufer, Duell, Wagen): Browser-Test des echten app.js (Chromium über playwright-core). Spielt die Wild-West-Szene zwei Läufe lang mit
// 30 Bildern je Sekunde durch (Schritt + Malen) und prüft den Ablauf: Feuer und Zelt am Anfang, Cowboys und Kutsche je zweimal, die Herde
// trampelt Zelt und Feuer nieder, die Staubwolke deckt am Ende alles zu, der nächste Lauf beginnt in der Wolke und sie lichtet sich.
// Start: PW_CORE=… PW_CHROME=… node tools/wildwest/ww-browser.mjs
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8792);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 500, height: 800 } }); const seitenFehler = []; seite.on("pageerror", (e) => seitenFehler.push(String(e)));
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8792/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const r = await seite.evaluate(() => {
  const W = 420, H = 150, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const c = cv.getContext("2d");
  Object.assign(JZB, { w: W, h: H, k: 1, T: 0, fx: [], boden: [], liegt: [], gaeste: [], halme: [], blumen: [], saison: "wildwest", art: "wildwest", vorschau: "wildwest" });
  let F = { t: 0 }; JZB.fest = F; const dt = 1 / 30, e = { ballen: false, duellBilder: 0, laeufe: 1, reiter: new Set(), kutsche: new Set(), fehler: null, start: null, zeltPlatt: false, feuerAus: false, herdeMax: 0, schleierEnde: 0, lauf2: [] };
  for (let i = 0; i < 30 * 106; i++) {
    JZB.T += dt; F.t += dt;
    try { jzbWwSchritt(F, dt); if (JZB.fest) { c.clearRect(0, 0, W, H); jzbWildwestMalen(c, F); } } catch (x) { e.fehler = String(x); break; }
    if (!JZB.fest) { e.laeufe++; F = { t: 0 }; JZB.fest = F; continue; }
    const S = F.ww;
    if (e.laeufe === 1) {
      if (!e.start && F.t > 1) e.start = { zelt: S.zeltFall, feuer: S.feuerAus, schleier: S.schleier, horizont: S.horizont.length };
      if (S.reiter) e.reiter.add(F.t < 40 ? 1 : 2); if (S.kutsche) e.kutsche.add(F.t < 55 ? 1 : 2);
      e.herdeMax = Math.max(e.herdeMax, S.herde.length); if (S.zeltFall >= 1) e.zeltPlatt = true; if (S.feuerAus >= 1) e.feuerAus = true;
      if (F.t > 94) e.schleierEnde = S.schleier;
      if (S.ballen.length) e.ballen = true;
      if (F.t >= JZB_WW_DUELL && F.t < JZB_WW_DUELL + 27) e.duellBilder++; // Duell, Verwundeter, Wagen, Abtransport – jedes Bild gemalt (Fehler würden oben abbrechen)
    } else if ([.5, 2, 5].some((z) => Math.abs(F.t - z) < dt / 2)) e.lauf2.push([Math.round(F.t * 10) / 10, S.schleier, S.zeltFall, S.feuerAus]);
  }
  return { ...e, reiter: [...e.reiter], kutsche: [...e.kutsche] };
});
ok(!r.fehler && !seitenFehler.length, "zwei Läufe ohne Fehler (Schritt und Malen)" + (r.fehler ? ": " + r.fehler : ""));
ok(r.start && r.start.zelt === 0 && r.start.feuer === 0 && r.start.schleier === 0, "Anfang: Tipi steht, Lagerfeuer brennt, kein Staub");
ok(r.reiter.length === 2 && r.kutsche.length === 2, "zwei Cowboys reiten zweimal vorbei, die Kutsche kommt zweimal");
ok(r.herdeMax >= 30 && r.zeltPlatt && r.feuerAus, `Büffelherde (${r.herdeMax}) trampelt Zelt und Feuer nieder`);
ok(r.schleierEnde > .95, "zum Schluss deckt die Staubwolke alles zu");
ok(r.ballen, "2.532.0: Windstoß rollt einen Steppenläufer durchs Bild");
ok(r.duellBilder > 27 * 29, `2.532.0: Duell und Abtransport des Verwundeten über ${r.duellBilder} Bilder ohne Fehler gemalt`);
ok(r.laeufe >= 2 && r.lauf2.length === 3 && r.lauf2[0][1] > .8 && r.lauf2[2][1] === 0 && r.lauf2.every((x) => x[2] === 0 && x[3] === 0), "nächster Lauf beginnt in der Wolke, sie lichtet sich – Zelt und Feuer wieder da");
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
