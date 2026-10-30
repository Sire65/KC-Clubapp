// KC-CLUB-DP-EINZELPLAN (30.10.2026, Wunsch Hansi „für jede Person eine Einzelübersicht, Querformat … erst mal nur unter Mein Dienst“):
// Regelzeit je Tag, eigene Dienste, Bereitschaft, eigene Wünsche in Twinkey-Farben, Hinweis auf die Tauschbörse; nur die eigene Zeile.
// Aufruf: node tests/dp-einzelplan.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const fall = server.slice(server.indexOf('case "dp_einzelplan": {'), server.indexOf('case "dp_druck_rechnen": {'));
assert.ok(fall.length > 200, "Server-Aktion vorhanden");
assert.ok(/await nurWennFrei\("dp_einzelplan", ich, "Der Einzelplan"\);/.test(fall), "nur wenn freigegeben");
assert.ok(/const pid = ich\.admin && typeof p\.fuer === "string" && \/\^KC-P-\[A-Z0-9-\]\{1,30\}\$\/\.test\(p\.fuer\) \? p\.fuer : ich\.person_id;/.test(fall), "andere Personen nur für den Admin");
assert.ok(/personen: ich\.admin \?/.test(fall), "Personenliste nur für den Admin");
assert.ok(/dp_einzelplan: \{ t: "📄 Mein Einzelplan \(Dienstplan\)"[^\n]*standard: "admin" \}/.test(server), "Freigabe, zuerst nur Admin");
assert.ok(/"dienst_tausch_aktion", "dp_einzelplan"\]/.test(server) && /"dienst_tausch_aktion", "dp_einzelplan"\]/.test(app), "auch für Aushilfen (Server und App gleich)");
assert.ok(/\$\{frei\("dp_einzelplan"\) \? `<button class="knopf klein" onclick="\$\('mdBlatt'\)\.remove\(\);epStart\(\)">📄 Mein Einzelplan/.test(app), "Knopf unter Mein Dienst");
assert.ok(/einzelplan: \{ titel: "📄 Einzelplan", get optionen\(\) \{ return ICH\?\.admin \? epOptionen : undefined; \}/.test(app), "Druckart, Personenwahl nur Admin");
assert.ok(/return \{ titel: `Einzelplan \$\{d\.name \|\| ""\}`\.trim\(\), ohneRahmen: true, quer: true, html \};/.test(app), "A4 quer");
assert.ok(/<td class="rz">/.test(app) && /<th>Regelzeit<\/th>/.test(app), "Regelzeit-Spalte");
assert.ok(/🔁 <b>Dienst tauschen\?<\/b> In der Club-App gibt es eine <b>Tauschbörse<\/b>/.test(app), "Hinweis Tauschbörse");
// Farben wie in Twinkey/DP2
for (const [k, f] of [["w", "#dbe6f8"], ["k", "#e2f1e6"], ["n", "#fdeec4"], ["dienst", "#7d1727"]]) assert.ok(html.includes(`#druck .ep-tab td.z.${k} { background: ${f}; }`), "Farbe " + k);
assert.ok(/#druck \.ep-tab td\.z\.ber \{ background: repeating-linear-gradient\(45deg, #425b6e/.test(html) && /#druck \.ep-tab td\.z\.s \{ background: repeating-linear-gradient\(135deg, #f7d9d6/.test(html), "Bereitschaft/Sperrzeit");
assert.ok(/--pref: #dbe6f8; --avai: #e2f1e6; --ifn: #fdeec4; --unav: #f7d9d6; --dienst: #7d1727; --ber: #425b6e;/.test(html), "Gesamtplan-Druck mit denselben Farben");
console.log("dp-einzelplan: ok");
