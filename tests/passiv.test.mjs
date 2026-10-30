// KC-CLUB-PASSIV (2.784.0, 30.10.2026, Wunsch Hansi „Fridbert … ist aber weiterhin Mitglied – also passiv; keine Einladungen zu Treffen usw.“).
// Aufruf: node tests/passiv.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), server = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261030_kc_club_passiv.sql");
assert.match(mig, /check \(zugang in \('mitglied', 'aushilfe', 'gast', 'passiv'\)\)/);
assert.match(mig, /values \('KC-P-M0004', 'passiv', now\(\)\)/, "Fridbert passiv");
// Rechte wie ein Mitglied (zugangAus kennt passiv nicht → mitglied), aber nichts von „an alle“
assert.match(server, /const zugangAus = \(r: any\): Zugang => \(r\?\.ist_admin \? "mitglied" : r\?\.zugang === "gast" \|\| r\?\.zugang === "aushilfe" \? r\.zugang : "mitglied"\);/);
assert.ok(server.includes('.in("zugang", ["aushilfe", "gast", "passiv"])') && server.includes('zugangAus(r) !== "mitglied" || r.zugang === "passiv"'), "Sammelversand ohne Passive");
assert.ok(server.includes('["mitglied", "aushilfe", "gast", "passiv"].includes(p.zugang)'), "Admin kann passiv setzen");
assert.ok(server.includes('const mitglieder = alleMg.filter((m) => !passiv.has(m.person_id));'), "Gastgeber-Meldung: Passive nicht offen");
assert.ok(server.includes('.in("zugang", ["gast", "aushilfe", "passiv"]).in("person_id", ziel)'), "Runder Tisch: keine Rundmeldung an Passive");
assert.ok(server.includes('?.zugang === "passiv" ? { passiv: true } : {}'), "Mitgliederliste kennt passiv");
// App: Auswahl, Hinweis in Empfänger-Listen, Teilnehmerliste
assert.ok(app.includes('["passiv", "💤 Passiv", "bleibt Mitglied, App wie bisher'), "Zugang wählbar");
assert.ok(app.includes("m?.passiv ? ' <small class=\"ok-hinweis\">💤 passiv</small>'"), "💤 in Empfänger-Listen");
assert.ok(app.includes("const reihen = MITGLIEDER.filter((m) => !m.passiv || tn.has(m.person_id)).sort("), "Teilnehmerliste ohne Passive");
assert.match(app, /const zugang = \(\) => \(ICH\?\.zugang === "gast" \|\| ICH\?\.zugang === "aushilfe" \? ICH\.zugang : "mitglied"\);/, "Passive sehen die App wie Mitglieder");
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/passiv.test.mjs"), "läuft in der CI");
console.log("passiv: ok");
