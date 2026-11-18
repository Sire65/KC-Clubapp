// KC-CLUB-ANORDNUNG (Wunsch Hansi 18.11.2026, nach dem Vorbild Bachkreis): misst die Anordnung der Knöpfe auf allen Seiten und Kachel-Fenstern
// in 6 Rollen (Admin, Vorstand, Mitglied, Aushilfe, Gast, einfache Ansicht) auf Handy- (360 px) und Tablet-Breite (820 px):
// Seite zu breit · über den Rand · abgeschnittene Titel/Texte · Reihen, die rechts unsichtbar weiterlaufen · unruhige Knopfreihen · Knöpfe unter 32/40 px · schwebende Knöpfe.
// Nur Testdaten, abgeschirmt (KC-TESTS-OHNE-ECHTSERVER): seite.route("**/*") + Netzsperre – nie der echte Club-Server. Prüft, baut nichts.
// Aufruf: node tools/anordnung-pruefen.mjs [ausgabe.json] [bilder-ordner]   (Umgebung: NUR=admin,mitglied  GERAET=Handy|Tablet) – dauert ca. 20 Min.
// Grenzen: leere Testdaten (volle Listen nicht gemessen); Kacheln, die ohne echte Daten nichts öffnen, werden übersprungen.
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), AUS = process.argv[2], BILDER = process.argv[3];
const { chromium } = createRequire(import.meta.url)("playwright");
const heute = new Date().toISOString().slice(0, 10);
const ANTWORTEN = {
  treffen_liste: { treffen: [], geburtstage: [] }, unterhaltungen: { unterhaltungen: [] },
  terminumfragen_liste: { umfragen: [] }, terminanfragen_liste: { anfragen: [] }, privattermine_liste: { privat: [] }, schulung_meine: { einladungen: [], unvollstaendig: [] },
  erstattung_meine: { kmSatz: 0.3, standard: 0.3, saetze: [], gruende: [], arten: [], antraege: [] }, eltern_meine: { eltern: [] },
  wetter_konfig: { quellen: [], apps: [], app: null, quelle: null, ort: { name: "Werne", region: "NRW" } }, aktionen_liste: { aktionen: [], stand: null },
  fotos_liste: { fotos: [], themen: [], jahre: [], anlaesse: [], speicher: { prozent: 0, belegt: 0, grenze: 1 }, papierkorb: 0, alben: [], albenKorb: 0, album: null },
  vorschlaege_liste: { vorschlaege: [], treffen: [], spenden: { empfaenger: [], betraege: [], max: 0 } },
  protokolle_liste: { darfOrganisieren: true, protokolle: [], aufgaben: [], treffenOhneProtokoll: [] },
  archiv_liste: { darf: true, vorstand: true, ich: "KC-P-TEST", arten: [], papierkorbTage: 30, speicher: { belegt: 0, grenze: 1 }, register: [], freigabeMaxTage: 30, personen: [], gruppen: [], ordner: [], dokumente: [], auto: [], alben: [], persoenlich: [] },
  hilfe_liste: { aufrufe: [], angebote: [], angebotSymbole: [], arten: [], zeitfenster: [], orte: [] },
  dienste: { von: heute, bis: heute, freigabe: true, personen: [], gewaehlt: [], dienste: [], stand: null, wuensche: [], wunschTage: null, wunschPersonen: [], wunschStand: null },
  feedback_meins: { bogen: 1, fragen: [], umgesetzt: [], antwort: null },
  mitglieder: { aemter: [], onlineSichtbar: true, mitglieder: [] },
};
const ROLLEN = {
  admin: { admin: true, vorstand: true, aemter: ["Admin"] },
  vorstand: { admin: false, vorstand: true, aemter: ["Clubsprecher"] },
  mitglied: { admin: false, vorstand: false, aemter: [] },
  aushilfe: { admin: false, vorstand: false, aemter: [], zugang: "aushilfe" },
  gast: { admin: false, vorstand: false, aemter: [], zugang: "gast" },
  einfach: { admin: false, vorstand: false, aemter: [], ansicht: "einfach" },
};
const BREITEN = [{ name: "Handy", w: 360, h: 780, touch: true }, { name: "Tablet", w: 820, h: 1180, touch: true }];
const VIEWS = ["start", "termine", "nachrichten", "mitglieder", "einstellungen", "fotos", "pinnwand", "vorschlaege", "dokumente", "archiv", "protokolle", "spiele", "buero",
  "hilfezentrum", "aktionen", "dienste", "erstattung", "helfen", "feedback", "sos", "sicherheit", "programme", "ueberblick", "standort"];

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".mp3": "audio/mpeg", ".wasm": "application/wasm", ".woff2": "font/woff2", ".pdf": "application/pdf" };
const server = http.createServer((req, res) => {
  const p = path.normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const datei = path.join(WURZEL, p || "index.html");
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(datei)] || "application/octet-stream" }); fs.createReadStream(datei).pipe(res);
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const BASIS = `http://127.0.0.1:${server.address().port}`;

