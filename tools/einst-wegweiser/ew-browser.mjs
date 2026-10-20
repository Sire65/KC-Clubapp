// 2.534.0 KC-CLUB-EINST-WEGWEISER: Browser-Test des echten app.js (Chromium über playwright-core) – „🧭 Einstellungen erklärt“.
// Baum aus der Seite ⚙️ (erweitert/einfach, Admin nur für den Admin), Erklärung, Suche, Hinbringen, Schriftstück – und nichts wird umgestellt.
// Start: PW_CORE=… PW_CHROME=… node tools/einst-wegweiser/ew-browser.mjs  (Bilder: EW_BILD=<Ordner>)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8797);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 400, height: 820 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8797/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const bild = async (n) => { if (process.env.EW_BILD) await seite.screenshot({ path: path.join(process.env.EW_BILD, n + ".png") }); };
await seite.evaluate(() => {
  ICH = { ...(ICH || {}), person_id: "P1", name: "Hansi Test", admin: false }; window.__api = []; api = async (a, p) => { __api.push(a); return {}; };
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt"); ANSICHT = "erweitert"; document.body.classList.remove("einfach");
  window.__stand = () => [...document.querySelectorAll("#v-einstellungen input, #v-einstellungen select")].map((x) => x.type === "checkbox" ? x.checked : x.value).join("|");
});
const r = await seite.evaluate(async () => {
  const warte = (t) => new Promise((x) => setTimeout(x, t)), e = {};
  e.kachel = !!KACHELN.programme.find((k) => k.id === "einstwegweiser" && k.aktion === "ewStart()");
  ewStart(); await warte(300); const vorher = __stand();
  e.n = EW.liste.length; e.ordner = EW.baum.ordner.map((o) => o.name + " (" + ewZahl(o) + ")");
  e.adminDa = EW.baum.ordner.some((o) => /Admin/.test(o.name)); e.einfachDa = EW.baum.ordner.some((o) => /Das Wichtigste/.test(o.name));
  e.ohneName = EW.liste.filter((x) => x.name.length < 3).length; e.ohneHinweis = EW.liste.filter((x) => !x.hinweis).map((x) => x.name);
  e.blatt = !!$("ewBlatt") && document.querySelectorAll("#ewBaum > details.ew-ordner").length === EW.baum.ordner.length;
  // Farbe-Eintrag erklären
  document.querySelector("#ewBaum details")?.setAttribute("open", "");
  const tt = EW.liste.find((x) => x.id === "setTon") || EW.liste.find((x) => x.st?.type === "checkbox");
  e.tt = tt?.name; [...document.querySelectorAll("#ewBaum details")].forEach((d) => (d.open = true)); ewErklaeren(tt.i); await warte(100);
  const z = $("ewErkl" + tt.i); e.erkl = !z.classList.contains("versteckt") && /Was bewirkt das\?/.test(z.textContent) && /Hinbringen/.test(z.textContent) && /📍/.test(z.textContent); e.erklText = z.textContent.replace(/\s+/g, " ").slice(0, 300);
  e.mitHilfe = EW.liste.filter((x) => ewHilfe(x)).length; e.mitVideo = EW.liste.filter((x) => ewVideo(x)).length;
  // Suche
  ewSuchen("farbe"); e.sucheFarbe = document.querySelectorAll("#ewBaum .ew-eintrag").length; ewSuchen("pussh"); e.sucheTippfehler = document.querySelectorAll("#ewBaum .ew-eintrag").length; ewSuchen("");
  e.zurueck = document.querySelectorAll("#ewBaum > details.ew-ordner").length === EW.baum.ordner.length;
  // Schriftstück
  const d = ewDruck(); e.druck = d.titel === "Einstellungen erklärt" && (d.html.match(/<tr>/g) || []).length === EW.liste.length && !!DRUCKARTEN.einstwegweiser;
  e.unveraendert = __stand() === vorher;
  e.api = [...new Set(__api)];
  return e;
});
console.log(JSON.stringify({ ...r, ohneHinweis: r.ohneHinweis.length + ": " + r.ohneHinweis.join(" · ") }, null, 1));
if (process.env.EW_LISTE) console.log(await seite.evaluate(() => EW.liste.map((x) => x.pfad.join(" › ") + " | " + x.name + " | " + x.hinweis.slice(0, 70) + " | " + (x.id || "")).join("\n")));
await bild("1-baum");
ok(r.kachel, "Kachel „🧭 Einstellungen erklärt“ unter Technik");
ok(r.n >= 80 && r.blatt && r.ohneName === 0, `Explorer-Baum mit ${r.n} Einstellungen in ${r.ordner.length} Bereichen`);
ok(!r.adminDa && !r.einfachDa, "erweiterte Ansicht: kein Admin-Bereich für Mitglieder, kein „Das Wichtigste“ (gehört zur einfachen Ansicht)");
ok(r.erkl, "Antippen erklärt: Was bewirkt das? · Ort · 👉 Hinbringen (" + r.tt + ")");
ok(r.mitHilfe >= 15 && r.mitVideo >= 40, `${r.mitHilfe} Einträge mit ausführlichem Hilfe-Text, ${r.mitVideo} mit Erklär-Video`);
ok(r.sucheFarbe >= 2 && r.sucheTippfehler >= 1 && r.zurueck, "Suche (auch mit Tippfehler) und zurück zum Baum");
ok(r.druck, "Als Schriftstück: jede Einstellung eine Zeile");
ok(r.unveraendert, "der Wegweiser stellt nichts um");
ok(r.api.every((a) => a === "eltern_meine"), "keine Datenbank-Abfrage außer der von ⚙️ selbst (" + r.api.join(",") + ")");
await seite.evaluate(async () => { const tt = EW.liste.find((x) => x.id === "setTon") || EW.liste[5]; ewErklaeren(tt.i); });
await seite.waitForTimeout(400); await bild("2-erklaerung");
const h = await seite.evaluate(async () => { const tt = EW.liste.find((x) => x.id === "setTon") || EW.liste.find((x) => x.st?.type === "checkbox"); ewHin(tt.i); await new Promise((x) => setTimeout(x, 700));
  return { blattZu: !$("ewBlatt"), ansicht: aktuelleAnsicht, hervor: tt.el.classList.contains("hervor"), offen: !tt.el.closest("details") || tt.el.closest("details").open }; });
