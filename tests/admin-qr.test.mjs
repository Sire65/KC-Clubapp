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
console.log("admin-qr: alle Prüfungen bestanden");
