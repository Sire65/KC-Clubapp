// 2.529.0 KC-CLUB-VN-RUECKFRAGE + KC-CLUB-SCHREIBT-HINWEIS: Browser-Test des echten app.js (Chromium über playwright-core).
// Schloss: „Normal senden“ sendet unverschlüsselt und schaltet aus; Chatwechsel schaltet aus. Hinweis „… schreibt dir gerade …“ außerhalb des Chats.
// Start: PW_CORE=… PW_CHROME=… node tools/chat-sparsam/schreibt-hinweis-browser.mjs
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8791);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8791/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const r = await seite.evaluate(async () => {
  const e = {}, warte = (ms) => new Promise((x) => setTimeout(x, ms));
  ICH = { ...(ICH || {}), person_id: "P1" }; window.__api = []; api = async (a, p) => { __api.push({ a, p }); if (a === "unterhaltungen") return { unterhaltungen: UH_TEST }; return { ok: true }; };
  window.UH_TEST = [{ id: "t-klaus", teilnehmer: ["Klaus Zander"], gruppe: null }, { id: "t-grill", teilnehmer: ["Klaus Zander", "Dieter Zander"], gruppe: { name: "Grillteam" } }];
  // ---- Schloss ----
  chatId = "t-klaus"; vbPartner = () => null; let frageText = ""; frage = async (t, o) => { frageText = t + "|" + o?.ja + "|" + o?.nein; return false; };
  vnUmschalten(true); const v = await vnVerschluesseln("Hallo Klaus");
  e.normal = v === "Hallo Klaus" && VN.an === false && /Normal senden/.test(frageText);
  let gefragt = false; frage = async () => true; eingabe = async () => { gefragt = true; return null; };
  vnUmschalten(true); e.mitSchluesselFragt = (await vnVerschluesseln("Geheim")) === null && gefragt;
  vnUmschalten(true); VN.chat = "t-klaus"; chatId = "t-anders";
  const alt = api; api = async (a) => (a === "unterhaltung" ? { id: "t-anders", teilnehmer: [{ person_id: "P1", name: "Ich" }, { person_id: "P2", name: "Klaus Zander" }], nachrichten: [], tippt: [] } : { ok: true });
  try { await chatLaden(false); } catch {} e.chatwechselAus = VN.an === false; api = alt;
  // ---- Hinweis außerhalb des Chats ----
  UH.liste = UH_TEST.slice(); chatId = null; aktuelleAnsicht = "start";
  rtSignal({ art: "tippt", thread: "t-klaus" }); await warte(600);
  e.schreibt = $("schreibtHinweis")?.textContent || "";
  rtSignal({ art: "diktiert", thread: "t-klaus" }); rtSignal({ art: "tippt", thread: "t-klaus" }); await warte(600);
  e.diktiert = $("schreibtHinweis")?.textContent || "";
  rtSignal({ art: "chat", thread: "t-klaus" }); e.wegNachNachricht = !$("schreibtHinweis");
  rtSignal({ art: "tippt", thread: "t-grill" }); await warte(600); e.gruppeOhne = !$("schreibtHinweis");
  chatId = "t-klaus"; aktuelleAnsicht = "chat"; chatLaden = async () => {}; rtSignal({ art: "tippt", thread: "t-klaus" }); await warte(600); e.imChatOhne = !$("schreibtHinweis");
  chatId = null; aktuelleAnsicht = "start"; let geoeffnet = null; chatOeffnen = (id) => { geoeffnet = id; };
  rtSignal({ art: "spricht", thread: "t-klaus" }); await warte(100); e.spricht = $("schreibtHinweis")?.textContent || ""; $("schreibtHinweis")?.click(); e.oeffnet = geoeffnet === "t-klaus" && !$("schreibtHinweis");
  UH.liste = []; rtSignal({ art: "tippt", thread: "t-klaus" }); await warte(700); e.listeNachgeholt = __api.some((x) => x.a === "unterhaltungen") && /Klaus/.test($("schreibtHinweis")?.textContent || "");
  // ---- Diktat meldet „diktiert“ ----
  __api.length = 0; chatId = "t-klaus"; ONL.zeigen = true; TIPP = { zuletzt: 0, id: null, nach: null }; DT.aktiv = true; DT.ziel = "text"; $("text").value = "";
  tippenMelden(); await warte(50); e.diktatGemeldet = __api.some((x) => x.a === "tippen" && x.p.diktat === true && !("text" in x.p)); DT.aktiv = false;
  return e;
});
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? ": " + fehler[0] : ""));
ok(r.normal, "Schloss an, kein Schlüsselbund → Rückfrage; „✉️ Normal senden“ sendet unverschlüsselt und schaltet das Schloss aus");
ok(r.mitSchluesselFragt, "„🔒 Ja, mit Schlüssel“ fragt wie bisher den Schlüssel (Abbrechen = nicht senden)");
ok(r.chatwechselAus, "Schloss geht beim Wechsel in einen anderen Chat aus");
ok(/Klaus/.test(r.schreibt) && /schreibt dir gerade/.test(r.schreibt), "außerhalb des Chats: „✍️ Klaus schreibt dir gerade …“ (" + r.schreibt.trim() + ")");
ok(/diktiert dir gerade eine Nachricht/.test(r.diktiert), "beim Diktieren: „🗣️ Klaus diktiert dir gerade eine Nachricht …“ (auch wenn „tippt“ gleich hinterherkommt)");
ok(r.wegNachNachricht, "Nachricht kommt an → Hinweis weg");
ok(r.gruppeOhne && r.imChatOhne, "kein Hinweis für Gruppen und nicht, wenn der Chat schon offen ist");
ok(/Sprachnachricht/.test(r.spricht) && r.oeffnet, "Sprachnachricht-Hinweis; Antippen öffnet den Chat");
ok(r.listeNachgeholt, "Chatliste noch nicht geladen → einmal holen, dann Name");
ok(r.diktatGemeldet, "Diktat meldet „diktat“ (ohne Text) statt „schreibt“");
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
