// KC-CLUB-LINK-VORSCHAU (2.486.0): Browser-Test des echten app.js (Chromium über playwright-core): Karte beim Schreiben, ✖, Senden mit
// vorschau_url, Karte in der Nachricht, Schutz gegen HTML/Skript in den Angaben. Start: node tools/link-vorschau/lv-browser.mjs (PW_CORE, PW_CHROME)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8797);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } });
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8797/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const erg = await seite.evaluate(async () => {
  const r = {}, warte = (ms) => new Promise((x) => setTimeout(x, ms));
  const VOR = { url: "https://www.beispiel.de/rezept", titel: "Rouladen <img src=x onerror=window.__xss=1>", text: "Omas Rezept \"lecker\"", seite: "Beispiel", bild: "https://www.beispiel.de/b.jpg" };
  window.__api = []; api = async (a, p) => { __api.push({ a, p }); if (a === "link_vorschau") return { vorschau: VOR }; if (a === "nachricht_senden") return { ok: true, id: "t1", mid: "m1" }; return { ok: true }; };
  chatLaden = async () => {}; chatId = "t1"; CHAT = { teilnehmer: [] };
  const t = document.getElementById("text"); t.value = "Schau mal https://www.beispiel.de/rezept lecker"; t.dispatchEvent(new Event("input", { bubbles: true }));
  await warte(1300);
  r.abgerufen = __api.filter((x) => x.a === "link_vorschau").map((x) => x.p.url);
  const k = document.querySelector("#lvEntwurf .lv-karte"); r.entwurfSichtbar = !!k; r.entwurfTitel = k?.querySelector(".lv-titel")?.textContent || "";
  r.xss = !!window.__xss || !!document.querySelector("#lvEntwurf img[onerror='window.__xss=1']");
  r.bildOhneReferrer = k?.querySelector("img.lv-bild")?.getAttribute("referrerpolicy") === "no-referrer";
  // nochmal tippen ohne neuen Link → kein neuer Abruf
  t.value += " !"; t.dispatchEvent(new Event("input", { bubbles: true })); await warte(1000);
  r.keinDoppelAbruf = __api.filter((x) => x.a === "link_vorschau").length === 1;
  WICHTIG = false; await senden(); const s1 = __api.find((x) => x.a === "nachricht_senden");
  r.sendetUrl = s1?.p?.vorschau_url; r.entwurfWegNachSenden = !document.querySelector("#lvEntwurf .lv-karte");
  // ✖ = ohne Vorschau senden
  t.value = "Noch einer https://www.beispiel.de/rezept"; t.dispatchEvent(new Event("input", { bubbles: true })); await warte(1300);
  document.querySelector("#lvEntwurf .lv-weg")?.click(); r.wegtippen = !document.querySelector("#lvEntwurf .lv-karte");
  __api.length = 0; await senden(); r.ohneUrl = !("vorschau_url" in (__api.find((x) => x.a === "nachricht_senden")?.p || { vorschau_url: 1 }));
  // Karte in der Nachricht
  const html = lvKarteHtml(VOR); const d = document.createElement("div"); d.innerHTML = html; document.body.appendChild(d);
  r.karteLink = d.querySelector("a.lv-karte")?.getAttribute("href"); r.karteRel = d.querySelector("a.lv-karte")?.getAttribute("rel");
  r.karteKeinXss = !d.querySelector("img[onerror='window.__xss=1']") && !window.__xss;
  r.jsAbgelehnt = lvKarteHtml({ ...VOR, url: "javascript:alert(1)" }) === "" && !/src="http:/.test(lvKarteHtml({ ...VOR, bild: "http://x.de/b.jpg" }));
  // App-Sprung-Links bekommen keine Vorschau
  __api.length = 0; t.value = "https://sire65.github.io/KC-Clubapp/#zu=termine"; t.dispatchEvent(new Event("input", { bubbles: true })); await warte(1100);
  r.sprungOhne = !__api.some((x) => x.a === "link_vorschau");
  return r;
});
ok(erg.abgerufen.length === 1 && erg.abgerufen[0] === "https://www.beispiel.de/rezept", "Link beim Schreiben erkannt, Vorschau einmal geholt");
ok(erg.entwurfSichtbar && erg.entwurfTitel.startsWith("Rouladen <img"), "Karte über dem Eingabefeld, Titel als Text");
ok(!erg.xss, "kein Skript aus den Vorschau-Angaben (Entwurf)");
ok(erg.bildOhneReferrer, "Bild ohne Absender-Angabe (no-referrer)");
ok(erg.keinDoppelAbruf, "Weitertippen ohne neuen Link: kein neuer Abruf");
ok(erg.sendetUrl === "https://www.beispiel.de/rezept" && erg.entwurfWegNachSenden, "Senden mit vorschau_url, Karte danach weg");
ok(erg.wegtippen && erg.ohneUrl, "✖ = ohne Vorschau senden");
ok(erg.karteLink === "https://www.beispiel.de/rezept" && /noopener/.test(erg.karteRel) && /noreferrer/.test(erg.karteRel), "Karte in der Nachricht öffnet den Link sicher");
ok(erg.karteKeinXss && erg.jsAbgelehnt, "Karte: kein Skript, keine javascript:-Links, keine http-Bilder");
ok(erg.sprungOhne, "App-Sprung-Links ohne Vorschau");
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
