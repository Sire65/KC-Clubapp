// KC-CLUB-RUNDGANG (2.725.0, Prüfbericht Etappe 5, Wunsch #44): automatischer Klick-Rundgang im echten Browser.
// Öffnet die App mit Testdaten (kein echter Server, keine echten Daten), angemeldet als Test-Admin, und ruft am Handy (erweiterte und einfache
// Ansicht) und am PC die wichtigsten Seiten auf – auch über die Leiste unten per echtem Antippen. Rot, wenn dabei
//   • ein Programmfehler auftritt (auch abgefangene, die das Mitglied als „Da hat etwas nicht geklappt“ sähe),
//   • das Schutzschild (Content-Security-Policy) etwas sperrt,
//   • eine Seite nicht erscheint oder seitlich über den Rand ragt.
// Braucht Playwright mit Chromium (in GitHub Actions kostenlos; lokal: vorinstalliert). Läuft eigenständig: node tests/rundgang.browser.mjs
// Neue Seite oder neue Server-Antwort, die beim Öffnen gebraucht wird? Unten bei SEITEN bzw. ANTWORTEN ergänzen.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const heute = new Date().toISOString().slice(0, 10);

const INIT = { ok: true, ich: { person_id: "KC-P-TEST-RUNDGANG", vorname: "Test", name: "Test Rundgang", admin: true, vorstand: true, aemter: ["Admin"], rollen: [] },
  einstellungen: { begruessung: { gesehen: true }, unterstuetzung: "normal", einweisung: { an: false, gesehen: {} }, spiel_einladung: { an: false }, ansicht: { art: "erweitert", gewaehlt: true } },
  mitglieder: [], treffen: [], chats: [], pinnwand: [], termine: [], zaehler: {}, kacheln: null };
// Leere, aber vollständige Antworten – so wie der Server sie ohne Inhalte liefert
const ANTWORTEN = {
  treffen_liste: { treffen: [], geburtstage: [] }, unterhaltungen: { unterhaltungen: [] },
  terminumfragen_liste: { umfragen: [] }, terminanfragen_liste: { anfragen: [] }, privattermine_liste: { privat: [] }, schulung_meine: { einladungen: [], unvollstaendig: [] },
  erstattung_meine: { kmSatz: 0.3, standard: 0.3, saetze: [], gruende: [], arten: [], antraege: [] }, eltern_meine: { eltern: [] },
  wetter_konfig: { quellen: [], apps: [], app: null, quelle: null, ort: { name: "Werne", region: "NRW" } }, aktionen_liste: { aktionen: [], stand: null },
  fotos_liste: { fotos: [], themen: [], jahre: [], anlaesse: [], speicher: { prozent: 0, belegt: 0, grenze: 1 }, papierkorb: 0, alben: [], albenKorb: 0, album: null },
  vorschlaege_liste: { vorschlaege: [], treffen: [], spenden: { empfaenger: [], betraege: [], max: 0 } },
  protokolle_liste: { darfOrganisieren: true, protokolle: [], aufgaben: [], treffenOhneProtokoll: [] },
  archiv_liste: { darf: true, vorstand: true, ich: "KC-P-TEST-RUNDGANG", arten: [], papierkorbTage: 30, speicher: { belegt: 0, grenze: 1 }, register: [], freigabeMaxTage: 30, personen: [], gruppen: [], ordner: [], dokumente: [], auto: [], alben: [], persoenlich: [] },
  hilfe_liste: { aufrufe: [], angebote: [], angebotSymbole: [], arten: [], zeitfenster: [], orte: [] },
  dienste: { von: heute, bis: heute, freigabe: true, personen: [], gewaehlt: [], dienste: [], stand: null, wuensche: [], wunschTage: null, wunschPersonen: [], wunschStand: null },
  feedback_meins: { bogen: 1, fragen: [], umgesetzt: [], antwort: null },
  mitglieder: { aemter: [], onlineSichtbar: true, mitglieder: [] },
};
const SEITEN = ["termine", "nachrichten", "mitglieder", "einstellungen", "fotos", "pinnwand", "vorschlaege", "dokumente", "archiv", "protokolle", "spiele", "buero",
  "hilfezentrum", "aktionen", "dienste", "erstattung", "helfen", "feedback", "sos", "sicherheit", "programme", "start"];
