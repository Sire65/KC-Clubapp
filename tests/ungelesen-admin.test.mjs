// KC-CLUB-UNGELESEN-ADMIN (27.10.2026, Wunsch Hansi „Übersicht nur für Admin, welche meiner Chatnachrichten noch nicht gelesen wurden“): statische Prüfung (offline).
// Aufruf: node tests/ungelesen-admin.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const s = server.slice(server.indexOf('case "ungelesen_uebersicht": {'), server.indexOf('case "gemerkte_nachrichten": {'));
assert.ok(s.length > 100 && /nurAdmin\(ich\);/.test(s), "nur Admin");
assert.ok(/\.eq\("sender_person_id", ich\.person_id\)/.test(s), "nur eigene Nachrichten");
assert.ok(/\[7, 14, 30\]\.includes\(Number\(p\.tage\)\)/.test(s), "Zeitraum 7/14/30 Tage");
assert.ok(/!x\.last_read_at \|\| x\.last_read_at < m\.created_at/.test(s), "gelesen = wie die Häkchen (last_read_at)");
assert.ok(/aktiveMitglieder\(\)/.test(s) && /if \(leute\.has\(x\.person_id\)\)/.test(s), "keine Testpersonen/Ausgetretenen");
assert.ok(!/kc_club_gruppen[^\n]*alle|rundschreiben/i.test(s.replace(/auch Rundschreiben an alle/, "")), "Rundschreiben werden nicht ausgefiltert");
assert.ok(!/ZUGANG_AKTIONEN[\s\S]{0,4000}"ungelesen_uebersicht"/.test(server.slice(0, server.indexOf("const ZUGANG_ERLAUBT"))), "nicht für Gäste/Aushilfen freigeschaltet");
assert.ok(/id="ugKnopf" onclick="ugStart\(\)"/.test(html) && /\$\("ugKnopf"\)\?\.classList\.toggle\("versteckt", !ICH\?\.admin\)/.test(app), "Knopf nur für Admin sichtbar");
assert.ok(/\{ id: "ungelesen_admin", sym: "📭"[^\n]*nur: \(\) => !!ICH\?\.admin \}/.test(app), "Kachel nur für Admin");
assert.ok(/async function ugStart\(tage\) \{\n  if \(!ICH\?\.admin\) return;/.test(app) && /api\("ungelesen_uebersicht", \{ tage: UG\.tage \}/.test(app), "App fragt den Server");
assert.ok(/"👤 Nach Person"/.test(app) && /"💬 Nach Nachricht"/.test(app) && /"⚠️ nur wichtige"/.test(app) && /"👤 nur Einzelchats"/.test(app) && /id="ugSuche"/.test(app), "zwei Ansichten + Filter + Suche");
const er = app.slice(app.indexOf("async function ugErinnern("), app.indexOf("async function gemerktZeigen("));
assert.ok(/await direkt\(pid\);/.test(er) && /textVorbelegen\(/.test(er) && !/api\("nachricht_senden"/.test(er), "Erinnern füllt nur vor – gesendet wird erst mit ➤");
console.log("ungelesen-admin: alle Prüfungen bestanden");
