// KC-CLUB-CHAT-STAND (2.510.0): Browser-Test des echten app.js – chatNachsehen() lädt den Chat nur ganz, wenn sich der Fingerabdruck geändert hat,
// es keinen gibt (älterer Server), die kurze Nachfrage scheitert oder das letzte volle Laden ≥ 5 Min. her ist. Start: PW_CORE=… PW_CHROME=… node tools/chat-sparsam/chat-stand-browser.mjs
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8794);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage();
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8794/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const r = await seite.evaluate(async () => {
  const e = {}; let voll = 0, kurz = 0, antwort = null;
  chatLaden = async () => { voll++; CHAT = { ...(CHAT || {}), stand: "S1" }; CHAT_VOLL_AM = Date.now(); };
  api = async (a, p) => { if (a !== "unterhaltung_stand") throw new Error("unerwartet " + a); kurz++; if (antwort instanceof Error) throw antwort; return antwort; };
  chatId = "t1"; aktuelleAnsicht = "chat";
  const fall = async (stand, ant, alterMs = 0) => { voll = 0; kurz = 0; CHAT = { stand }; CHAT_VOLL_AM = Date.now() - alterMs; antwort = ant; await chatNachsehen(); return [kurz, voll]; };
  e.gleich = await fall("S1", { stand: "S1" });
  e.anders = await fall("S1", { stand: "S2" });
  e.ohneStand = await fall(null, { stand: "S1" });
  e.serverOhne = await fall("S1", { stand: null });
  e.fehler = await fall("S1", new Error("Netz"));
  e.alt = await fall("S1", { stand: "S1" }, 5 * 60000 + 1000);
  // Chat inzwischen gewechselt → nichts laden
  voll = 0; CHAT = { stand: "S1" }; CHAT_VOLL_AM = Date.now(); api = async () => { chatId = "t2"; return { stand: "S2" }; }; chatId = "t1"; await chatNachsehen(); e.gewechselt = voll;
  return e;
});
ok(JSON.stringify(r.gleich) === "[1,0]", "Fingerabdruck gleich → 1 kurze Nachfrage, kein volles Laden");
ok(JSON.stringify(r.anders) === "[1,1]", "Fingerabdruck anders → ganz laden");
ok(JSON.stringify(r.ohneStand) === "[0,1]", "noch kein Fingerabdruck (älterer Server) → ganz laden wie bisher");
ok(JSON.stringify(r.serverOhne) === "[1,1]", "Server kann gerade keinen berechnen → ganz laden");
ok(JSON.stringify(r.fehler) === "[1,1]", "kurze Nachfrage scheitert → ganz laden");
ok(JSON.stringify(r.alt) === "[0,1]", "spätestens alle 5 Minuten ganz laden (Namen u. Ä.)");
ok(r.gewechselt === 0, "inzwischen anderer Chat offen → alte Antwort verworfen");
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
