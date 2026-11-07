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
  assert.ok((/aemter/.test(fuer) || /^(false|true) \}/.test(fuer) || /^filmGesehen\("[a-z]+"\) \|\| heuteIso\(\) >= [A-Z_]+ \}/.test(fuer)) && !/person_id|vorname|name ===/.test(fuer), `${id}: Zielgruppe nach Amt (oder false = kein Start-Hinweis, true = alle Mitglieder), nicht nach Person`); // 2.756.0; KC-CLUB-ANSICHTFILM: true = alle
}
assert.ok(sw.includes('url.pathname.includes("/film/")) return;'), "Service Worker muss film/ auslassen");
// Start-Fenster: nach den anderen Start-Fenstern, drei Wahlmöglichkeiten, direkter Start des Films
assert.ok(/setTimeout\(startHinweisPruefen, 2500\); setTimeout\(filmHinweisPruefen, 4000\);/.test(app), "Film-Hinweis beim Start");
const pr = app.slice(app.indexOf("async function filmHinweisPruefen"), app.indexOf("function filmZeigen"));
assert.ok(/FENSTER_OFFEN \+ ", \.dlg, #rgSchicht, #filmSchicht/.test(pr) && /aktuelleAnsicht !== "start"/.test(pr), "erst wenn nichts anderes offen ist"); // 2.789.0 KC-CLUB-EINGABE-RUHE: FENSTER_OFFEN = .blatt:not(.versteckt) + offene Dienstwünsche
assert.ok(/▶ Film jetzt ansehen/.test(pr) && /⏰ Später/.test(pr) && /Nein, danke/.test(pr), "drei Knöpfe");
assert.ok(/if \(wahl === "an"\) return filmZeigen\(f\.id\);/.test(pr), "Ansehen startet den Film direkt");
assert.ok(/filmMerken\(f\.id, "nein"\)/.test(pr) && !/filmMerken\(f\.id, "spaeter"\)/.test(pr), "Später wird nicht gemerkt (fragt wieder)");
const zg = app.slice(app.indexOf("function filmZeigen"), app.indexOf("function filmWahl"));
assert.ok(/<video src=/.test(zg) && /controls autoplay playsinline/.test(zg) && /v\.ontimeupdate = \(\) => \{ if \(!lang && \(v\.currentTime \|\| 0\) >= FILM_KURZ_S\) \{ lang = true; filmMerken\(f\.id, "angesehen"\); \} \};/.test(zg), "Abspieler (2.879.0: angesehen erst ab 60 s, siehe film-kurz.test.mjs)");
assert.ok(/✕ Schließen/.test(zg) && /v\.onerror/.test(zg), "Schließen und Fehlermeldung");
assert.ok(/#filmSchicht \{ position: fixed/.test(html), "Abspiel-Schicht gestaltet");
// Büro: Knopf in Raum- und Listenansicht
assert.ok(/buIkon\("💼", "Tasche", "atStart\(\)", "Aktentasche"\) : "",\s+buFilmKnopf\(\),/.test(app) && /buKopfKnoepfe\(true, naechst\)/.test(app) && /buKopfKnoepfe\(false, null\)/.test(app), "🎬 Anleitung im Büro (Raum + Liste) – 2.768.0 als Icon-Knopf im gemeinsamen Kopf");
// Server: Einstellung „filme“ nur mit geprüften Werten
const e = server.slice(server.indexOf("  filme: (w) =>"), server.indexOf("  rundgang: (w) =>"));
assert.ok(/\^\[a-z\]\{2,24\}\$/.test(e) && /\["angesehen", "ende", "nein", "kurz"\]/.test(e) /* 2.879.0 KC-CLUB-FILM-KURZ */ && /slice\(0, 30\)/.test(e), "Server-Einstellung filme geprüft");
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
// KC-CLUB-ANSICHTFILM (02.11.2026, Anregung Clubsitzung „die App ist zu voll“): für alle beim Start, oben in den Erklär-Videos, Zuschauer nur für den Admin
assert.ok(/\{ id: "ansichtfilm", sym: "🧹", [^\n]*datei: "film\/app-selbst-einrichten\.mp4/.test(reg) && /wo: "unter Technik → 🎬 Erklär-Videos", inVideos: true, fuer: \(\) => true \}/.test(reg), "Ansichtfilm in FILME (alle, in den Erklär-Videos)");
assert.ok(/\(f\.fuer\(\) && !f\.wo\) \|\| ICH\.admin/.test(app), "Filme mit eigenem Ort stehen nicht im Büro");
assert.ok(/\$\{f\.wo \|\| "im Büro oben unter 🎬 Film"\}/.test(pr), /* 2.855.0: Knopf heißt seit 2.768.0 „🎬 Film“ */ "Meldung nennt den richtigen Ort des Films");
assert.ok(/v\.onended = \(\) => \{ ende\(true\); filmMerken\(f\.id, "ende"\);/.test(zg), "bis zum Ende dauerhaft gemerkt");
assert.ok(/if \(wie === "angesehen" && vorher === "ende"\) return;/.test(app) /* 2.879.0: „vorher“ = gemerkter Stand */, "„ende“ wird durch erneutes ▶ nicht überschrieben");
const zu = app.slice(app.indexOf("async function filmZuschauer"), app.indexOf("function filmWahl"));
assert.ok(/!ICH\?\.admin\) return/.test(zu) && /api\("film_zuschauer"/.test(zu) && /meldeFehler\(e\)/.test(zu), "Zuschauer-Liste nur Admin, Fehler sichtbar (Regel 11)");
const vi = fs.readFileSync("teile/videos.js", "utf8");
assert.ok(/FILME : \[\]\)\.filter\(\(f\) => f\.inVideos\)/.test(vi) && /filmZeigen\(/.test(vi) && /ICH\?\.admin \? `<button[^`]*filmZuschauer\(/.test(vi), "Film oben in den Erklär-Videos, 👀 nur Admin");
const fz = server.slice(server.indexOf('case "film_zuschauer"'), server.indexOf('case "spur_liste"'));
assert.ok(/nurAdmin\(ich\)/.test(fz) && /\^\[a-z\]\{2,24\}\$/.test(fz) && /eq\("schluessel", "filme"\)/.test(fz) && !/nachricht|chat|inhalt/i.test(fz.replace(/keine Inhalte/, "")), "Server film_zuschauer: nur Admin, nur Einstellung „filme“ (Regel 19)");
// KC-CLUB-KOPFFILM (04.11.2026): eigener Film über den Kopfbereich, für alle, in den Erklär-Videos – ohne Admin-Bereich
assert.ok(/\{ id: "kopffilm", sym: "🧭", t: "Der Kopf der Club-App", [^\n]*datei: "film\/kopf-der-app\.mp4/.test(reg) && /wo: "unter Technik → 🎬 Erklär-Videos", get inVideos\(\) \{ return this\.fuer\(\); \}, fuer: \(\) => filmGesehen\("ansichtfilm"\) \|\| heuteIso\(\) >= KOPFFILM_AB \}/.test(reg), "Kopffilm in FILME, gestaffelt");
// gestaffelt: erst wer den Ansichtfilm gesehen hat (nicht „Nein, danke“), alle anderen ab KOPFFILM_AB
assert.ok(/const KOPFFILM_AB = "\d{4}-\d{2}-\d{2}"/.test(app) && /const filmGesehen = \(id\) => \["angesehen", "ende"\]\.includes\(INIT\?\.einstellungen\?\.filme\?\.\[id\]\?\.wie\)/.test(app), "Kopffilm gestaffelt");
{ // Verhalten durchspielen
  const fuer = (wie, heute) => { const INIT = { einstellungen: { filme: wie ? { ansichtfilm: { wie, z: "2026-11-02T08:00:00Z" } } : {} } }, heuteIso = () => heute, KOPFFILM_AB = /const KOPFFILM_AB = "([^"]+)"/.exec(app)[1];
    const filmGesehen = (id) => ["angesehen", "ende"].includes(INIT?.einstellungen?.filme?.[id]?.wie); return filmGesehen("ansichtfilm") || heuteIso() >= KOPFFILM_AB; };
  assert.ok(fuer("ende", "2026-11-04") && fuer("angesehen", "2026-11-04") && !fuer(null, "2026-11-04") && !fuer("nein", "2026-11-07") && fuer(null, "2026-11-08") && fuer("nein", "2026-11-09"), "Kopffilm: Staffelung");
}
assert.ok(!/admin/i.test(reg.slice(reg.indexOf('id: "kopffilm"'), reg.indexOf("];", reg.indexOf('id: "kopffilm"')))), "Kopffilm: kein Admin-Bereich");
console.log("film-hinweis: alle Prüfungen bestanden");