// ---- Messung im Browser (für das sichtbare oberste Fenster bzw. die Seite) ----
function messen() {
  const W = innerWidth, sichtbar = (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && +s.opacity > 0.05; };
  const blaetter = [...document.querySelectorAll(".blatt:not(.versteckt)")].filter(sichtbar);
  const wurzel = blaetter.length ? blaetter[blaetter.length - 1] : document.querySelector(".view:not(.versteckt)") || [...document.querySelectorAll('[id^="v-"]')].find(sichtbar) || document.body;
  const kurz = (el) => (el.innerText || el.value || el.getAttribute("aria-label") || el.title || "").replace(/\s+/g, " ").trim().slice(0, 40);
  const scrollEltern = (el) => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll|hidden)/.test(s.overflowX) && p.scrollWidth > p.clientWidth + 2) return p; } return null; };
  const alle = [...wurzel.querySelectorAll("*")].filter(sichtbar);
  const knoepfe = alle.filter((el) => el.matches("button, a.knopf, .knopf, [role=button], select, input[type=button], input[type=submit], label.knopf") && !el.closest(".kstrg"));
  const out = { wurzel: wurzel.id || wurzel.className, quer: document.documentElement.scrollWidth > W + 2, breite: document.documentElement.scrollWidth };
  // 1. über den Rand (nicht in einem wischbaren Bereich)
  out.ueberRand = alle.filter((el) => { const r = el.getBoundingClientRect(); return r.right > W + 1 && r.left < W && !scrollEltern(el) && el.children.length === 0; }).slice(0, 6).map(kurz).filter(Boolean);
  // 2. abgeschnittene Texte (… am Ende)
  out.abgeschnitten = alle.filter((el) => { const s = getComputedStyle(el); return (s.textOverflow === "ellipsis" || s.overflow === "hidden") && el.scrollWidth > el.clientWidth + 1 && (el.innerText || "").trim().length > 1 && el.children.length <= 2; })
    .map((el) => ({ text: kurz(el), tag: el.tagName.toLowerCase(), titel: /^H[1-4]$/.test(el.tagName) || /titel|kopf/i.test(el.className + " " + el.id) })).slice(0, 12);
  // 3. Reihen, die rechts unsichtbar weiterlaufen
  out.reihen = [...new Set(knoepfe.map(scrollEltern).filter(Boolean))].map((p) => { const n = p.querySelectorAll("button, .knopf, .chip").length, sichtbarN = [...p.querySelectorAll("button, .knopf, .chip")].filter((b) => b.getBoundingClientRect().right <= p.getBoundingClientRect().right + 1).length;
    const s = getComputedStyle(p); return { id: p.id || String(p.className).slice(0, 30), knoepfe: n, sichtbar: sichtbarN, verhaeltnis: +(p.scrollWidth / p.clientWidth).toFixed(2), auslauf: /gradient|mask/.test(s.maskImage + s.webkitMaskImage + s.backgroundImage) }; });
  // 4. Knopfgrößen
  const h = knoepfe.map((b) => ({ b, r: b.getBoundingClientRect() }));
  out.knoepfe = h.length; out.unter32 = h.filter((x) => x.r.height < 32).length; out.unter40 = h.filter((x) => x.r.height < 40).length;
  out.kleinBeispiele = h.filter((x) => x.r.height < 32).slice(0, 6).map((x) => `${kurz(x.b)} (${Math.round(x.r.height)}px)`);
  out.schriftKlein = knoepfe.filter((b) => parseFloat(getComputedStyle(b).fontSize) < 12).length;
  // 5. unruhige Knopfreihen (umgebrochen, sehr ungleich breit)
  const behaelter = new Set(knoepfe.map((b) => b.parentElement));
  out.unruhig = [...behaelter].filter((p) => { const s = getComputedStyle(p); if (!/flex/.test(s.display) || s.flexWrap !== "wrap") return false;
    const k = [...p.children].filter((c) => sichtbar(c) && c.matches("button, .knopf, a.knopf") && !c.matches(".zurueck")); // der schmale Zurück-Pfeil zählt nicht if (k.length < 3) return false;
    const tops = new Set(k.map((c) => Math.round(c.getBoundingClientRect().top))), ws = k.map((c) => c.getBoundingClientRect().width);
    return tops.size >= 2 && Math.min(...ws) / Math.max(...ws) < 0.5; }).map((p) => ({ id: p.id || String(p.className).slice(0, 30), knoepfe: [...p.children].filter((c) => c.matches("button, .knopf")).length, beispiel: kurz(p).slice(0, 40) })).slice(0, 6);
  // 6. schwebende Knöpfe (fest am Rand)
  out.schwebend = [...document.querySelectorAll("body *")].filter((el) => { const s = getComputedStyle(el); return s.position === "fixed" && sichtbar(el) && el.matches("button, a, .knopf, [role=button]"); })
    .map((el) => { const r = el.getBoundingClientRect(); return { t: kurz(el) || el.id, w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top), deckkraft: +getComputedStyle(el).opacity }; });
  // 7. Kopfzeile: Titel und Höhe
  const kopf = document.querySelector(".kopf:not(.versteckt), header"); if (kopf && sichtbar(kopf)) { const r = kopf.getBoundingClientRect(); out.kopfHoehe = Math.round(r.height); }
  return out;
}

