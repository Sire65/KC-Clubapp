// KC-CLUB-UNTERSTUETZUNG-ANFRAGE (2.492.0): Browser-Test des echten app.js (Chromium über playwright-core): Laufband-Angebot, Fragebogen,
// Senden, 30-Tage-Pause, Admin-Liste (sicher dargestellt), Admin-Hinweis. Start: node tools/unterstuetzung/ua-browser.mjs (PW_CORE, PW_CHROME)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8796);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } });
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8796/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const erg = await seite.evaluate(async () => {
  const r = {}, warte = (ms) => new Promise((x) => setTimeout(x, ms));
  try { localStorage.removeItem("kc_club_ua_gesendet"); } catch {}
  window.__api = []; api = async (a, p) => { __api.push({ a, p });
    if (a === "unterstuetzung_meine") return { anfrage: null };
    if (a === "unterstuetzung_senden") return { ok: true, id: "u1" };
    if (a === "unterstuetzung_liste") return { anfragen: [{ id: "u1", person_id: "P2", name: "Klara <img src=x onerror=window.__xss=1>", status: "offen", punkte: ["schrift", "push_keine"], text: "Bitte <b>schnell</b>", kontakt: ["anruf"], erstellt_am: new Date().toISOString() }],
      punkte: { schrift: "Schrift zu klein oder schlecht lesbar", push_keine: "Ich bekomme keine Benachrichtigungen" }, kontakt: { anruf: "📞 Anruf" } };
    if (a === "unterstuetzung_status") return { ok: true };
    return { ok: true }; };
  // Mitglied: Angebot im Laufband
  ICH = { ...(ICH || {}), person_id: "P1", admin: false }; INIT = { ...(INIT || {}), kz: {} };
  r.angebot = ilMeldungen().some((m) => m.id === "unterstuetzung");
  // Fragebogen
  await uaStart(); const f = document.getElementById("uaBlatt");
  r.punkte = f.querySelectorAll("[data-ua]").length; r.bereiche = f.querySelectorAll(".ua-bereich").length; r.kontakte = f.querySelectorAll("[data-uak]").length;
  await uaSenden(); r.leerAbgelehnt = !__api.some((x) => x.a === "unterstuetzung_senden");
  f.querySelector('[data-ua="schrift"]').checked = true; f.querySelector('[data-ua="push_keine"]').checked = true; f.querySelector('[data-uak="anruf"]').checked = true;
  document.getElementById("uaText").value = "  Fotos hochladen  ";
  await uaSenden(); const s = __api.find((x) => x.a === "unterstuetzung_senden")?.p;
  r.gesendet = s && JSON.stringify(s.punkte) === JSON.stringify(["push_keine", "schrift"]) && JSON.stringify(s.kontakt) === JSON.stringify(["anruf"]) && s.text === "Fotos hochladen";
  r.blattZu = !document.getElementById("uaBlatt"); r.pause = !ilMeldungen().some((m) => m.id === "unterstuetzung");
  // Admin: Hinweis und Liste
  ICH = { ...ICH, admin: true }; INIT.kz = { unterstuetzung: 2 };
  const al = ilMeldungen().find((m) => m.id === "ua-admin"); r.adminHinweis = al?.stufe === "orange" && /2 Unterstützungs-Anfragen/.test(al.t) && !ilMeldungen().some((m) => m.id === "unterstuetzung");
  await uaAdmin(); const b = document.getElementById("uaAdminBlatt");
  r.liste = !!b && /Schrift zu klein/.test(b.textContent) && /Fotos|schnell/.test(b.textContent) && /📞 Anruf/.test(b.textContent);
  r.keinXss = !window.__xss && !b.querySelector("img") && !b.querySelector(".ua-liste b");
  b.querySelector("button[onclick*='in_arbeit']")?.click(); await warte(300);
  r.status = __api.some((x) => x.a === "unterstuetzung_status" && x.p.id === "u1" && x.p.status === "in_arbeit");
  return r;
});
ok(erg.angebot, "Mitglied: „Unterstützung bei der Club-App?“ im Info-Laufband");
ok(erg.punkte === 8 && erg.bereiche === 7 && erg.kontakte === 3, `Fragebogen kurz: 8 Punkte in 5 Bereichen + Freitext + 3 Kontaktwege (${erg.punkte}/${erg.bereiche}/${erg.kontakte})`);
ok(erg.leerAbgelehnt, "leere Anfrage wird nicht gesendet");
ok(erg.gesendet && erg.blattZu, "Anfrage mit angekreuzten Punkten, Kontaktweg und Text gesendet");
ok(erg.pause, "nach dem Senden 30 Tage kein Angebot im Laufband");
ok(erg.adminHinweis, "Admin: orange Meldung mit Anzahl, kein Angebot für sich selbst");
ok(erg.liste && erg.keinXss, "Admin-Liste zeigt Punkte, Text, Kontaktweg – Namen/Text sicher (kein HTML)");
ok(erg.status, "„Übernehmen“ setzt den Stand");
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
