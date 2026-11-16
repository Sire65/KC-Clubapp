// 2.965.0 KC-CLUB-GENESUNGSKARTE (Wunsch Hansi 16.11.2026): Genesungskarte mit Blumenstrauß als Bild in den Chat – aus Freud & Leid und vom Mitglied
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const bu = fs.readFileSync(new URL("../teile/buero.js", import.meta.url), "utf8");
const gk = app.slice(app.indexOf("const GK_TEXTE"), app.indexOf("// KC-CLUB-EINZELCHAT (2.40.0"));
assert.ok(/async function gkZeichnen\(vorname, satz\)/.test(gk) && /"Gute Besserung,"/.test(gk) && /"Köcheclub Werne"/.test(gk) && /kc-kochmuetze-weiss\.webp/.test(gk), "Karte: Gute Besserung, Name, Kochmütze + Köcheclub Werne");
assert.ok(/const ROT = "#741521", BEIGE = "#f3e9dc"/.test(gk), "Weinrot + Beige (Corporate Design)");
assert.ok(!/krank|OP\b|Operation|Krankenhaus/i.test(GK_TEXTE()), "kein Grund auf der Karte (keine Gesundheitsdaten)");
function GK_TEXTE() { return gk.slice(0, gk.indexOf("];") + 2); }
assert.ok(/anlageHochladen\(new File\(\[blob\], name, \{ type: "image\/jpeg" \}\)\)/.test(gk) && /await direkt\(pid\)/.test(gk), "Bild als Chat-Anhang, Chat mit der Person");
assert.ok(!/api\("nachricht_senden"/.test(gk), "nichts wird automatisch gesendet – ➤ tippt man selbst");
assert.ok(!/fetch\(\s*["'`]https?:/.test(gk), "kein fremder Dienst");
assert.ok(/\["krankheit", "unfall"\]\.includes\(f\.art\) \? `<button class="mini-kachel" onclick="genesungsKarte\('\$\{f\.person_id\}'\)">/.test(bu), "Freud & Leid: Knopf bei Krankheit/Unfall");
assert.ok(/m\.selbst \? "" : `<button class="knopf" onclick="genesungsKarte\('\$\{m\.person_id\}'\)"><span class="kt-ico">💐<\/span>Gute-Besserung-Karte<\/button>`/.test(app), "beim Mitglied: für alle");
console.log("genesungskarte: alle Prüfungen bestanden");
