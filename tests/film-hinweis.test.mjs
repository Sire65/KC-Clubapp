// KC-CLUB-FILM-HINWEIS (2.738.0, Wunsch Hansi „Film für Klaus einbauen – Hinweis beim Öffnen, direkter Link zum Film“): statische Prüfung (offline).
// Aufruf: node tests/film-hinweis.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync("index.html", "utf8"), sw = fs.readFileSync("sw.js", "utf8");
const server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");
// Registry: jeder Film hat Datei + Vorschaubild, die Dateien liegen im Repo, Zielgruppe nach Amt (keine feste Person)
const reg = app.slice(app.indexOf("const FILME = ["), app.indexOf("const filmeFuerMich"));
const filme = [...reg.matchAll(/id: "([a-z]{2,24})"[^]*?datei: "([^"]+)", bild: "([^"]+)"[^]*?fuer: \(\) => ([^\n]+)/g)];
assert.ok(filme.length >= 1, "Registry FILME leer");
for (const [, id, datei, bild, fuer] of filme) {
  const pfad = datei.split("?")[0]; // ?v=… nur gegen alte Fassungen im Zwischenspeicher des Browsers (2.742.0)
  assert.ok(fs.existsSync(pfad) && fs.statSync(pfad).size > 1e6, `Film fehlt: ${datei}`);
  assert.ok(fs.existsSync(bild), `Vorschaubild fehlt: ${bild}`);
  assert.ok(datei.startsWith("film/") && bild.startsWith("film/"), `${id}: Film gehört nach film/ (Service Worker lässt film/ aus)`);
  assert.ok((/aemter/.test(fuer) || /^false \}/.test(fuer)) && !/person_id|vorname|name ===/.test(fuer), `${id}: Zielgruppe nach Amt (oder false = kein Start-Hinweis), nicht nach Person`); // 2.756.0
}
assert.ok(sw.includes('url.pathname.includes("/film/")) return;'), "Service Worker muss film/ auslassen");
// Start-Fenster: nach den anderen Start-Fenstern, drei Wahlmöglichkeiten, direkter Start des Films
assert.ok(/setTimeout\(startHinweisPruefen, 2500\); setTimeout\(filmHinweisPruefen, 4000\);/.test(app), "Film-Hinweis beim Start");
const pr = app.slice(app.indexOf("async function filmHinweisPruefen"), app.indexOf("function filmZeigen"));
assert.ok(/\.blatt:not\(\.versteckt\), \.dlg, #rgSchicht, #filmSchicht/.test(pr) && /aktuelleAnsicht !== "start"/.test(pr), "erst wenn nichts anderes offen ist");
assert.ok(/▶ Film jetzt ansehen/.test(pr) && /⏰ Später/.test(pr) && /Nein, danke/.test(pr), "drei Knöpfe");
assert.ok(/if \(wahl === "an"\) return filmZeigen\(f\.id\);/.test(pr), "Ansehen startet den Film direkt");
assert.ok(/filmMerken\(f\.id, "nein"\)/.test(pr) && !/filmMerken\(f\.id, "spaeter"\)/.test(pr), "Später wird nicht gemerkt (fragt wieder)");
const zg = app.slice(app.indexOf("function filmZeigen"), app.indexOf("function filmWahl"));
assert.ok(/<video src=/.test(zg) && /controls autoplay playsinline/.test(zg) && /v\.onplay = \(\) => filmMerken\(f\.id, "angesehen"\)/.test(zg), "Abspieler");
assert.ok(/✕ Schließen/.test(zg) && /v\.onerror/.test(zg), "Schließen und Fehlermeldung");
assert.ok(/#filmSchicht \{ position: fixed/.test(html), "Abspiel-Schicht gestaltet");
// Büro: Knopf in Raum- und Listenansicht
assert.ok(/buIkon\("💼", "Tasche", "atStart\(\)", "Aktentasche"\) : "",\s+buFilmKnopf\(\),/.test(app) && /buKopfKnoepfe\(true, naechst\)/.test(app) && /buKopfKnoepfe\(false, null\)/.test(app), "🎬 Anleitung im Büro (Raum + Liste) – 2.768.0 als Icon-Knopf im gemeinsamen Kopf");
// Server: Einstellung „filme“ nur mit geprüften Werten
const e = server.slice(server.indexOf("  filme: (w) =>"), server.indexOf("  rundgang: (w) =>"));
assert.ok(/\^\[a-z\]\{2,24\}\$/.test(e) && /\["angesehen", "nein"\]/.test(e) && /slice\(0, 30\)/.test(e), "Server-Einstellung filme geprüft");
// 2.756.0 KC-CLUB-SICHERHEITSKONZEPT: Kachel unter Technik öffnet Film + PDF; das PDF liegt im Repo und steht nicht in „Meine Dokumente“
const technik = app.slice(app.indexOf("  programme: ["), app.indexOf("  admin: [],"));
assert.ok(/\{ id: "datenschutz", sym: "🔐", t: "Sicherheit & Datenschutz",[^\n]*aktion: "sdStart\(\)" \}/.test(technik), "Kachel 🔐 Sicherheit & Datenschutz unter Technik");
const sd = app.slice(app.indexOf("function sdStart()"), app.indexOf("const buFilmKnopf"));
assert.ok(/filmZeigen\(f\.id\)/.test(sd) && /dokOeffnen\("sicherheitskonzept"\)/.test(sd), "Fenster startet Film und PDF");
const dok = /\{ id: "sicherheitskonzept", [^\n]*datei: "([^"]+)", ort: "sicherheit" \}/.exec(app);
assert.ok(dok && fs.existsSync(dok[1]) && fs.statSync(dok[1]).size > 1e5, "PDF Sicherheitskonzept fehlt");
assert.ok(/ort === "sicherheit" \? "start"/.test(app), "‹ Zurück vom PDF führt zur Startseite");
// Info-Laufband: „Deine Daten ???“ führt ins Register Technik zur Kachel (einfache Ansicht → Fenster direkt)
assert.ok(/if \(sdLaufbandOffen\(\)\) add\(\{ id: "sicherheitskonzept", [^\n]*t: "Deine Daten \?\?\?", u: "Infos gefällig\?[^\n]*auf: "sdLaufbandAuf\(\)"/.test(app), "Hinweis im Info-Laufband");
const lb = app.slice(app.indexOf("function sdLaufbandAuf()"), app.indexOf("const buFilmKnopf"));
assert.ok(/register\("programme"\)/.test(lb) && /data-id="datenschutz"/.test(lb) && /classList\.add\("hervor"\)/.test(lb) && /einfach\(\)[^\n]*return sdStart\(\)/.test(lb) && /localStorage\.setItem\(SD_LB/.test(lb), "Antippen: Technik + Kachel zeigen, danach weg");
// KC-CHATS-PRIVAT (30.10.2026): die Regel steht in AGENTS.md und im Sicherheitskonzept
assert.ok(/## Chats sind privat – Agents lesen sie nie \(KC-CHATS-PRIVAT/.test(fs.readFileSync("AGENTS.md", "utf8")), "AGENTS.md: Regel KC-CHATS-PRIVAT fehlt");
console.log("film-hinweis: alle Prüfungen bestanden");