await bild("3-hinbringen");
ok(h.blattZu && h.ansicht === "einstellungen" && h.hervor && h.offen, "👉 Hinbringen: ⚙️ offen, Bereich aufgeklappt, Schalter leuchtet");
const a = await seite.evaluate(async () => { ICH.admin = true; EW.gefuellt = false; ewStart(); const admin = EW.baum.ordner.some((o) => /Admin/.test(o.name)); fensterZu($("ewBlatt"));
  ICH.admin = false; $("adminBereich").classList.add("versteckt"); ANSICHT = "einfach"; document.body.classList.add("einfach"); ewStart(); const n = EW.liste.length, wichtig = EW.baum.ordner.some((o) => /Das Wichtigste/.test(o.name)), effekte = EW.baum.ordner.some((o) => /Effekte/.test(o.name));
  fensterZu($("ewBlatt")); ANSICHT = "erweitert"; document.body.classList.remove("einfach"); return { admin, n, wichtig, effekte }; });
ok(a.admin, "Admin sieht seinen Admin-Bereich");
ok(a.wichtig && !a.effekte && a.n < r.n, `einfache Ansicht: nur ihre ${a.n} Einstellungen („Das Wichtigste“, ohne Effekte)`);
const f = await seite.evaluate(() => { SU.q = "einstellungen erklärt"; SU.genau = false;
  return { sb: sbErkennen("Einstellungen erklärt"), lupe: suAppTreffer().slice(0, 2).map((x) => x.t), tw: twFinden("Was bewirken die ganzen Einstellungen?").slice(0, 3).map((x) => x.e?.id || x.id), hilfe: hzEintraege().some((h) => h.id === "h:einst_wegweiser") }; });
ok(f.sb?.art === "wegweiser", "Sprache: „Einstellungen erklärt“ öffnet den Wegweiser");
ok(/Einstellungen erklärt/.test(f.lupe.join()) && f.tw.includes("f:einstellungen-erklaert") && f.hilfe, "Lupe, Twinkey und Hilfe-Zentrum kennen den Wegweiser");
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