const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0";
const browser = await chromium.launch({ args: [OHNE_ECHTSERVER, "--no-proxy-server"] });
const ergebnis = [];
try {
  for (const [rolle, r] of Object.entries(ROLLEN).filter(([n]) => !process.env.NUR || process.env.NUR.split(",").includes(n))) for (const g of BREITEN.filter((b) => !process.env.GERAET || b.name === process.env.GERAET)) {
    const ctx = await browser.newContext({ viewport: { width: g.w, height: g.h }, hasTouch: true, isMobile: true, serviceWorkers: "block", locale: "de-DE", timezoneId: "Europe/Berlin",
      userAgent: g.name === "Handy" ? "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36" : "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36" });
    const seite = await ctx.newPage();
    const INIT = { ok: true, ich: { person_id: "KC-P-TEST", vorname: "Test", name: "Test Prüfung", rollen: [], ...r }, mitglieder: [], treffen: [], chats: [], pinnwand: [], termine: [], zaehler: {}, kacheln: null,
      einstellungen: { begruessung: { gesehen: true }, unterstuetzung: "normal", einweisung: { an: false, gesehen: {} }, spiel_einladung: { an: false }, ansicht: { art: r.ansicht || "erweitert", gewaehlt: true },
        filme: { ansichtfilm: { wie: "ende", z: "2026-11-02T08:00:00.000Z" }, kopffilm: { wie: "ende", z: "2026-11-04T08:00:00.000Z" } } } };
    await seite.route("**/*", (rt) => {
      const u = new URL(rt.request().url());
      if (u.origin === BASIS || u.protocol === "data:" || u.protocol === "blob:") return rt.continue();
      if (/\/functions\/v1\/kc-club$/.test(u.pathname)) { let a = ""; try { a = JSON.parse(rt.request().postData() || "{}").action; } catch {}
        return rt.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(a === "init" ? INIT : ANTWORTEN[a] ?? { ok: true }) }); }
      if (/\/functions\/v1\//.test(u.pathname)) return rt.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: "{}" });
      return rt.abort();
    });
    await seite.routeWebSocket(/realtime\/v1\/websocket/, (ws) => ws.close());
    await seite.goto(`${BASIS}/index.html?k=0123456789abcdef0123456789abcdef`);
    await seite.waitForFunction(() => typeof ICH !== "undefined" && !!ICH, null, { timeout: 30000 }).catch(() => {});
    await seite.waitForTimeout(2500);
    const zuAlles = () => seite.evaluate(() => { document.querySelectorAll(".blatt:not(.versteckt)").forEach((b) => { try { fensterZu(b); } catch {} }); document.querySelectorAll(".blatt[data-dyn]").forEach((b) => b.remove()); });
    await zuAlles();
    const ziele = [...VIEWS.map((v) => ({ art: "seite", id: v, los: `zeige(${JSON.stringify(v)})` }))];
    const kach = await seite.evaluate(() => { const out = []; for (const reg of Object.keys(KACHELN)) { let l = []; try { l = kacheln(reg); } catch {} for (const k of l) out.push({ reg, id: k.id, t: k.t, los: k.aktion || (k.v ? `zeige('${k.v}')` : "") }); } return out; }).catch(() => []);
    for (const k of kach) if (k.los) ziele.push({ art: "kachel", id: `${k.reg}/${k.id}`, t: k.t, los: k.los });
    for (const z of ziele) {
      await zuAlles(); await seite.evaluate(() => { try { zeige("start"); } catch {} });
      await seite.evaluate((l) => { try { const x = new Function(l)(); if (x?.catch) x.catch(() => {}); } catch {} }, z.los);
      await seite.waitForTimeout(800);
      const m = await seite.evaluate(messen).catch((e) => ({ fehler: String(e).slice(0, 100) }));
      ergebnis.push({ rolle, geraet: g.name, ...z, ...m });
      if (BILDER && rolle === "admin") await seite.screenshot({ path: path.join(BILDER, `${g.name}-${z.id.replace(/\//g, "_")}.png`) }).catch(() => {});
    }
    process.stderr.write(`${rolle} ${g.name}: ${ziele.length} Ziele\n`);
    await ctx.close();
  }
} finally { await browser.close(); server.close(); }
if (AUS) fs.writeFileSync(AUS, JSON.stringify(ergebnis, null, 1));
// ---- Zusammenfassung: Kacheln, die nur eine Seite öffnen, zählen bei der Seite; Kacheln ohne eigenes Fenster werden übersprungen ----
const d = ergebnis.filter((e) => e.art === "seite" || !String(e.wurzel).startsWith("v-")).map((e) => ({ ...e, name: e.art === "seite" ? e.id : `${e.wurzel} (${e.t || ""})` }));
const funde = (titel, f) => { const m = new Map(); for (const e of d) for (const x of f(e) || []) { const k = `${e.name}: ${x}`; m.set(k, (m.get(k) || new Set()).add(`${e.rolle}/${e.geraet}`)); }
  console.log(`\n## ${titel}: ${new Set([...m.keys()].map((k) => k.split(":")[0])).size} Seiten`); for (const [k, w] of [...m].sort()) console.log(`  ${k.slice(0, 140)}  [${w.size}×, z. B. ${[...w][0]}]`); };
