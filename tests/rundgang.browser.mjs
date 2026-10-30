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
import { execFileSync } from "node:child_process";

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
// 2.762.0 KC-CLUB-RUNDER-TISCH: ein laufender Tisch mit 18 Plätzen (einer grau = unbekannt) – Liste, Tisch und Einladen dürfen nicht über den Rand ragen
const RT_JETZT = Date.now(), rtZeit = (m) => new Date(RT_JETZT + m * 60000).toISOString();
const RT_LEUTE = Array.from({ length: 18 }, (_, i) => ({ id: i ? "KC-P-RT" + i : "KC-P-TEST-RUNDGANG", name: i ? `Probe${i} Mitglied` : "Test Rundgang", sicher: i !== 5 }));
const RT_TISCH = { id: "11111111-2222-3333-4444-555555555555", thema: "Club-Song", beschreibung: "Probe", beginn: rtZeit(-10), ende: rtZeit(50), dauer: 60, verlaengert: 0, plaetze: 18,
  text: "Do 05.11. 20:00 Uhr · 60 Min.", phase: "offen", gastgeber: "KC-P-RT3", gastgeberName: "Probe3 Mitglied", darfLeiten: true, chat: null, imChat: true, medienWeg: false,
  meineZusage: "ja", ichSitze: true, zusagen: RT_LEUTE.slice(0, 9), amTisch: RT_LEUTE, warenDa: 0 };
const RT_LAGE = { aktiv: true, gruppen: [{ id: "66666666-2222-3333-4444-555555555555", name: "Innovation", symbol: "💡" }], regeln: { plaetzeMin: 4, plaetzeMax: 18, dauern: [30, 60, 90], vorlaufMin: 15, herzSek: 60, vorausTage: 60, themaMax: 80, beschreibungMax: 300, medienTage: 7, textTage: 30 },
  tische: [RT_TISCH, { ...RT_TISCH, id: "22222222-2222-3333-4444-555555555555", beginn: rtZeit(2880), ende: rtZeit(2940), phase: "geplant", meineZusage: null, ichSitze: false, amTisch: [], zusagen: [] },
    // 2.762.0 KC-CLUB-RUNDER-TISCH-ARTEN: laufendes Seminar (Hörsaal), Besprechung mit Tagesordnung, vorbei: Seminar mit Teilnahmebestätigung
    { ...RT_TISCH, id: "33333333-2222-3333-4444-555555555555", art: "seminar", thema: "Bilderrechner für Einsteiger", plaetze: 12, gastgeber: "KC-P-RT3", amTisch: RT_LEUTE.slice(0, 10) },
    { ...RT_TISCH, id: "44444444-2222-3333-4444-555555555555", art: "besprechung", gruppe: { id: "66666666-2222-3333-4444-555555555555", name: "Innovation", symbol: "💡" }, thema: "Weihnachtsmarkt", tagesordnung: ["Begrüßung", "Stand und Dienste", "Verschiedenes"], phase: "geplant", beginn: rtZeit(600), ende: rtZeit(660), amTisch: [] },
    { ...RT_TISCH, id: "55555555-2222-3333-4444-555555555555", art: "seminar", thema: "Kasse Schulung", phase: "vorbei", beginn: rtZeit(-3000), ende: rtZeit(-2940), amTisch: [],
      bestaetigung: { von: rtZeit(-3000), bis: rtZeit(-2940), min: 60 } }] };
Object.assign(ANTWORTEN, { tisch_liste: RT_LAGE, tisch_platz: { ok: true, ergebnis: "da", lage: RT_LAGE },
  tisch_tasche: { tisch: "11111111-2222-3333-4444-555555555555", darfVorab: true, max: 20, // 2.772.0 KC-CLUB-TISCH-TASCHE
    meine: [{ id: "t1", a: "77777777-2222-3333-4444-555555555555", name: "Ablauf.pdf", mime: "application/pdf", art: "pdf", pos: 1, vorab: true, gezeigt: false },
      { id: "t2", a: "88888888-2222-3333-4444-555555555555", name: "Club-Song.mp3", mime: "audio/mpeg", art: "musik", pos: 2, vorab: false, gezeigt: false }],
    vorab: [{ id: "t3", a: "99999999-2222-3333-4444-555555555555", name: "Rezept.pdf", mime: "application/pdf", art: "pdf", pos: 1, vorab: true, gezeigt: false, vonName: "Probe3 Mitglied" }] },
  tisch_zeit_pruefen: { ok: true, frei: false, sperre: ["Um diese Zeit ist Clubabend („Clubabend“, 19:00–22:00 Uhr, 12 haben zugesagt) – dann bitte keinen Tisch."], hinweis: [],
    tag: [{ sym: "🍽️", text: "19:00 Clubabend „Clubabend“ · 12 Zusagen" }] } }); // 2.764.0 KC-CLUB-RUNDER-TISCH-ZEITCHECK
