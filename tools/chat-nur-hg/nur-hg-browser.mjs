// 2.591.0 KC-CLUB-CHAT-NUR-HG: Browser-Test des echten app.js (Chromium über playwright-core). Knopf 👥 in der kleinen Zeile:
// alle → nur andere → nur meine → 🖼️ nur Hintergrund (alle Nachrichten unsichtbar, Hintergrund voll) → wieder alle; Verlassen des Chats stellt zurück.
// Start: PW_CORE=… PW_CHROME=… node tools/chat-nur-hg/nur-hg-browser.mjs  (Bilder: HG_BILD=<Ordner>)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8798);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 400, height: 820 }, hasTouch: true, isMobile: true }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8798/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const bild = async (n) => { if (process.env.HG_BILD) await seite.screenshot({ path: path.join(process.env.HG_BILD, n + ".png") }); };
const r = await seite.evaluate(async () => {
  const warte = (t) => new Promise((x) => setTimeout(x, t)), e = { schritte: [] };
  ICH = { ...(ICH || {}), person_id: "P1", name: "Hansi Test" }; $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  const vor = (m) => new Date(Date.now() - m * 60000).toISOString();
  const u = { id: "t1", betreff: "", teilnehmer: [{ person_id: "P1", name: "Hansi Test" }, { person_id: "P2", name: "Klaus Zander" }], tippt: [], entwurf: [], spricht: [], angeheftet: [],
    nachrichten: [1, 2, 3, 4].map((i) => ({ id: "m" + i, von: i % 2 ? "Klaus Zander" : "Hansi Test", vonId: i % 2 ? "P2" : "P1", eigen: !(i % 2), zeit: vor(40 - i), text: "Nachricht " + i, anlagen: [], reaktionen: [], gelesenVon: [] })) };
  api = async (a) => (a === "unterhaltung" ? u : {});
  try { chatOeffnen("t1"); } catch {} await warte(1200);
  const sichtbar = () => [...document.querySelectorAll("#chat .blase")].filter((b) => getComputedStyle(b).display !== "none" && getComputedStyle(b.closest("#chat > *") || b).opacity !== "0").length;
  e.ansicht = aktuelleAnsicht; e.alle = sichtbar();
  for (let i = 0; i < 4; i++) { chatFilterWeiter(); await warte(450); e.schritte.push({ stand: CHAT_FILTER_STAND, knopf: $("chatFilterKnopf").textContent, sichtbar: sichtbar(), hinweis: $("chatFilterHinweis").textContent, root: document.documentElement.classList.contains("chat-nur-hg") }); if (i === 2) window.__hg = true; }
  chatFilterSetzen("keine", true); zeige("nachrichten"); await warte(100); e.wegNachVerlassen = CHAT_FILTER_STAND === "alle" && !document.documentElement.classList.contains("chat-nur-hg");
  return e;
});
console.log(JSON.stringify(r, null, 1));
ok(r.ansicht === "chat" && r.alle === 4, "Chat mit 4 Nachrichten offen");
const [a, m, k, z] = r.schritte;
ok(a.stand === "andere" && a.sichtbar === 2 && m.stand === "meine" && m.sichtbar === 2, "1× nur die anderen, 2× nur meine (wie bisher)");
ok(k.stand === "keine" && k.knopf === "🖼️" && k.sichtbar === 0 && k.root && /Nachrichten ausgeblendet/.test(k.hinweis), "3× 🖼️ nur Hintergrund: keine Nachricht sichtbar, Hinweis oben");
ok(z.stand === "alle" && z.sichtbar === 4 && !z.root && z.knopf === "👥", "4× wieder alle");
ok(r.wegNachVerlassen, "Chat verlassen → nichts bleibt ausgeblendet");
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? ": " + fehler.join(" | ") : ""));
if (process.env.HG_BILD) { await seite.evaluate(async () => { zeige("chat"); chatFilterSetzen("alle", true); }); await seite.waitForTimeout(300); await bild("1-alle"); await seite.evaluate(() => chatFilterSetzen("keine", true)); await seite.waitForTimeout(600); await bild("2-nur-hg"); }
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
