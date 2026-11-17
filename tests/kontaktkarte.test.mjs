// KC-CLUB-KONTAKTKARTE (Wunsch Hansi 17.11.2026: „In den Stammdaten der Mitglieder einen Button, um eine Kontaktkarte zu erstellen und dann anbieten:
// per Nachricht versenden, in den Archivordner, per WhatsApp schicken, an den Kalender bzw. Kontakte senden usw.“). Aufruf: node tests/kontaktkarte.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const stueck = (a, b) => { const i = app.indexOf(a); assert.ok(i >= 0, a); return app.slice(i, app.indexOf(b, i)); };
// ein Knopf auf der Mitgliedsseite statt zwei
assert.ok(app.includes(`'<button class="knopf" onclick="kkMenue()"><span class="kt-ico">📇</span>Kontaktkarte</button>'`), "Knopf 📇 Kontaktkarte");
assert.ok(!/onclick="kwExtern\(\)"><span class="kt-ico">📤/.test(app) && !/onclick="kontaktSpeichern\(\)"><span class="kt-ico">📇<\/span>Ins Telefonbuch/.test(app), "die zwei alten Knöpfe sind im neuen Fenster");
const menue = stueck("function kkMenue()", "async function kkAussen(");
for (const f of ["kontaktSpeichern()", "kkArchiv()", "kkGeburtstag()", "kkChatWahl()", "kkAussen('whatsapp')", "kkAussen('mail')", "kkAussen('teilen')", "kkAussen('kopieren')"]) assert.ok(menue.includes(f), f);
assert.ok(/aussen = mitglied && \(m\.person_id === ICH\?\.person_id \|\| m\.extern\) && \(m\.externFelder \|\| \[\]\)\.some/.test(menue), "nach außen nur mit Freigabe des Mitglieds");
// nach außen: Server prüft und protokolliert, auch WhatsApp; nur freigegebene Felder
const aus = stueck("async function kkAussen(", "async function kkArchiv(");
assert.ok(/m\.externFelder \|\| \[\]/.test(aus) && /api\("kontakt_weitergeben", \{ person_id: m\.person_id, weg: "whatsapp", felder \}\)/.test(aus), "WhatsApp: nur freigegebene Angaben, vermerkt");
assert.ok(/\["teilen", "mail", "kopieren", "whatsapp"\]\.includes\(String\(p\.weg\)\)/.test(server), "Server kennt den Weg WhatsApp");
assert.ok(/return kwSendenMit\(weg, felder\)/.test(aus), "E-Mail/Teilen/Kopieren wie bisher (Server prüft vorher)");
// im Club: als Kontaktkarte in einen Chat
assert.ok(/api\("nachricht_senden", \{ id, kontakt: m\.person_id, wege: \["push"\] \}/.test(app), "Kontaktkarte in einen Chat");
// Archiv
assert.ok(/kontakt: \{ sym: "📇", register: \["Kontakte", "Sonstiges"\], stichworte: "Kontakt" \}/.test(app) && /archivAblageFragen\("kontakt"/.test(app), "Archivordner");
// vCard mit Geburtstag, Kalender jährlich
const vc = stueck("function kwVcard(", "function kwText(") + stueck("function kkVcard(", "function kkMenue()");
const R = new Function("nurZiffern", "KW_NAMEN", vc + "; return { kkVcard, kkDatei };")((t) => String(t).replace(/[^\d+]/g, ""), { handy: 1, festnetz: 1, mail: 1, adresse: 1 });
const v = R.kkVcard({ name: "Erika Muster", geburtstag: "03-15", kontakt: { handy: "0171 123", mail: "e@x.de" } });
assert.match(v, /^BEGIN:VCARD\r\n/); assert.match(v, /TEL;TYPE=CELL:0171123/); assert.match(v, /EMAIL:e@x\.de/); assert.match(v, /\r\nBDAY:--0315\r\nEND:VCARD$/);
assert.doesNotMatch(R.kkVcard({ name: "A B", kontakt: {} }), /BDAY/, "ohne freigegebenen Geburtstag kein Geburtstag");
assert.equal(R.kkDatei({ name: "Erika Muster" }), "Erika Muster.vcf");
const gb = stueck("function kkGeburtstag()", "async function kkChatWahl(");
assert.ok(/RRULE:FREQ=YEARLY/.test(gb) && /DTSTART;VALUE=DATE:/.test(gb), "Geburtstag jedes Jahr, ganztägig");
console.log("✅ kontaktkarte: alle Prüfungen bestanden");
