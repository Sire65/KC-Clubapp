// 2.659.0 KC-CLUB-KACHEL-ECKEN: Browser-Test des echten app.js – Regler eckig … fast rund, „Standard“ setzt zurück, bleibt nach Neuladen.
// Start: PW_CORE=… PW_CHROME=… node tools/kachel-ecken/kachel-ecken-browser.mjs [bildordner]
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname), bilder = process.argv[2];
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8807);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 420, height: 860 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const laden = async () => { await seite.goto("http://localhost:8807/index.html"); await seite.waitForTimeout(2500);
  await seite.evaluate(() => { $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt"); ANSICHT = "erweitert"; zeige("start"); $("tdtBlatt")?.classList.add("versteckt"); }); await seite.waitForSelector(".kachel", { timeout: 8000 }); await seite.evaluate(() => $("tdtBlatt")?.classList.add("versteckt")); };
const ecke = () => seite.evaluate(() => getComputedStyle(document.querySelector("#raster .kachel, .kachel")).borderTopLeftRadius);
await laden(); const standard = await ecke();
ok(standard === "18px" && await seite.evaluate(() => $("kachelEckenText").textContent === "Standard" && $("kachelEckenStandard").disabled), "Standard: 18 px, Knopf „Standard“ ausgegraut");
await seite.evaluate(() => { const r = $("setKachelEcken"); r.value = 0; r.dispatchEvent(new Event("input")); });
ok((await ecke()) === "0px" && await seite.evaluate(() => $("kachelEckenText").textContent.includes("eckig")), "Regler ganz links: eckig");
if (bilder) await seite.screenshot({ path: path.join(bilder, "ecken-0.png") });
await seite.evaluate(() => { const r = $("setKachelEcken"); r.value = 60; r.dispatchEvent(new Event("input")); });
ok((await ecke()) === "60px" && await seite.evaluate(() => $("kachelEckenText").textContent.includes("fast rund")), "Regler ganz rechts: fast rund");
if (bilder) await seite.screenshot({ path: path.join(bilder, "ecken-60.png") });
await laden(); ok((await ecke()) === "60px" && await seite.evaluate(() => +$("setKachelEcken").value === 60), "bleibt nach Neuladen");
await seite.evaluate(() => $("kachelEckenStandard").click());
ok((await ecke()) === standard && await seite.evaluate(() => $("kachelEckenText").textContent === "Standard" && localStorage.getItem("kc_club_kachel_ecken") === null), "↺ Standard stellt die normalen Ecken wieder ein");
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
