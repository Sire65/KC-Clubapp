// 3.33.0 KC-CLUB-HILFE-3330: Twinkey und Lupe finden die Neuheiten 2.955.0–3.32.0; ein Mitglied sieht in Hilfe, Twinkey und Lupe nichts von Admin/Clubleitung, Admin-Funktionen werden nicht erklärt,
// die Clubleitung sieht ihre Einträge. Echtes app.js, Browser abgeschirmt (KC-TESTS-OHNE-ECHTSERVER), nur Testdaten.
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/hilfe-3330-browser.mjs
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8798);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: Number(process.env.BREITE || 400), height: 800 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(process.env.STAPEL ? String(e.stack).slice(0, 600) : String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close());
await seite.goto("http://localhost:8798/index.html"); await seite.waitForTimeout(2500);
await seite.evaluate(() => {
  ICH = { ...(ICH || {}), person_id: "P1", name: "Klaus Test", vorname: "Klaus", admin: false, vorstand: false, buero: false }; MITGLIEDER = MITGLIEDER || [];
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  window.__api = []; window.__apiEcht = async (a, p) => { __api.push({ a, p }); return a === "mitglieder" ? { mitglieder: [], aemter: [], onlineSichtbar: true } : a === "init" ? { ok: true, ich: ICH } : {}; }; api = __apiEcht; // leere, aber gültige Antworten
  try { speechSynthesis.speak = () => {}; } catch {}
});
await seite.evaluate(() => teilLaden("videos")); await seite.evaluate(() => teilLaden("hilfe"));
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const t = await seite.evaluate(() => {
  const tw = (f) => twFinden(f).slice(0, 4).map((x) => x.e?.id || x.id);
  const lu = (q) => { SU.q = q; SU.genau = false; return suAppTreffer().slice(0, 5).map((x) => x.t); };
  return {
    tw: { karte: tw("Wie schicke ich eine Geburtstagskarte?"), unterschreiben: tw("Wie unterschreibe ich die gemeinsame Karte?"), fuerdich: tw("Was ist Für dich oben im Chat?"),
      erinnern: tw("Kann mich die App an eine Nachricht erinnern?"), wa: tw("Er liest lieber WhatsApp"), foto: tw("Wie speichere ich ein Foto aus dem Chat?"),
      aufgabe: tw("Wie melde ich den Stand meiner Aufgabe?"), rollkartei: tw("Was macht das gelbe Schloss in der Rollkartei?"), plan: tw("Wo finde ich den Dienstplan zum Drucken?"),
      anderezeit: tw("Ich kann nur einen Teil der Zeit bei der Terminanfrage"), glocke: tw("Was bedeutet die Glocke auf den Mitglieder-Kacheln?"), schlaf: tw("Warum ist die App dunkel mit Uhr?"),
      fehlerid: tw("Was bedeutet die Fehler-ID?"), auto: tw("Kann die App automatisch antworten?") },
    lu: { karte: lu("karte schicken"), kluge: lu("kluge helfer"), wa: lu("lieber whatsapp"), rollkartei: lu("rollkartei"), plaene: lu("pläne weihnachtsmarkt"), anderezeit: lu("andere zeit"),
      laufschrift: lu("laufschrift liste"), schlaf: lu("schlafmodus"), test: lu("schreibtest") },
  };
});
console.log(JSON.stringify(t));
const hat = (l, re) => l.some((x) => re.test(x));
ok(hat(t.tw.karte, /karte-schicken/) && hat(t.tw.unterschreiben, /karte-unterschreiben/) && hat(t.tw.fuerdich, /fuer-dich/) && hat(t.tw.erinnern, /nachricht-erinnern/) && hat(t.tw.wa, /lieber-whatsapp/)
  && hat(t.tw.foto, /foto-speichern/) && hat(t.tw.aufgabe, /aufgabe-stand/) && hat(t.tw.rollkartei, /rollkartei/) && hat(t.tw.plan, /dienstplan-drucken/) && hat(t.tw.anderezeit, /andere-zeit/)
  && hat(t.tw.glocke, /push-glocke/) && hat(t.tw.schlaf, /schlafmodus/) && hat(t.tw.fehlerid, /fehler-id/) && hat(t.tw.auto, /autoantwort/), "Twinkey findet die Neuheiten");
