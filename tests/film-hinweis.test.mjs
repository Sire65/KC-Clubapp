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
  assert.ok(fs.existsSync(datei) && fs.statSync(datei).size > 1e6, `Film fehlt: ${datei}`);
  assert.ok(fs.existsSync(bild), `Vorschaubild fehlt: ${bild}`);
  assert.ok(datei.startsWith("film/") && bild.startsWith("film/"), `${id}: Film gehört nach film/ (Service Worker lässt film/ aus)`);
  assert.ok(/aemter/.test(fuer) && !/person_id|vorname|name ===/.test(fuer), `${id}: Zielgruppe nach Amt, nicht nach Person`);
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
assert.equal((app.match(/onclick="atStart\(\)">💼 Aktentasche<\/button>' : ""\}\$\{buFilmKnopf\(\)\}/g) || []).length, 2, "🎬 Anleitung im Büro (Raum + Liste)");
// Server: Einstellung „filme“ nur mit geprüften Werten
const e = server.slice(server.indexOf("  filme: (w) =>"), server.indexOf("  rundgang: (w) =>"));
assert.ok(/\^\[a-z\]\{2,24\}\$/.test(e) && /\["angesehen", "nein"\]/.test(e) && /slice\(0, 30\)/.test(e), "Server-Einstellung filme geprüft");
console.log("film-hinweis: alle Prüfungen bestanden");
