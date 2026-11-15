// KC-CLUB-GASTGEBER-16UHR (13.11.2026): Gastgeberin bekommt den Anmeldestand am Vortag ab 16 Uhr, am Tag selbst nur bei Änderung
import fs from "node:fs";
import assert from "node:assert/strict";
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const g = server.slice(server.indexOf("async function gastgeberStandLauf()"), server.indexOf("async function gastgeberMitteilen("));
assert.match(g, /heuteAbend = std >= 16,/, "Vortag ab 16 Uhr");
assert.match(g, /const vorabendFaellig = !war\("vorabend"\) && heuteAbend && berlinTag\(new Date\(t\.beginn\)\) === morgen;/, "einmal am Vortag");
assert.match(g, /else if \(zweiStd\) stufe = aenderungen\.length \|\| altVorabend \? "2std" : "2std_ruhig";/, "am Tag selbst nur bei Änderung");
assert.match(g, /sendenGewaehlt\("club_erinnerung", \[t\.gastgeber_person_id\], \["push", "email"\]/, "Push und E-Mail an die Gastgeberin");
assert.match(server, /Am Vortag um 16 Uhr bekommst du den genauen Stand/);
assert.match(server, /await gastgeberStandLauf\(\)\.catch/, "läuft im 15-Minuten-Takt");
console.log("gastgeber-16uhr: ok");
