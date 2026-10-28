// KC-CLUB-ABLAGEKORB-EINGANG + KC-CLUB-EINGANG-WEITER (2.743.0, Wunsch Hansi): statische Prüfung (offline).
// Aufruf: node tests/ablagekorb-eingang.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");
const teil = (a, b) => { const i = app.indexOf(a), j = app.indexOf(b, i + 1); assert.ok(i > 0 && j > i, `fehlt: ${a}`); return app.slice(i, j); };
// Ablagekorb: Knopf nur bei Dateien, die ins Archiv passen; „An wen?“; je Datei ein Aufruf mit Eintrag + Datei
assert.ok(/ARCHIV_TYP_OK\(String\(f\.mime \|\| ""\)\.split\(";"\)\[0\]\)\) \? `<button class="knopf klein" onclick="ablkEingang\('\$\{x\.id\}'\)">📥 In Eingangskörbe<\/button>`/.test(app), "Knopf im Ablagekorb");
const eg = teil("function ablkEingang(id)", "async function ablkFertig(");
assert.ok(/zwStart\("ablkEgAn"/.test(eg) && /EINGANG_REGISTER/.test(eg) && /data-ef=/.test(eg), "Dateien, An wen?, Register");
assert.ok(/api\("archiv_eingang_verteilen", \{ personen: ids, ablk: id, anlage: f\.id,/.test(eg) && /letzte: n === dateien\.length - 1/.test(eg), "Server bekommt Eintrag + Datei, Bescheid beim letzten");
assert.ok(/await frage\(/.test(eg) && /ablkFertig\(id, `📥 In die Eingangskörbe:/.test(eg), "Rückfrage, danach erledigt");
// Server: nur Admin, nur Dateien des Eintrags
const sv = server.slice(server.indexOf('case "archiv_eingang_verteilen"'), server.indexOf('case "archiv_eingang_senden"'));
assert.ok(/if \(p\.anlage\) \{\s*nurAdmin\(ich\);\s*const z = await ablkHolen\(p\.ablk\);\s*if \(!ablkIds\(z\)\.includes\(String\(p\.anlage\)\)\) throw/.test(sv), "nur Admin, nur Dateien dieses Eintrags");
assert.ok(/const a = await anlageLesen\(p\.anlage\);/.test(sv) && /async function anlageLesen\(attId: unknown\)/.test(server) && /async function dateiDuplizieren\(ich: Ich, attId: unknown\) \{\s*const a = await anlageLesen\(attId\);/.test(server), "gemeinsames Lesen");
assert.ok(/einmalFotos\(\[String\(attId \|\| ""\)\]\)/.test(server.slice(server.indexOf("async function anlageLesen("))), "Einmal-Fotos bleiben gesperrt");
// Eingangskorb: drucken, per E-Mail, teilen
const z = teil("function egZeigen(", "async function egVorschau(");
assert.ok(/data-w="druck">🖨️ Drucken/.test(z) && /data-w="mail">✉️ Per E-Mail/.test(z) && /data-w="teilen">📤 Teilen/.test(z), "drei Knöpfe");
assert.ok(/arDrucken\(x\)/.test(z) && /arVersenden\(x, "mail"\)/.test(z) && /anlageTeilen\(false\)/.test(z), "vorhandene Wege des Archivs");
assert.ok(/if \(v !== "dokansicht" && \$\("egBlatt"\)\?\.dataset\.pause\)/.test(app), "nach dem Drucken ist das Fenster wieder da");
console.log("ablagekorb-eingang: alle Prüfungen bestanden");