const GERAETE = [
  { name: "Handy", w: 390, h: 844, touch: true, ansicht: "erweitert", seiten: SEITEN },
  { name: "Handy einfach", w: 360, h: 780, touch: true, ansicht: "einfach", seiten: ["termine", "nachrichten", "mitglieder", "einstellungen", "start"] },
  { name: "PC", w: 1366, h: 900, touch: false, ansicht: "erweitert", seiten: ["termine", "nachrichten", "einstellungen", "buero", "start"] },
];

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".mp3": "audio/mpeg", ".wasm": "application/wasm", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const p = path.normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const datei = path.join(WURZEL, p || "index.html");
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(datei)] || "application/octet-stream" }); fs.createReadStream(datei).pipe(res);
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const BASIS = `http://127.0.0.1:${server.address().port}`;

const fehler = [];
const browser = await chromium.launch();
try {
  for (const g of GERAETE) {
    const ctx = await browser.newContext({ viewport: { width: g.w, height: g.h }, hasTouch: g.touch, isMobile: g.touch, serviceWorkers: "block", locale: "de-DE", timezoneId: "Europe/Berlin",
      // kein „HeadlessChrome“: sonst schreibt das Fehlerprotokoll (absichtlich) nichts mit
      userAgent: g.touch ? "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36"
        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" });
    const seite = await ctx.newPage(), melde = (t) => fehler.push(`[${g.name}] ${t}`);
    seite.on("pageerror", (e) => melde("Programmfehler: " + String(e.message || e).slice(0, 200)));
    await seite.route("**/*", (r) => {
      const u = new URL(r.request().url());
      if (u.origin === BASIS || u.protocol === "data:" || u.protocol === "blob:") return r.continue();
      if (/\/functions\/v1\/kc-club$/.test(u.pathname)) {
        let a = ""; try { a = JSON.parse(r.request().postData() || "{}").action; } catch {}
        const init = { ...INIT, einstellungen: { ...INIT.einstellungen, ansicht: { art: g.ansicht, gewaehlt: true } } };
        return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(a === "init" ? init : ANTWORTEN[a] ?? { ok: true }) });
      }
      if (/\/functions\/v1\//.test(u.pathname)) return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: "{}" });
      return r.abort(); // nichts nach draußen
    });
    await seite.goto(`${BASIS}/index.html?k=0123456789abcdef0123456789abcdef`);
    await seite.waitForFunction(() => typeof ICH !== "undefined" && !!ICH, null, { timeout: 30000 }).catch(() => melde("Start: nicht angemeldet"));
    await seite.waitForTimeout(2500);
    for (let i = 0; i < 3; i++) { const zu = await seite.$("button.blatt-x"); if (!zu || !(await zu.isVisible())) break; await zu.click().catch(() => {}); await seite.waitForTimeout(400); } // Begrüßungsfenster
    const hallo = await seite.textContent("#begruessung").catch(() => "");
    if (!/Hallo Test/.test(hallo || "")) melde(`Start: Begrüßung fehlt („${hallo}“)`);
    for (const v of g.seiten) {
      await seite.evaluate((v) => zeige(v), v).catch((e) => melde(`${v}: zeige() – ${String(e).slice(0, 120)}`));
      await seite.waitForTimeout(900);
      const r = await seite.evaluate((v) => { const el = document.getElementById("v-" + v), s = el && getComputedStyle(el);
        return { da: !!el && s.display !== "none" && el.getBoundingClientRect().height > 0, quer: document.documentElement.scrollWidth > innerWidth + 2 }; }, v);
      if (!r.da) melde(`${v}: Seite erscheint nicht`);
      if (r.quer) melde(`${v}: ragt seitlich über den Rand`);
    }
    if (g.touch) for (const b of await seite.$$(".fuss-leiste button")) { await b.click().catch((e) => melde("Leiste unten: " + String(e).slice(0, 100))); await seite.waitForTimeout(700); }
    const fp = await seite.evaluate(() => (window.KCFP?.lies() || []).filter((e) => /^(skript|versprechen|gefangen|instabil|schutz|start_kaputt)$/.test(e.art)));
    for (const e of fp) melde(`Fehlerprotokoll „${e.art}“: ${String(e.text || "").slice(0, 160)} ${String(e.stack || "").slice(0, 160)}`);
    await ctx.close();
  }
} finally { await browser.close(); server.close(); }

if (fehler.length) { console.error("❌ Rundgang: " + fehler.length + " Fund(e)\n" + fehler.join("\n")); process.exit(1); }
console.log(`OK – Rundgang: ${GERAETE.map((g) => `${g.name} ${g.seiten.length} Seiten`).join(", ")} ohne Fehler`);