console.log(`Messungen: ${d.length} · Seiten/Fenster: ${new Set(d.map((e) => e.name)).size} · übersprungen (öffnen ohne echte Daten nichts): ${[...new Set(ergebnis.filter((e) => e.art === "kachel" && e.wurzel === "v-start").map((e) => e.id))].join(", ") || "–"}`);
funde("Seite zu breit", (e) => e.quer ? ["wischt seitlich"] : []);
funde("Über den rechten Rand", (e) => e.ueberRand);
funde("Abgeschnittene Titel", (e) => (e.abgeschnitten || []).filter((a) => a.titel).map((a) => a.text));
funde("Abgeschnittene Texte", (e) => (e.abgeschnitten || []).filter((a) => !a.titel).map((a) => a.text));
funde("Reihen, die rechts weiterlaufen", (e) => (e.reihen || []).filter((r) => r.knoepfe > 0 && r.id !== "infoLaufband").map((r) => `${r.id} (${r.sichtbar}/${r.knoepfe} sichtbar, Auslauf ${r.auslauf ? "ja" : "nein"})`));
funde("Unruhige Knopfreihen", (e) => (e.unruhig || []).map((u) => `${u.id} (${u.knoepfe} Knöpfe)`));
funde("Knöpfe unter 32 px", (e) => e.kleinBeispiele);
const k = d.reduce((a, e) => a + (e.knoepfe || 0), 0), u32 = d.reduce((a, e) => a + (e.unter32 || 0), 0), u40 = d.reduce((a, e) => a + (e.unter40 || 0), 0);
console.log(`\n## Knöpfe: ${k} gemessen · ${u32} unter 32 px (${Math.round(u32 * 100 / Math.max(k, 1))} %) · ${u40} unter 40 px (${Math.round(u40 * 100 / Math.max(k, 1))} %)`);