ok(hat(t.lu.karte, /Karte schicken/) && hat(t.lu.kluge, /Kluge Helfer/) && hat(t.lu.wa, /lieber WhatsApp/) && hat(t.lu.rollkartei, /Rollkartei/) && hat(t.lu.plaene, /Pläne Weihnachtsmarkt/)
  && hat(t.lu.anderezeit, /anderer Zeit/) && hat(t.lu.laufschrift, /Laufschrift/) && hat(t.lu.schlaf, /Schlafmodus/) && hat(t.lu.test, /Schreibtest/), "Lupe findet die Neuheiten");
const sicht = (rolle) => seite.evaluate((rolle) => {
  ICH = { ...ICH, admin: rolle === "admin", vorstand: rolle !== "mitglied" };
  const hz = HILFE.filter((x) => !x.nur || x.nur()), tw = TW_FAQ.filter((x) => !x.nur || x.nur()), lu = suAppListe();
  const wort = (s) => /\bAdmin\b|Admin-|\(Clubleitung\)/.test(String(s || "").replace(/Gruppen-Admin/g, ""));
  return { hz: hz.filter((x) => wort(x.t) || wort(x.x)).map((x) => x.id), tw: tw.filter((x) => wort(x.t) || wort(x.x)).map((x) => x.id), lu: lu.filter((x) => wort(x.t)).map((x) => x.t),
    ids: hz.map((x) => x.id), tws: tw.map((x) => x.id), lus: lu.map((x) => x.t) };
}, rolle);
const m = await sicht("mitglied");
ok(!m.hz.length && !m.tw.length && !m.lu.length, "Mitglied sieht in Hilfe, Twinkey und Lupe nichts von Admin " + JSON.stringify({ hz: m.hz, tw: m.tw, lu: m.lu }));
const neu = ["karten_baukasten", "karte_gemeinsam", "kluge_helfer", "kh_erinnern", "autoantwort", "wa_lieber", "wa_holen", "chat_vorhanden", "chatfoto_speichern", "aufgaben_stand", "laufband_liste", "mitfahrt_laufband", "rollkartei", "dp_plaene", "dp_gruss", "ta_andere_zeit", "aenderung_bitte", "push_zeichen", "start_warum", "fehler_id", "lese_schreibtest"];
ok(neu.every((id) => m.ids.includes(id)), "alle neuen Mitglieder-Hilfen sichtbar");
ok(!["sendebericht", "kundenpreisliste", "zusage_link", "admin_qr", "notaus_knopf", "dp_druck_admin"].some((id) => m.ids.includes(id)) && !m.tws.includes("qr-codes") && !m.lus.some((x) => /QR-Codes der Kassen|Sendebericht/.test(x)), "Mitglied: keine Leitungs-/Admin-Einträge");
const v = await sicht("vorstand");
ok(["sendebericht", "kundenpreisliste", "karte_starten"].every((id) => v.ids.includes(id)) && !v.ids.includes("admin_qr") && v.lus.some((x) => /Sendebericht/.test(x)) && !v.lus.some((x) => /QR-Codes der Kassen/.test(x)), "Clubleitung: eigene Einträge, keine Admin-Einträge");
const a = await sicht("admin");
ok(!["zusage_link", "admin_qr", "admin_verborgen", "notaus_knopf", "dp_druck_admin", "stempel_wer", "aenderung_erbitten", "fehlerkatalog", "gericht_admin"].some((id) => a.ids.includes(id)) && !a.tws.includes("qr-codes") && !a.lus.some((x) => /QR-Codes der Kassen|Zusage-Link/.test(x)), "keine neuen Admin-Hilfen (Wunsch Hansi: Admin-Funktionen nicht erklären)");
const hzAdmin = await seite.evaluate(() => hzEintraege().filter((e) => /\(Admin\)|Admin-Register|Admin-Zentrale/.test(e.t || e.titel || "")).map((e) => e.t || e.titel));
ok(!hzAdmin.length && !a.lus.some((x) => /Wer kommt wann\? \(Nutzung\)|Einsatzplan je Tag/.test(x)), "auch der Admin sieht im Hilfe-Zentrum und in der Lupe keine Admin-Hilfen " + JSON.stringify([hzAdmin, a.lus.filter((x) => /Wer kommt wann\? \(Nutzung\)|Einsatzplan je Tag/.test(x))]));
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
