// 3.13.0 KC-CLUB-ADMIN-QR (Wunsch Hansi 23.11.2026): Kassen- und Mitglieder-QR im Adminbereich – statische Prüfung (offline).
// Aufruf: node tests/admin-qr.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const fall = (n) => server.slice(server.indexOf(`case "${n}": {`), server.indexOf("return json(", server.indexOf(`case "${n}": {`)));
for (const n of ["admin_qr_kassen", "admin_qr_mitglieder"]) {
  assert.ok(server.includes(`case "${n}": {`), `Server-Aktion ${n} fehlt`);
  assert.ok(/^case "[a-z_]+": \{\s+nurAdmin\(ich\);/.test(fall(n)), `${n}: zuerst Admin-Prüfung`);
  assert.ok(app.includes(`api("${n}")`), `App ruft ${n} auf`);
}
assert.ok(/protokoll\(ich\.person_id, "admin_qr_kassen", \{ anzahl:/.test(fall("admin_qr_kassen")), "Kassen-QR-Abruf wird protokolliert (nur Anzahl)");
assert.ok(/from\("kc_stand"\)\.select\("id,name"\)\.eq\("aktiv", true\)/.test(fall("admin_qr_kassen")), "nur aktive Stände");
assert.ok(fall("admin_qr_mitglieder").includes(String.raw`/^KC-\d{3,5}$/.test(x.nummer)`), "nur gültige Mitgliedsnummern");
const qrStart = app.indexOf("KC-CLUB-ADMIN-QR"), qr = app.slice(qrStart, app.indexOf("KC-CLUB-HAENDLERAUSWEIS", qrStart));
assert.ok(!/localStorage|sessionStorage|indexedDB/.test(qr), "Kassen-Codes werden nie auf dem Handy gespeichert");
assert.ok(/function adminQrBlatt\(\) \{\s+if \(!ICH\?\.admin\) return;/.test(qr), "nur für Admins");
assert.ok(app.includes('onclick="adminQrBlatt()">🔳 QR-Codes ›</button>'), "Knopf in der Admin-Zentrale");
assert.ok(/aqMitglied\(\$\{jsArg\(m\.nummer\)\}\)/.test(qr), "Nummer sicher als Argument");
assert.ok(/class="aq-zeile"/.test(qr) && !/class="wlink"/.test(qr), "Mitgliederliste lesbar (nicht .wlink = weiß auf weiß)");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(/\.aq-zeile \{[^}]*color: inherit/.test(html), ".aq-zeile in Textfarbe");
// 3.37.0 KC-CLUB-ADMIN-QR-PSEUDONYM: Pseudonym nur lesen (KC Manager vergibt), anzeigen, suchen, Übersicht
{ const sv = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
  const fall = sv.slice(sv.indexOf('case "admin_qr_mitglieder": {'), sv.indexOf('case "wl_liste": {'));
  assert.ok(/nurAdmin\(ich\);/.test(fall) && /from\("kc_core_operational_directory"\)\.select\("person_id,preferred_name"\)\.eq\("org_id", ORG\)/.test(fall), "Pseudonym aus dem Betriebsverzeichnis, nur Admin");
  assert.ok(!/kc_core_operational_directory"\)\.(update|upsert|insert)/.test(fall), "nur lesen – Pseudonym gehört dem KC Manager");
  assert.ok(/return json\(\{ liste, alle \}\)/.test(fall), "Liste (mit QR) + alle (Übersicht)");
  assert.ok(qr.includes('r("pseudonyme", "🎭 Pseudonyme")') && /function aqPseudonymeHtml\(/.test(qr), "Reiter Pseudonyme");
  assert.ok(/<small class="aq-pseudo">🎭 \$\{esc\(m\.pseudonym\)\}<\/small>/.test(qr) && /🎭 <b>\$\{esc\(m\.pseudonym\)\}<\/b>/.test(qr), "Pseudonym entschärft angezeigt");
  assert.ok(/String\(m\.pseudonym \|\| ""\)\.toLowerCase\(\)\.includes\(q\)/.test(qr), "Suche nach Pseudonym");
  const aqTrifft = new Function(qr.slice(qr.indexOf("const aqTrifft ="), qr.indexOf("function aqListe()")) + "; return aqTrifft;")();
  const m = { name: "Hans Beispiel", nummer: "KC-0007", pseudonym: "Pumuckl" };
  assert.ok(aqTrifft(m, "pumu") && aqTrifft(m, "kc-0007") && aqTrifft(m, "hans") && !aqTrifft(m, "einhorn") && aqTrifft({ name: "X", nummer: "KC-0001", pseudonym: "" }, ""), "Suche"); }
console.log("admin-qr: alle Prüfungen bestanden");
