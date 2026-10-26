// 2.654.0 KC-CLUB-SIMJUE-KARUSSELL: Browser-Test des echten app.js – neue Sim-Jü-Szene (Kinderkarussell, Herz, Naschbude) und die gespeicherte
// Riesenrad-Szene je zwei Minuten mit 30 Bildern je Sekunde malen, ohne Fehler. Start: PW_CORE=… PW_CHROME=… node tools/simjue/karussell-browser.mjs
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8801);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage(); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8801/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const r = await seite.evaluate(() => {
  ICH = { ...(ICH || {}), vorname: "Hansi", name: "Hansi Test" };
  const lauf = (variante) => { const jahr = new Date().getFullYear(), alt = JZB_KIRMES_JAHR[jahr]; if (variante) JZB_KIRMES_JAHR[jahr] = variante; else delete JZB_KIRMES_JAHR[jahr];
    const cv = document.createElement("canvas"); cv.width = 420; cv.height = 150; const c = cv.getContext("2d");
    Object.assign(JZB, { ctx: c, w: 420, h: 150, k: 1, T: 0, fx: [], boden: [], liegt: [], gaeste: [], halme: [], blumen: [], saison: "kirmes", art: "kirmes", vorschau: "kirmes", phase: "anfang" });
    let n = 0, fehlerText = null, v = jzbKirmesVariante(); const clown = []; // 2.666.0 KC-CLUB-SIMJUE-CLOWN: Ablauf mitschreiben
    try { for (let i = 0; i < 30 * 125; i++) { JZB.T += 1 / 30; jzbFest(1 / 30); if (JZB.fest) { c.clearRect(0, 0, 420, 150); jzbKirmesMalen(c, JZB.fest); n++;
      const C = JZB.fest.clown, z = C ? C.kind + ":" + C.ph + (C.hat ? "+ballon" : "") : ""; if (z && clown[clown.length - 1] !== z) clown.push(z); } } } catch (x) { fehlerText = String(x); }
    if (alt) JZB_KIRMES_JAHR[jahr] = alt; else delete JZB_KIRMES_JAHR[jahr];
    return { n, fehlerText, v, clown }; };
  return { neu: lauf(null), alt: lauf("riesenrad"), j2027: jzbKirmesVariante(new Date(2027, 9, 24)), j2026: jzbKirmesVariante(new Date(2026, 9, 25)) };
});
ok(!r.neu.fehlerText && r.neu.v === "karussell" && r.neu.n > 3000, `neue Szene (Kinderkarussell, Herz, Naschbude): ${r.neu.n} Bilder ohne Fehler`);
ok(!r.alt.fehlerText && r.alt.v === "riesenrad" && r.alt.n > 3000, `gespeicherte Riesenrad-Szene: ${r.alt.n} Bilder ohne Fehler`);
ok(r.j2026 === "karussell" && r.j2027 === "riesenrad", "2026 Karussell, 2027 wieder die Riesenrad-Szene");
const cl = r.neu.clown.join(" → ");
ok(/maedchen:rein → maedchen:warten → maedchen:geben → maedchen:weg\+ballon/.test(cl) && /junge:rein → junge:warten → junge:geben → junge:weg\+ballon/.test(cl) && cl.indexOf("maedchen") < cl.indexOf("junge"), "2.666.0 Clown: Mädchen bekommt einen Ballon, beim nächsten Mal ein Junge – " + cl);
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
