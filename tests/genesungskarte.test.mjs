// KC-CLUB-GENESUNGSKARTE (2.965.0) · KC-CLUB-GENESUNGSKARTEN (2.967.0, Wunschliste #96) · KC-CLUB-GK-GEMEINSAM (2.967.0)
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const bu = fs.readFileSync(new URL("../teile/buero.js", import.meta.url), "utf8");
const srv = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const mig = fs.readFileSync(new URL("../supabase/migrations/20261116_kc_club_gk_gemeinsam.sql", import.meta.url), "utf8");
const gk = app.slice(app.indexOf("const GK_ROT"), app.indexOf("// KC-CLUB-EINZELCHAT (2.40.0"));
// Baukasten: sechs Motive (Antwort Hansi „ja mit Sonne“), CD-Rahmen, Überschrift/Text/Absender
const ids = [...gk.matchAll(/\{ id: "(\w+)", sym: "[^"]+", name: "[^"]+", texte: \[/g)].map((m) => m[1]);
assert.deepEqual(ids, ["strauss", "maus", "hase", "baer", "suppe", "sonne"], "sechs Motive");
assert.ok(/const GK_ROT = "#741521", GK_BEIGE = "#f3e9dc"/.test(gk) && /"Köcheclub Werne"/.test(gk) && /kc-kochmuetze-weiss\.webp/.test(gk), "Corporate Design: Weinrot/Beige, Kochmütze, Köcheclub Werne");
assert.ok(/maxlength="120"/.test(gk) && /GK\.eigenText = e\.target\.value\.slice\(0, 120\)/.test(gk), "eigener Text bis 120 Zeichen (Antwort Hansi „ja“)");
assert.ok(/const gkAbsender = \(\) => \{[^\n]*return \["Dein Köcheclub"/.test(gk) && /GK = \{ pid, vorname, motiv, titel: 0, text: 0, eigenText: "", von: 0/.test(gk), "Standard-Absender „Dein Köcheclub“");
assert.ok(/function gkUmbruch\(g, text, breite\)/.test(gk), "Zeilen werden umbrochen, Schrift kleiner bei langem Text");
const vorlagen = [...gk.matchAll(/texte: \[([^\]]+)\]/g)].map((m) => m[1]).join(" ");
assert.ok(!/krank|OP\b|Operation|Krankenhaus|Unfall/i.test(vorlagen), "kein Grund auf den Vorlagen (keine Gesundheitsdaten)");
assert.ok(/anlageHochladen\(new File\(\[blob\], name, \{ type: "image\/jpeg" \}\)\)/.test(gk) && /await direkt\(pid\)/.test(gk), "Bild als Chat-Anhang, Chat mit der Person");
assert.ok(!/api\("nachricht_senden"/.test(gk) && !/fetch\(\s*["'`]https?:/.test(gk), "nichts wird automatisch gesendet, kein fremder Dienst");
assert.ok(/\["krankheit", "unfall"\]\.includes\(f\.art\) \? `<button class="mini-kachel" onclick="genesungsKarte\('\$\{f\.person_id\}'\)">/.test(bu), "Freud & Leid: Knopf bei Krankheit/Unfall");
assert.ok(/m\.selbst \? "" : `<button class="knopf" onclick="genesungsKarte\('\$\{m\.person_id\}'\)"><span class="kt-ico">💐<\/span>Gute-Besserung-Karte<\/button>`/.test(app), "beim Mitglied: für alle");
// Gemeinsame Karte
assert.ok(/ICH\?\.admin \|\| ICH\?\.vorstand \? `<button type="button" class="knopf" id="gkGemeinsam">/.test(gk), "Starten nur Clubleitung (App)");
assert.ok(/h\.startsWith\("#gk="\)\) gkGemeinsamOeffnen\(/.test(app), "Push öffnet die Karte zum Unterschreiben");
const fall = srv.slice(srv.indexOf('case "gk_gemeinsam_start"'), srv.indexOf('case "fl_informieren"'));
assert.ok(/if \(!leitung\) throw new Fehler\(/.test(fall), "Starten nur Clubleitung (Server)");
assert.ok(/\.filter\(\(id\) => id !== ich\.person_id && id !== fuer\)/.test(fall) && /\["push", "email"\]/.test(fall), "Push und E-Mail an alle außer der beschenkten Person (2.977.0 KC-CLUB-GK-NACHFRAGE)");
assert.ok(/\.neq\("fuer_person_id", ich\.person_id\)/.test(fall) && /k\.fuer_person_id === ich\.person_id\) throw/.test(fall), "die beschenkte Person sieht nichts");
assert.ok(/k\.gestartet_von !== ich\.person_id && !ich\.admin/.test(fall), "verschicken: Starter oder Admin");
assert.ok(/enable row level security/.test(mig) && /revoke all on public\.kc_club_gk_gemeinsam from public, anon, authenticated/.test(mig) && /kc_neon_resume_tables/.test(mig) && /where status = 'offen'/.test(mig), "Tabellen geschützt, gespiegelt, eine offene Karte je Person");
assert.ok(!/^\s+(grund|krank\w*|diagnose)\s/im.test(mig), "keine Spalte für den Grund");
console.log("genesungskarte: alle Prüfungen bestanden");
