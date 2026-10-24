// KC-CLUB-ROSE (24.10.2026): Sichtprüfung der Rose im Browser (Playwright, Handygröße 393×873) – rendert roseZeigen() mit Testdaten
// und speichert rose.png (aus der Schießbude) und rose-gruss.png (Gruß-Variante ohne Sim-Jü). Aufruf: node tools/rose/rose-browser.mjs [ordner]
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire("/opt/node-tools/node_modules/");
const { chromium } = require("playwright");
const wurzel = new URL("../../", import.meta.url), lies = (p) => fs.readFileSync(new URL(p, wurzel), "utf8");
const ziel = process.argv[2] || "/tmp/claude-0/-home-user/873368a4-1393-5000-bd3c-6ded628e8b84/scratchpad/rose";
const app = lies("app.js"), html = lies("index.html");
const js = app.slice(app.indexOf("// KC-CLUB-ROSE-ANFANG"), app.indexOf("// KC-CLUB-ROSE-ENDE"));
const css = html.slice(html.indexOf("/* KC-CLUB-ROSE-CSS-ANFANG */"), html.indexOf("/* KC-CLUB-ROSE-CSS-ENDE */"));
if (!js || !css) throw new Error("Marker KC-CLUB-ROSE fehlen");
const seite = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  @font-face { font-family: "KC Zart"; src: url(schriften/dancing-script.woff2); font-weight: 700; }
  body { margin: 0; font-family: system-ui, sans-serif; background: #f5eee3; height: 100vh; }
  .knopf { border: 0; border-radius: 14px; padding: 12px 18px; font-weight: 700; } .knopf.haupt { background: #741521; color: #fff; }
  ${css}</style></head><body><div style="padding:20px;color:#741521;font-weight:800">Köcheclub Werne – Startseite</div><script>
  const $ = (id) => document.getElementById(id), esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const JZB = {}, JZB_RAND = 22, SPAR = { an: false }, ES = {}, RG = null, ICH = null, INIT = null, aktuelleAnsicht = "start";
  const jzSimJueZeit = () => true, themaSchriftLaden = () => {}, api = async () => ({ ok: true });
  ${js.replace(/setInterval\([^\n]*\n/, "\n")}
</script></body></html>`;
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 393, height: 873 }, deviceScaleFactor: 2, reducedMotion: "reduce" });
  await page.route("http://test.local/**", (r) => { const u = new URL(r.request().url());
    if (u.pathname.startsWith("/schriften/")) return r.fulfill({ body: fs.readFileSync(new URL("." + u.pathname, wurzel)), contentType: "font/woff2" });
    return r.fulfill({ body: seite, contentType: "text/html" }); });
  await page.goto("http://test.local/");
  const fehler = []; page.on("pageerror", (e) => fehler.push(String(e)));
  for (const [datei, quelle] of [["rose.png", { x: 70, y: 150 }], ["rose-gruss.png", null]]) {
    await page.evaluate((q) => { roseZeigen("Christina", q); }, quelle);
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const n = await page.evaluate(() => ({ svg: !!document.querySelector("#roseSchicht .rose-svg"), schild: document.querySelector(".rose-karte b")?.textContent, gruss: !!document.querySelector(".rose-gruss") }));
    if (!n.svg || n.schild !== "Nur für dich" || n.gruss !== !quelle) throw new Error("Rose unvollständig: " + JSON.stringify(n));
    await page.screenshot({ path: `${ziel}/${datei}` }); console.log("gespeichert", `${ziel}/${datei}`);
  }
  if (fehler.length) throw new Error(fehler.join("\n"));
} finally { await browser.close(); }
