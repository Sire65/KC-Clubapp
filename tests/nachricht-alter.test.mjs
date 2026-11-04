// KC-CLUB-NACHRICHT-ALTER (2.800.0, Wunsch #61 Hansi): statische Prüfung (offline).
// Aufruf: node tests/nachricht-alter.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync("index.html", "utf8"), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");
// Server: vorhandener Baustein (kc_club_nachricht_mahnung) mit den Grenzen 2 und 4 Tage – unbekannt bleibt unbekannt
assert.ok(/const MAHNUNG_STUFE_TAGE = \[2, 4\];/.test(server), "Grenzen 2 und 4 Tage an einer Stelle");
assert.ok(/const a2 = offen\.length \? await mahnungPaket\(ich\.person_id, thr, vor\(MAHNUNG_STUFE_TAGE\[0\]\)\) : null;/.test(server) && /const a4 = a2\?\.alt \? await mahnungPaket\(ich\.person_id, thr, vor\(MAHNUNG_STUFE_TAGE\[1\]\)\) : null;/.test(server), "derselbe Baustein, höchstens 2 Abfragen");
assert.ok(/const stufe = !offen\.length \|\| !a2 \? null : !a2\.alt \? "gruen" : !a4 \? null : a4\.alt \? "rot" : "orange";/.test(server), "Fehler → keine Stufe (nie geraten)");
assert.ok(/return \{ alt: pk\.alt, wichtig: pk\.wichtig, tage: MAHNUNG_TAGE, stufe \};/.test(server), "Stufe geht mit der Mahnung an die App");
// App: Knopf „Nachrichten“ bekommt die Klasse, nur mit sicherer Zahl
const z = app.slice(app.indexOf("function zaehlerZeigen()"), app.indexOf("function zaehlerZeigen()") + 1500);
// 2.849.0 KC-CLUB-NACHRICHT-BLINKEN: Stufe unbekannt → grün (vorher: gar nicht); unsichere Zahl → kein Blinken
assert.ok(/const st = n && !unsicher \? \(NACHRICHT_STUFEN\.includes\(INIT\?\.nachrichtMahnung\?\.stufe\) \? INIT\.nachrichtMahnung\.stufe : "gruen"\) : null/.test(z) && /fk\.classList\.toggle\("alt-" \+ x, st === x\)/.test(z), "Klasse je Stufe, unbekannt grün, unsicher keine");
assert.ok(app.includes('NACHRICHT_STUFEN.forEach((x) => k.classList.toggle("na-" + x, st === x))'), "Kachel blinkt wie der Knopf");
// Aussehen: grün / orange / rot, blinkt; aus bei „Animierte Knöpfe“ aus; Strom-Ruhe hält alle Animationen an
for (const k of ["alt-gruen", "alt-orange", "alt-rot"]) assert.ok(html.includes(`.fuss-leiste button.${k}`), k);
assert.ok(/@keyframes nachrichtAlter/.test(html) && /\.ohne-anim \.fuss-leiste button\[class\*="alt-"\] \{ animation: none;/.test(html), "blinkt, ohne Animation steht der Rahmen");
console.log("nachricht-alter: alle Prüfungen bestanden");
