// 3.33.0 KC-CLUB-HILFE-3330: alle Erklär-Videos (RUNDGAENGE) Schritt für Schritt im echten app.js – Browser abgeschirmt, nur erfundene Testdaten.
// Meldet je Video: still übersprungene Stationen (Pflicht-Ziel nicht sichtbar), Pflicht-Ziele nicht sichtbar, Programmfehler und Server-Aufrufe, die etwas ändern würden.
// So fällt auf, wenn eine Station nach einem Umbau ihr Ziel verloren hat (sie würde sonst still übersprungen).
// 26.11.2026: echter App-Start mit nachgebautem Club-Server und den Beispieldaten der Erklärfilme (tools/film/gemeinsam.mjs, „Hans Test“ …) plus
// Beispielen für Gruppen, Geburtstag, Archiv, archivierten Chat, Rätsel und SOS (VIDEO_DATEN unten) – nie echte Mitgliederdaten.
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/alle-videos-browser.mjs [video-id …]
//   DIAGNOSE=1 (Grund bei fehlendem Pflicht-Ziel) · BREITE=360 (Standard 400) · SCHRITT_MS=1200 (Wartezeit je Station, Standard 450) · STAPEL=1 (Fehler mit Aufrufstapel) · BERICHT=datei.json
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
import { antworten, aufraeumen } from "../film/gemeinsam.mjs";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg", ".png": "image/png", ".webp": "image/webp", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(f.startsWith(wurzel) && fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8797);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const ctx = await browser.newContext({ viewport: { width: Number(process.env.BREITE || 400), height: 800 }, serviceWorkers: "block", locale: "de-DE", timezoneId: "Europe/Berlin" });
const seite = await ctx.newPage(); const fehler = []; seite.on("pageerror", (e) => fehler.push(process.env.STAPEL ? String(e.stack).slice(0, 600) : String(e)));
// ---------- erfundene Zusatzdaten für Stationen, die etwas zum Zeigen brauchen ----------
const heute = new Date(), mmtt = `${String(heute.getMonth() + 1).padStart(2, "0")}-${String(heute.getDate()).padStart(2, "0")}`;
const basis = antworten({ einstellungen: { sende_effekt: { art: "wechsel" } } }); // sonst gleicht die App den Sende-Effekt beim Start mit dem Server ab (keine Video-Sache)
const gestern = new Date(Date.now() - 86400000).toISOString().slice(0, 10), jahr = new Date().getFullYear();
const VIDEO_DATEN = {
  // „zuletzt da“ wie vom echten Server: online, sonst Tag (die Film-Daten haben dort nur { online: false })
  mitglieder: { ...basis.mitglieder, mitglieder: basis.mitglieder.mitglieder.map((m) => ({ ...m, zuletztDa: m.zuletztDa?.online ? m.zuletztDa : { tag: gestern } })) },
  sos_kontakte: { siehtNotfall: false, mitglieder: [{ id: "P1", name: "Hans Test", selbst: true, notfall: false, kontakt: {} }, { id: "P2", name: "Erika Beispiel", kontakt: { handy: "0151 0000000" }, aemter: [] }, { id: "P3", name: "Paul Probe", kontakt: {}, aemter: [] }] },
  archiv_liste: { darf: false, vorstand: false, ich: "P1", arten: {}, papierkorbTage: 30, speicher: { belegt: 0, grenze: 1 }, register: [], freigabeMaxTage: 30, personen: [], gruppen: [], dokumente: [], alben: [], persoenlich: [],
    ordner: [{ id: "O1", titel: "Hans Test", jahr, eigen: true, farbe: 1, register: ["Rezepte", "Sonstiges"] }, { id: "O2", titel: "Clubchronik", jahr, art: "chronik", farbe: 2, register: [String(jahr - 1), String(jahr)] },
      { id: "O3", titel: "Sitzungsprotokolle", jahr, art: "protokolle", farbe: 3, register: ["Sitzungen"] }],
    auto: [{ id: "A1", art: "treffen", titel: "Clubabend", datum: `${jahr}-11-20`, text: "Beispiel-Termin" }, { id: "A2", art: "protokoll", titel: "Clubsitzung", datum: `${jahr}-11-03`, text: "Beispiel-Protokoll" }] },
  unterhaltungen: { unterhaltungen: [...basis.unterhaltungen.unterhaltungen, { id: "C4", betreff: "", teilnehmer: ["Rita Sommer"], anzahl: 2, gruppe: null, archiviert: true, letzte: { von: "Rita", text: "Bis bald!", zeit: new Date(Date.now() - 864e6).toISOString() }, ungelesen: 0, wichtigNeu: 0, aktualisiert: new Date(Date.now() - 864e6).toISOString() }] },
  raetsel_stand: { woche: `${jahr}-W48`, woche_liste: [{ name: "Erika Beispiel", punkte: 120, richtig: 8 }], gesamt: [{ name: "Erika Beispiel", punkte: 480, wochen: 4 }], motive: [] },
};
const antw = { ...basis, ...VIDEO_DATEN };
const aufrufe = []; // alle Club-Server-Aufrufe (nur Name und Inhalt der Anfrage – Testdaten)
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close()); // keine direkte Leitung
await seite.route("**/functions/v1/**", async (r) => { // Club-Server nachgebaut: Antworten aus den Testdaten, nie der echte Server
  let a = "", q = {}; try { q = JSON.parse(r.request().postData() || "{}"); a = q.action; } catch {}
  aufrufe.push({ a, p: q }); if (process.env.AUFRUFE) console.log("  → " + a);
  const body = typeof antw[a] === "function" ? antw[a](q) : antw[a] ?? { ok: true };
  await r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" }, body: JSON.stringify(body) });
});
await seite.route("**/notbetrieb.json*", (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"modus":"aus","url":""}' }));
await seite.addInitScript(() => { try { localStorage.setItem("kc_club_key", "a".repeat(32)); localStorage.setItem("kc_club_begruesst_P1", "1"); localStorage.setItem("kc_club_version_gesehen", "9.9.9");
  sessionStorage.setItem("kc_buero_gefragt", "1"); sessionStorage.setItem("kc_club_start_gemeldet", "1"); localStorage.setItem("kc_club_kuckuck", "0"); } catch {} try { speechSynthesis.speak = () => {}; } catch {} });
await seite.goto("http://localhost:8797/index.html"); await seite.waitForTimeout(3500);
await aufraeumen(seite);
if (process.env.DIAGNOSE) await seite.evaluate(() => { window.__diag = true; });
await seite.evaluate(() => teilLaden("videos")); await seite.evaluate(() => teilLaden("hilfe"));
console.log("Start:", JSON.stringify(await seite.evaluate(() => ({ ich: ICH?.name, ansicht: ANSICHT, kacheln: document.querySelectorAll("#raster .kachel").length }))));
const AENDERT = (x) => /senden|speichern|setzen|merken|loeschen|hochladen|anlegen|melden/.test(x.a) && !/gesehen|nutzung|spur|start_melden|lebenszeichen/.test(x.a) && !(x.a === "einstellung_setzen" && x.p?.schluessel === "rundgang"); // erlaubt: Start-Messung, Wege, „Rundgang angesehen“
const ids = process.argv.slice(2).length ? process.argv.slice(2) : await seite.evaluate(() => RUNDGAENGE.filter((r) => !r.nur || r.nur()).map((r) => r.id));
let rot = 0; const bericht = [];
for (const id of ids) {
  const vorher = fehler.length, apiVorher = aufrufe.length;
  const r = await seite.evaluate(async ({ id, schritt }) => {
    const warte = (t) => new Promise((x) => setTimeout(x, t)), los = (q) => (typeof q === "function" ? q() : document.querySelector(q));
    try { SCHLAF.bedient = Date.now(); } catch {} // ein Prüflauf über alle Videos dauert > 15 Min. ohne Antippen – sonst schläft die App ein (KC-CLUB-SCHLAFMODUS) und lädt mit Testdaten neu
    const schritte = []; try { rundgangStart(false, id); } catch (e) { return { fehler: String(e), schritte }; } await warte(600);
    const fertig = async () => { for (let k = 0; k < 40 && RG.an && RG.tippLaeuft; k++) await warte(100); }; // Tipp-Animation (tippVor) erst abwarten – vorher ist die Station noch nicht aufgebaut
    await fertig(); let vorI = RG.i; const weg = [];
    for (let n = 0; n < 120 && RG.an; n++) {
      const s = RG.st[RG.i]; const ziele = (s.sel || []).map((q) => { try { return los(q); } catch { return null; } });
      const sichtbar = ziele.some((z) => z && rgSichtbar(z));
      let grund = ""; // DIAGNOSE=1: warum fehlt ein Pflicht-Ziel? (fehlt / versteckt / Größe 0 / erscheint erst später)
      if (window.__diag && s.mussSel && !sichtbar) {
        grund = (s.sel || []).map((q, k) => { const z = ziele[k]; if (!z) return `${typeof q === "string" ? q : "fn"}: fehlt`;
          const r = z.getBoundingClientRect(), v = z.closest(".versteckt"); return `${typeof q === "string" ? q : "fn"}: da, ${v ? "in .versteckt (" + (v.id || v.className).slice(0, 40) + ")" : ""} ${Math.round(r.width)}×${Math.round(r.height)} @${Math.round(r.x)},${Math.round(r.y)} ${getComputedStyle(z).display}/${getComputedStyle(z).visibility}`; }).join(" ; ");
        await warte(1500); const spaet = (s.sel || []).map((q) => { try { return los(q); } catch { return null; } }).some((z) => z && rgSichtbar(z)); grund += spaet ? " → nach 1,5 s sichtbar" : " → auch nach 1,5 s nicht";
      }
      schritte.push({ t: s.t, mitZiel: !!(s.sel || []).length, sichtbar, muss: !!s.mussSel, grund });
      if (RG.i >= RG.st.length - 1) break;
      rundgangSchritt(1); await warte(schritt); await fertig();
      for (let k = vorI + 1; k < RG.i; k++) { const x = RG.st[k]; if (x && (!x.nur || x.nur())) weg.push(x.t); } // still übersprungen (Pflicht-Ziel nicht sichtbar)
      vorI = RG.i;
    }
    try { rundgangEnde(true); } catch {} await warte(400);
    return { schritte, weg };
  }, { id, schritt: Number(process.env.SCHRITT_MS || 450) });
  const muss = (r.schritte || []).filter((s) => s.muss && !s.sichtbar).map((s) => s.t + (s.grund ? ` [${s.grund}]` : "")), ohne = (r.schritte || []).filter((s) => s.mitZiel && !s.muss && !s.sichtbar).map((s) => s.t);
  const neuF = fehler.slice(vorher);
  const geaendert = aufrufe.slice(apiVorher).filter(AENDERT).map((x) => x.a);
  if (process.env.STAPEL && geaendert.length) console.log(id, JSON.stringify(aufrufe.slice(apiVorher).filter(AENDERT)).slice(0, 600));
  if (geaendert.length) neuF.push("Server-Aufruf, der etwas ändert: " + [...new Set(geaendert)].join(", "));
  const weg = r.weg || [];
  if (r.fehler || muss.length || neuF.length || weg.length) rot++;
  bericht.push({ id, schritte: (r.schritte || []).length, weg, muss, ohne, fehler: [r.fehler, ...neuF].filter(Boolean) });
  console.log(`${r.fehler || muss.length || neuF.length || weg.length ? "ROT " : "ok  "} ${id.padEnd(14)} ${String((r.schritte || []).length).padStart(3)} Stationen` + (weg.length ? ` · übersprungen: ${weg.join(" | ")}` : "") + (muss.length ? ` · Pflicht-Ziel fehlt: ${muss.join(" | ")}` : "") + (ohne.length ? ` · ohne sichtbares Ziel: ${ohne.join(" | ")}` : "") + (r.fehler || neuF.length ? ` · Fehler: ${[r.fehler, ...neuF].filter(Boolean).join(" | ")}` : ""));
}
const nach = { sim: await seite.evaluate(() => !!$("rgSim")), senden: aufrufe.filter(AENDERT).map((x) => x.a) };
if (nach.sim || nach.senden.length) { rot++; console.log("ROT nach allen Videos:", JSON.stringify(nach)); if (process.env.STAPEL) console.log(JSON.stringify(aufrufe.filter(AENDERT)).slice(0, 800)); } else console.log("ok   nach allen Videos: kein Beispielbild offen, nichts gesendet oder gespeichert");
fs.writeFileSync(process.env.BERICHT || "/dev/null", JSON.stringify(bericht, null, 1));
await browser.close(); srv.close();
console.log(rot ? `${rot} × ROT` : "ALLE VIDEOS GRÜN"); process.exit(rot ? 1 : 0);