INIT.runderTisch = { tische: [{ id: RT_TISCH.id, thema: RT_TISCH.thema, beginn: RT_TISCH.beginn, ende: RT_TISCH.ende, zusage: "ja" }] };
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
// 2.766.0 KC-CLUB-SCHILDER-DRUCKPAKET: ein gespeichertes Druckpaket (Vorlage 2×, Vorlage ohne Haken, PDF aus dem Archiv) – das PDF ist eine echte Datei aus dem Repo
const DP_PAKET = { id: "77777777-2222-3333-4444-555555555555", titel: "Druckpaket Weihnachtsmarkt", anlass: "weihnachtsmarkt", geaendert_am: new Date().toISOString(), von: "Test",
  daten: { vorlage: "druckpaket", paket: [{ typ: "vorlage", ref: "wm_bar", titel: "Nur Barzahlung", n: 2, an: true }, { typ: "vorlage", ref: "wm_stufe", titel: "Vorsicht Stufe!", n: 3, an: false },
    { typ: "archiv", ref: "88888888-2222-3333-4444-555555555555", titel: "Kurzanleitung", n: 1, an: true }] } };
Object.assign(ANTWORTEN, { schild_liste: { schilder: [DP_PAKET] }, anlage_url: { url: `${BASIS}/dokumente/Koecheclub-App_Kurzanleitung.pdf` } });

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
    // 2.762.0 KC-CLUB-RUNDER-TISCH: Karte auf der Startseite, Liste, Tisch mit 18 Plätzen, Einladen
    if (g.touch) {
      const rt = await seite.evaluate(async () => { zeige("start"); await new Promise((r) => setTimeout(r, 400)); fensterZu($("rundBlatt")); await new Promise((r) => setTimeout(r, 400)); const karte = $("rundKarte")?.textContent || "";
        await rundOeffnen(); const liste = !!$("rundBlatt") && /Club-Song/.test($("rundInhalt")?.textContent || "");
        await rundTischZeigen("11111111-2222-3333-4444-555555555555"); const b = document.querySelectorAll("#rundTischBlatt .rund-platz");
        const uhr1 = document.querySelector('#rundTischBlatt .rund-uhr-leiste [data-rund-uhr="ende"]')?.textContent || ""; await new Promise((r) => setTimeout(r, 2200)); // 2.778.0 KC-CLUB-RUNDER-TISCH-UHR
        const uhr2 = document.querySelector('#rundTischBlatt .rund-uhr-leiste [data-rund-uhr="ende"]')?.textContent || "";
        const tisch = { uhr: /^\d+:\d\d$/.test(uhr1) && uhr1 !== uhr2, uhrText: `${uhr1} → ${uhr2}`, plaetze: b.length, grau: document.querySelectorAll("#rundTischBlatt .rund-platz.unsicher").length, quer: document.documentElement.scrollWidth > innerWidth + 2 };
        await rundTascheOeffnen("11111111-2222-3333-4444-555555555555"); const tt = $("rundTascheInhalt")?.textContent || ""; // 2.772.0
        const tasche = /Ablauf\.pdf/.test(tt) && /Club-Song\.mp3/.test(tt) && /Vorab für alle/.test(tt) && /Rezept\.pdf/.test(tt) && document.documentElement.scrollWidth <= innerWidth + 2; fensterZu($("rundTascheBlatt"));
        await rundTischZeigen("33333333-2222-3333-4444-555555555555");
        const seminar = { pult: !!document.querySelector("#rundTischBlatt .rund-pult .rund-platz.gastgeber"), reihen: document.querySelectorAll("#rundTischBlatt .rund-reihen .rund-platz").length, quer: document.documentElement.scrollWidth > innerWidth + 2 };
        RUND.sitze = RUND.warte = null; clearTimeout(RUND.herz); fensterZu($("rundTischBlatt"));
        const inhalt = $("rundInhalt")?.textContent || "", to = /Stand und Dienste/.test(inhalt), knopf = /Teilnahmebestätigung/.test(inhalt), gruppe = /nur 💡 Innovation/.test(inhalt);
        const tb = druckTischBestaetigung({ thema: "Kasse Schulung", beginn: new Date().toISOString(), ende: new Date().toISOString(), referent: "R", name: "Test", b: { von: new Date().toISOString(), bis: new Date().toISOString(), min: 60 } });
        fensterZu($("rundBlatt")); rundNeu();
        const neu = !!$("rundThema") && document.querySelectorAll('input[name="rundArt"]').length === 3 && document.documentElement.scrollWidth <= innerWidth + 2;
        document.querySelector('input[name="rundArt"][value="besprechung"]').click(); const toFeld = !$("rundToFeld").classList.contains("versteckt");
        const fuerWen = [...($("rundGruppe")?.options || [])].map((o) => o.textContent).join("|");
        await new Promise((r) => setTimeout(r, 900)); const check = { text: $("rundZeitCheck")?.textContent || "", gesperrt: !!$("rundLos")?.disabled }; fensterZu($("rundNeuBlatt"));
        rundWiederholen("44444444-2222-3333-4444-555555555555"); // 2.779.0 KC-CLUB-RUNDER-TISCH-WIEDERHOLEN: Formular kommt vorbelegt
        const wieder = { knopf: /🔁 Wiederholen/.test(inhalt), thema: $("rundThema")?.value, art: document.querySelector('input[name="rundArt"]:checked')?.value, to: $("rundTo")?.value,
          gruppe: $("rundGruppe")?.value, tag: $("rundTag")?.value, h: document.querySelector("#rundNeuBlatt h3")?.textContent, quer: document.documentElement.scrollWidth > innerWidth + 2 };
        await new Promise((r) => setTimeout(r, 500)); fensterZu($("rundNeuBlatt"));
        return { wieder, karte: /Runder Tisch|Seminar/.test(karte), liste, ...tisch, neu, seminar, to, knopf, tb: /teilgenommen hat/.test(tb.html), toFeld, gruppe, fuerWen, check, tasche }; }).catch((e) => ({ fehler: String(e).slice(0, 160) }));
      if (!rt.karte) melde("Runder Tisch: Karte auf der Startseite fehlt");
      if (!rt.liste) melde("Runder Tisch: Liste erscheint nicht " + (rt.fehler || ""));
      if (rt.plaetze !== 18 || rt.grau !== 1) melde(`Runder Tisch: ${rt.plaetze} Plätze, ${rt.grau} grau (erwartet 18 und 1)`);
      if (rt.quer) melde("Runder Tisch: ragt seitlich über den Rand");
      if (!rt.uhr) melde("Runder Tisch: Restzeit-Uhr zählt nicht (" + rt.uhrText + ")"); // 2.778.0
      if (!rt.neu) melde("Runder Tisch: Einladen-Fenster (mit 3 Arten) fehlt oder ragt über den Rand");
      if (!rt.seminar?.pult || rt.seminar?.reihen !== 12 || rt.seminar?.quer) melde("Seminar: Hörsaal falsch " + JSON.stringify(rt.seminar)); // 9 Teilnehmer + 3 freie Plätze
      if (!rt.to || !rt.toFeld) melde("Besprechung: Tagesordnung fehlt");
      if (!rt.knopf || !rt.tb) melde("Seminar: Teilnahmebestätigung fehlt");
      if (!/Clubabend/.test(rt.check?.text || "") || !rt.check?.gesperrt) melde("Zeitprüfung: Clubabend nicht gemeldet oder „Einladen“ nicht gesperrt " + JSON.stringify(rt.check)); // 2.764.0
      const w = rt.wieder || {}; // 2.779.0
      if (!w.knopf || w.thema !== "Weihnachtsmarkt" || w.art !== "besprechung" || w.to !== "Begrüßung\nStand und Dienste\nVerschiedenes" || w.gruppe !== "66666666-2222-3333-4444-555555555555"
        || !/^\d{4}-\d\d-\d\d$/.test(w.tag || "") || !/Wiederholen/.test(w.h || "") || w.quer) melde("🔁 Wiederholen: Knopf oder Vorbelegung stimmt nicht " + JSON.stringify(w));
      if (!rt.tasche) melde("💼 Tasche: Teile, Vorab oder Breite stimmen nicht"); // 2.772.0
      if (!rt.gruppe || !/Alle Mitglieder\|💡 nur Gruppe „Innovation“/.test(rt.fuerWen || "")) melde("Gruppe: Hinweis oder „Für wen?“ fehlt " + (rt.fuerWen || "")); // 2.762.0
    }
    // 2.766.0 KC-CLUB-SCHILDER-DRUCKPAKET: Paket öffnen, Anzahl ändern, drucken (Haken weg = nicht gedruckt), alles auf A4 hoch, nichts ragt über den Rand
    if (g.touch) {
      // der Rundgang dauert dadurch länger – die zeitgesteuerte Bühnen-Einladung (bwEinBlatt) würde sonst die Leiste unten verdecken
      const dp = await seite.evaluate(async () => { bwEinSetzen({ spaeter: Date.now() + 3600000 }); schStart(); await new Promise((r) => setTimeout(r, 800));
        const start = /Druckpaket Weihnachtsmarkt/.test($("schBlatt")?.textContent || "");
        schPaketOeffnen("77777777-2222-3333-4444-555555555555"); const zeilen = document.querySelectorAll("#schBlatt .sdr-paket-zeile").length, aus = document.querySelectorAll("#schBlatt .sdr-paket-zeile.aus").length;
        const quer = document.documentElement.scrollWidth > innerWidth + 2; schPaketAnzahl(0, 1);
        let gedruckt = null; const alt = window.druckStarten; window.druckStarten = (a) => { gedruckt = a; };
        try { await schPaketDrucken(null); } finally { window.druckStarten = alt; }
        const pdf = await (await pdfjsHolen()).getDocument({ url: "dokumente/Koecheclub-App_Kurzanleitung.pdf", isEvalSupported: false }).promise, seitenPdf = pdf.numPages; pdf.destroy();
        const s = SDR.paketSeiten || [], hoch = await Promise.all(s.slice(0, 4).map((b) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i.naturalHeight > i.naturalWidth); i.onerror = () => ok(false); i.src = b; })));
        const html = schPaketDruckSeite()?.html || ""; $("schBlatt")?.remove();
        return { start, zeilen, aus, quer, gedruckt, seiten: s.length, soll: 3 + seitenPdf, hoch: hoch.every(Boolean), dseite: (html.match(/class="dseite"/g) || []).length }; }).catch((e) => ({ fehler: String(e).slice(0, 160) }));
      if (!dp.start || dp.zeilen !== 3 || dp.aus !== 1 || dp.quer) melde("Druckpaket: Liste falsch " + JSON.stringify(dp));
      if (dp.gedruckt !== "druckpaket" || dp.seiten !== dp.soll || !dp.hoch || dp.dseite !== dp.seiten) melde("Druckpaket: Druck falsch " + JSON.stringify(dp)); // 3× Barzahlung + PDF, ohne „Vorsicht Stufe“
    }
    // 2.727.0 KC-CLUB-TEILE: jedes nachladbare Teil lädt (Fingerabdruck passt) und ersetzt seine Platzhalter; die Probe antwortet mit dieser Version
    const teile = await seite.evaluate(async () => { const out = [];
      for (const [n, t] of Object.entries(TEILE_LISTE)) { try { await teilLaden(n); const offen = t.einstieg.filter((f) => typeof window[f] !== "function" || window[f]._teil); if (offen.length) out.push(`${n}: Platzhalter bleibt (${offen.join(", ")})`); } catch (e) { out.push(`${n}: ${e.message}`); } }
      const pr = await teilProbe(); if (pr !== "ok " + APP_VERSION) out.push("probe: Antwort " + pr); return out; });
    for (const t of teile) melde("Programmteil " + t);
    if (g.touch) for (const b of await seite.$$(".fuss-leiste button")) { await b.click().catch((e) => melde("Leiste unten: " + String(e).slice(0, 100))); await seite.waitForTimeout(700); }
    const fp = await seite.evaluate(() => (window.KCFP?.lies() || []).filter((e) => /^(skript|versprechen|gefangen|instabil|schutz|start_kaputt)$/.test(e.art)));
    for (const e of fp) melde(`Fehlerprotokoll „${e.art}“: ${String(e.text || "").slice(0, 160)} ${String(e.stack || "").slice(0, 160)}`);
    await ctx.close();
  }
} finally { await browser.close(); server.close(); }

// 2.766.0 KC-CLUB-RUNDER-TISCH-LIVE: der Live-Test (3 Fenster, echte Verbindungen) läuft im selben Schritt mit – ohne die Arbeitsabläufe anzufassen
try { execFileSync(process.execPath, [fileURLToPath(new URL("./tisch-live.browser.mjs", import.meta.url))], { stdio: "inherit", timeout: 600000 }); }
catch { fehler.push("Tisch-Live: Test rot (Ausgabe oben)"); }
if (fehler.length) { console.error("❌ Rundgang: " + fehler.length + " Fund(e)\n" + fehler.join("\n")); process.exit(1); }
console.log(`OK – Rundgang: ${GERAETE.map((g) => `${g.name} ${g.seiten.length} Seiten`).join(", ")} ohne Fehler`);
