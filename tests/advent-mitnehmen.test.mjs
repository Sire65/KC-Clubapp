// KC-CLUB-ADVENT-MITNEHMEN (Wunsch Hansi 28.11.2026): Tagesliste „🎒 Mitnehmen zum Markt“ – für Hansis Dienste am Weihnachtsmarkt, wer zur selben Zeit
// Dienst hat und welche gemeldeten Süßigkeiten noch nicht übergeben sind; „übergeben“ abhaken. Nur Admin, keine neue Tabelle.
// Aufruf: node tests/advent-mitnehmen.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const js = programmText(), srv = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const fall = srv.slice(srv.indexOf('case "advent_mitnehmen": case "advent_uebergeben": {'), srv.indexOf('case "advent_gadget_stand": case "advent_gadget_mitmachen": {'));
assert.ok(fall.length > 500, "Server-Fall vorhanden");
assert.ok(/if \(!ich\.admin\) throw new Fehler\("Nur für den Admin\.", 403\);/.test(fall), "nur Admin");
assert.ok(/\.eq\("person_id", ich\.person_id\)\.eq\("status", "published"\)/.test(fall) && /dtUebergaben\(\{ ab: heute \}, ich\.person_id\)/.test(fall), "eigene Dienste aus dem Dienstplan inkl. Tausch");
assert.ok(/ich2\.some\(\(m: any\) => ueberlappt\(m, z\)\)/.test(fall), "nur wer zur selben Zeit Dienst hat");
assert.ok(/if \(uebergeben\[`\$\{x\.person_id\}\|\$\{x\.tag\}`\]\) continue;/.test(fall), "schon übergebene fehlen");
assert.ok(/schluessel: "advent_uebergeben"/.test(fall) && !/create table/.test(fall), "übergeben in kc_club_konfig, keine neue Tabelle");
assert.ok(/startsWith\("KC-P-TEST"\)/.test(fall), "Testpersonen nicht mitzählen");
// Überlappung (gleiche Logik wie im Server)
const min = (x) => { const [h, m] = String(x || "").split(":").map(Number); return Number.isFinite(h) ? h * 60 + (m || 0) : null; };
const ueberlappt = new Function("min", "return " + fall.match(/const ueberlappt = (\(a1: any, b1: any\) => \{[\s\S]*?\};)/)[1].replace(/: any/g, "").replace(/;$/, ""))(min);
assert.equal(ueberlappt({ start_time: "10:00", end_time: "14:00" }, { start_time: "13:00", end_time: "18:00" }), true, "überschneidend");
assert.equal(ueberlappt({ start_time: "10:00", end_time: "14:00" }, { start_time: "14:00", end_time: "18:00" }), false, "direkt danach: nicht gleichzeitig");
assert.equal(ueberlappt({ start_time: "17:00", end_time: "01:00" }, { start_time: "22:00", end_time: "23:00" }), true, "über Mitternacht");
// Liste fürs Weihnachtsessen markiert Übergebenes
assert.ok(/uebergeben: ueb\[`\$\{x\.person_id\}\|\$\{x\.tag\}`\]/.test(srv) && /x\.uebergeben \? " ✅ schon übergeben" : ""/.test(js), "Wer bekommt was: schon übergeben markiert");
// App: Knopf nur für Admin, Abhaken
assert.ok(/\$\{ICH\?\.admin \? `<button type="button" class="knopf ak-fach" onclick="akMitnehmen\(\)">🎒 Mitnehmen zum Markt<\/button>` : ""\}/.test(js), "Knopf nur Admin");
assert.ok(/api\("advent_mitnehmen", \{\}, \{ warten: true \}\)/.test(js) && /api\("advent_uebergeben", \{ person_id: pid, tag, an: box\.checked \}/.test(js), "Liste laden + abhaken");
assert.ok(/akMitBlatt: "🎒 Mitnehmen zum Markt"/.test(js) && /akMitBlatt: \(\) => akMitnehmen\(\)/.test(js), "Fenstername und Wiederöffnen");
console.log("advent-mitnehmen: ok");
