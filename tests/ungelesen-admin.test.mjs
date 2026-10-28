// KC-CLUB-UNGELESEN-ADMIN (27.10.2026, Wunsch Hansi „Übersicht nur für Admin, welche meiner Chatnachrichten noch nicht gelesen wurden“): statische Prüfung (offline).
// Aufruf: node tests/ungelesen-admin.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs"; // 2.727.0 KC-CLUB-TEILE: app.js + teile/*.js
const app = programmText();
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const s = server.slice(server.indexOf('case "ungelesen_uebersicht": {'), server.indexOf('case "gemerkte_nachrichten": {'));
assert.ok(s.length > 100 && /if \(!ich\.vorstand\) throw new Fehler\("Das ist nur für die Clubleitung\.", 403\);/.test(s), "nur Clubleitung (Klaus, Dieter, Admin)");
assert.ok(/\.eq\("sender_person_id", ich\.person_id\)/.test(s), "nur eigene Nachrichten");
assert.ok(/\[7, 14, 30\]\.includes\(Number\(p\.tage\)\)/.test(s), "Zeitraum 7/14/30 Tage");
assert.ok(/!x\.last_read_at \|\| x\.last_read_at < m\.created_at/.test(s), "gelesen = wie die Häkchen (last_read_at)");
assert.ok(/aktiveMitglieder\(\)/.test(s) && /if \(leute\.has\(x\.person_id\)\)/.test(s), "keine Testpersonen/Ausgetretenen");
assert.ok(!/kc_club_gruppen[^\n]*alle|rundschreiben/i.test(s.replace(/auch Rundschreiben an alle/, "")), "Rundschreiben werden nicht ausgefiltert");
assert.ok(!/ZUGANG_AKTIONEN[\s\S]{0,4000}"ungelesen_uebersicht"/.test(server.slice(0, server.indexOf("const ZUGANG_ERLAUBT"))), "nicht für Gäste/Aushilfen freigeschaltet");
assert.ok(/id="ugKnopf" onclick="ugStart\(\)"/.test(html) && /\$\("ugKnopf"\)\?\.classList\.toggle\("versteckt", !ugDarf\(\)\)/.test(app) && /const ugDarf = \(\) => !!\(ICH\?\.admin \|\| ICH\?\.vorstand\);/.test(app), "Knopf nur für die Clubleitung sichtbar");
assert.ok(/\{ id: "ungelesen_admin", sym: "📭"[^\n]*nur: \(\) => !!ICH\?\.admin \}/.test(app), "Kachel nur für Admin");
assert.ok(/\{ id: "ungelesen_leitung", sym: "📭"[^\n]*nur: \(\) => !!ICH\?\.vorstand && !ICH\?\.admin \}/.test(app.slice(app.indexOf("  mein: ["), app.indexOf("  programme: ["))), "Klaus/Dieter: Kachel unter Meins");
assert.ok(/async function ugStart\(tage\) \{\n  if \(!ugDarf\(\)\) return;/.test(app) && /api\("ungelesen_uebersicht", \{ tage: UG\.tage \}/.test(app), "App fragt den Server");
assert.ok(/"👤 Nach Person"/.test(app) && /"💬 Nach Nachricht"/.test(app) && /<details class="karte" id="ugFilter"/.test(app) && /"⚠️ nur wichtige Nachrichten"/.test(app) && /"👤 nur Einzelchats \(keine Gruppen\)"/.test(app) && /id="ugSuche"/.test(app), "zwei Ansichten + Filter + Suche");
const er = app.slice(app.indexOf("async function ugErinnern("), app.indexOf("async function gemerktZeigen("));
assert.ok(/await direkt\(pid\);/.test(er) && /textVorbelegen\(/.test(er) && !/api\("nachricht_senden"/.test(er), "Erinnern füllt nur vor – gesendet wird erst mit ➤");
console.log("ungelesen-admin: alle Prüfungen bestanden");
