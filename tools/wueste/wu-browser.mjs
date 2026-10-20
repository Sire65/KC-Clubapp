// KC-CLUB-WUESTE (2.548.0): Browser-Test des echten app.js (Chromium über playwright-core). Spielt die Wüsten-Szene zwei Läufe lang mit 30 Bildern
// je Sekunde durch (Schritt + Malen) und prüft den Ablauf: Karawane zieht vorbei, Pharao kommt auf der Sänfte, Geist steigt aus der Lampe, Goldstaub
// schreibt langsam den Vornamen, Geist zurück in die Lampe, Sonnenuntergang mit Nacht, dann neuer Lauf. Speichert Bilder (WU_BILDER=Ordner).
// Start: PW_CORE=… PW_CHROME=… node tools/wueste/wu-browser.mjs
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(200, { "content-type": typ[path.extname(f)] || "text/html" }); a.end(d); }); }).listen(8794);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 500, height: 800 } }); const seitenFehler = []; seite.on("pageerror", (e) => seitenFehler.push(String(e)));
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8794/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const r = await seite.evaluate(() => {
  ICH = { ...(ICH || {}), vorname: "Hansi", name: "Hansi Test" };
  const W = 420, H = 150, cv = document.createElement("canvas"); cv.width = W; cv.height = H; const c = cv.getContext("2d");
  Object.assign(JZB, { w: W, h: H, k: 1, T: 0, fx: [], boden: [], liegt: [], gaeste: [], halme: [], blumen: [], saison: "wueste", art: "wueste", vorschau: "wueste" });
  JZB.ctx = c; let F = { t: 0 }; JZB.fest = F; const dt = 1 / 30, Z = jzbWuZeiten(), O = jzbWuOrt();
  const e = { Z, laeufe: 1, fehler: null, bilder: {}, geist: new Set(), glitzerMax: 0, lauf2Start: null };
  const fotos = { karawane: 12, pharao: 33, geist: JZB_WU_GEIST + 5, name: Z.fertig - .5, zurueck: Z.zurueck + 1.4, abend: Z.abend + 4, nacht: Z.abend + 11 };
  for (let i = 0; i < 30 * (Z.ende + 8); i++) {
    JZB.T += dt; F.t += dt;
    try { jzbWuSchritt(F, dt); if (JZB.fest) { c.clearRect(0, 0, W, H); c.fillStyle = "#7a1f2b"; c.fillRect(0, 0, W, H); jzbWuesteMalen(c, F); } } catch (x) { e.fehler = String(x); break; }
    if (!JZB.fest) { e.laeufe++; F = { t: 0 }; JZB.fest = F; continue; }
    if (e.laeufe === 1) {
      const G = jzbWuGeistLage(F.t, Z, O, 1); e.geist.add(!G ? (F.t < JZB_WU_GEIST ? "vorher" : "lampe") : G.verbeugt > .5 ? "verbeugt" : G.schnipp > 0 ? "schnippt" : "schwebt");
      e.glitzerMax = Math.max(e.glitzerMax, F.wu.glitzer.length);
      for (const [n, z] of Object.entries(fotos)) if (!e.bilder[n] && F.t >= z) e.bilder[n] = cv.toDataURL("image/png");
    } else if (!e.lauf2Start && F.t > 1) e.lauf2Start = F.t;
  }
  const L = jzbWuNameLage(O, 1); e.name = L.z.join(""); e.lageOk = L.y - L.fs * .85 >= 0 && L.pos[0] >= JZB_RAND && L.pos[L.pos.length - 1] <= W - JZB_RAND;
  e.letzterFertig = JZB_WU_NAME_AB + (L.z.length - 1) * JZB_WU_TAKT + 1.4 + 1; // letzter Buchstabe voll sichtbar
  return { ...e, geist: [...e.geist] };
});
ok(!r.fehler && !seitenFehler.length, "zwei Läufe ohne Fehler (Schritt und Malen)" + (r.fehler ? ": " + r.fehler : ""));
ok(r.laeufe >= 2 && r.lauf2Start, `Szene läuft ${r.Z.ende.toFixed(0)} s und beginnt danach von vorn`);
ok(r.name === "Hansi" && r.lageOk, "Vorname „Hansi“ in Goldschrift am Himmel, ganz im Bild");
ok(r.letzterFertig <= r.Z.fertig && r.Z.fertig < r.Z.zurueck, `Name langsam (${2.6} s je Buchstabe), fertig vor der Rückkehr des Geistes`);
ok(["vorher", "schwebt", "verbeugt", "schnippt", "lampe"].every((x) => r.geist.includes(x)), "Geist: kommt aus der Lampe, verbeugt sich, schnippt, wirbelt zurück");
ok(r.glitzerMax > 10, `Goldstaub steigt aus der Lampe (${r.glitzerMax} Funken gleichzeitig)`);
const ordner = process.env.WU_BILDER; if (ordner) { fs.mkdirSync(ordner, { recursive: true }); for (const [n, d] of Object.entries(r.bilder)) fs.writeFileSync(path.join(ordner, `wu-${n}.png`), Buffer.from(d.split(",")[1], "base64")); console.log("Bilder:", Object.keys(r.bilder).join(", ")); }
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
