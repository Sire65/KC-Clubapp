// KC-CLUB-NUTZUNG-ALLE (2.829.0, Wunsch #73 Hansi): „📈 So nutzen wir die App“ für alle Mitglieder – nur Summen, nie Personen oder Inhalte.
// Aufruf: node tests/nutzung-alle.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8"), teil = fs.readFileSync("teile/nutzung.js", "utf8"), sw = fs.readFileSync("sw.js", "utf8");
const mig = fs.readFileSync("supabase/migrations/20261103_kc_club_app_statistik.sql", "utf8");
// Datenbank: nur Summen, nur über den Server
assert.ok(/count\(distinct person_id\)/.test(mig) && !/'person_id',|jsonb_build_object\('person/.test(mig), "Personen nur gezählt, nie ausgegeben");
assert.ok(!/\bbody\b/.test(mig), "Nachrichten nur gezählt – nie der Text (KC-CHATS-PRIVAT)");
assert.ok(/revoke all on function public\.kc_club_app_statistik\(int, text\) from public, anon, authenticated;/.test(mig), "nicht von außen aufrufbar");
// Server: nur Mitglieder, „von wie vielen“ erst ab 3, keine Versions-Einzelheiten
const s = server.slice(server.indexOf('case "nutzung_alle"'), server.indexOf('case "nutzung_statistik"'));
assert.ok(/ich\.zugang !== "mitglied"\) throw/.test(s) && /\[7, 30, 90\]\.includes/.test(s), "nur Mitglieder, feste Zeiträume");
assert.ok(/x\.geraete >= NUTZUNG_ALLE_MIN/.test(s) && /const NUTZUNG_ALLE_MIN = 3;/.test(server), "kleine Gruppen nicht erkennbar");
assert.ok(/const \{ version: _v, \.\.\.rest \} = data/.test(s), "App-Version nicht an Mitglieder");
// App: eigenes Nachlade-Teil, Kachel unter Technik, Hilfe
assert.ok(/nutzung: \{ einstieg: \["nuStart"\], sri: "sha384-/.test(app) && /nutzung: "/.test(sw), "Teil mit Fingerabdruck und im Offline-Speicher");
assert.ok(/\{ id: "nutzung_alle", sym: "📈", t: "So nutzen wir die App",[^\n]*aktion: "nuStart\(\)"/.test(app), "Kachel unter Technik");
assert.ok(/id: "nutzung_alle", thema: "technik"/.test(app) && /nuBlatt: "📈 So nutzen wir die App"/.test(app), "Hilfe und Fenstername");
for (const f of ["nuWannHtml", "nuTageHtml", "nuVersandHtml", "nuBereicheHtml", "nuGeraeteHtml", "nuPfeil"]) assert.ok(teil.includes(`function ${f}(`), f);
// Pfeil-Rechnung echt
const pf = new Function(teil.slice(teil.indexOf("function nuPfeil"), teil.indexOf("function nuHtml")) + "\nreturn nuPfeil;")();
assert.equal(pf(10, 0), "", "ohne Vergleichswert kein Pfeil (nicht „unendlich“)");
assert.match(pf(150, 100), /↑ 50 %/); assert.match(pf(50, 100), /↓ 50 %/);
console.log("nutzung-alle: alle Prüfungen bestanden");
