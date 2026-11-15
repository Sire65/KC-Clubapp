// 2.953.0 KC-CLUB-AENDERUNG-ERBITTEN (Wunsch Hansi 15.11.2026, Fall Christina „neue Handynummer“): Admin bittet um eine Änderungsmeldung,
// das Mitglied bekommt beim Start eine Nachricht mit „✏️ Sofort erledigen“; nach dem Melden entfällt die Bitte von selbst.
// Aufruf: node tests/aenderung-erbitten.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
// Server: nur Admin, nur bekannte Arten, leere Liste = zurücknehmen; nach dem Melden wird die Art gestrichen
const c = server.slice(server.indexOf('case "aenderung_erbitten": {'), server.indexOf('case "ansage_vorgabe_setzen": {'));
assert.ok(/nurAdmin\(ich\);/.test(c) && /aktiveMitglieder\(\)/.test(c), "nur Admin, nur aktive Mitglieder");
assert.ok(/schluessel: "aenderung_bitte"/.test(c) && /\.delete\(\)\.eq\("person_id", an\)\.eq\("schluessel", "aenderung_bitte"\)/.test(c), "setzen und zurücknehmen");
assert.ok(/aenderung_bitte: \(w\) => \(\{ arten: [^\n]*AENDERUNG\.arten\.some\(\(a\) => a\.id === id && !\(a as any\)\.aus\)\)/.test(server), "nur bekannte, nicht abgeschaltete Arten");
const senden = server.slice(server.indexOf('case "aenderung_senden": {'), server.indexOf('case "aenderung_zurueckziehen": {'));
assert.ok(/filter\(\(x: string\) => x !== art\.id\)/.test(senden) && /schluessel", "aenderung_bitte"\)/.test(senden), "Bitte erledigt sich mit der Meldung");
// App: Admin-Knopf beim Mitglied, Start-Nachricht mit Sofort-Knopf, Formular gleich bei der richtigen Art
assert.ok(/ICH\?\.admin && !m\.selbst \? `<button class="knopf" onclick="aeErbitten\(/.test(app), "Knopf „Änderung erbitten“ nur für den Admin");
const f = app.slice(app.indexOf("async function aeBittePruefen() {"), app.indexOf("function aeZeichnen() {"));
for (const t of ["Hallo ${esc(ICH.vorname", "bitte melde ${liste}", "✏️ Sofort erledigen", "⏰ Später", "Hat sich nichts geändert"]) assert.ok(f.includes(t), `Text fehlt: ${t}`);
assert.ok(/if \(was === "jetzt"\) return aeStart\(arten\[0\]\);/.test(f), "Sofort → Formular der erbetenen Art");
assert.ok(/AE\.art = typeof vorwahl === "string" && AE\.d\.arten\.some/.test(app), "aeStart springt direkt zur Art");
assert.ok(/lsLesen\("kc_club_ae_bitte"\) === heute/.test(f) && /FENSTER_OFFEN \+ ", \.dlg, \.dlg-blatt, #rgSchicht"/.test(f), "einmal am Tag, nicht über anderen Fenstern");
assert.ok(/setTimeout\(aeBittePruefen, 9000\)/.test(app), "beim Start eingeplant");
assert.ok(/\["handy", "📱", "Neue Handynummer", "deine neue Handynummer"\]/.test(app) && /\["name", "🪪", "Neuer Name", "deinen neuen Namen"\]/.test(app), "richtige Satzteile");
console.log("aenderung-erbitten: ok");
