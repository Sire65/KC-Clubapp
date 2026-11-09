// KC-CLUB-KONTAKT-EXTERN (Wunsch Hansi 09.11.2026: „Kontakt weiterleiten auch zu Fremden, z. B. durch Push, E-Mail, Postfach usw.“ – „Wie vorgeschlagen,
// 2. Nein (keine Benachrichtigung an das Mitglied), alles andere ja“). Aufruf: node tests/kontakt-extern.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), server = lies("supabase/functions/kc-club/index.ts"), html = lies("index.html");

// --- Server: Schalter Standard aus, Prüfung, Protokoll ohne Empfänger ---
assert.match(server, /kontakt_extern: \(w\) => \(\{ an: w\?\.an === true \}\)/, "Schalter: Standard aus");
const fall = server.slice(server.indexOf('case "kontakt_weitergeben": {'), server.indexOf('case "kontakt_freigabe": {'));
assert.ok(fall.length > 100, "Aktion kontakt_weitergeben fehlt");
assert.match(fall, /ich\.zugang !== "mitglied"/, "nur Mitglieder");
assert.match(fall, /kontakt_extern/, "prüft die Erlaubnis des Mitglieds");
assert.match(fall, /"kontakt_" \+ f/, "prüft jedes Feld gegen die Freigabe");
assert.match(fall, />= 30/, "höchstens 30 am Tag");
assert.match(fall, /protokoll\(ich\.person_id, "kontakt_weitergegeben", \{ fuer: pid, weg, felder \}\)/, "Protokoll: nur wer, wessen, Weg, Felder");
assert.doesNotMatch(fall, /routerSenden|pushSenden|benachrichtig/i, "keine Benachrichtigung an das Mitglied (Hansi: 2. Nein)");
assert.doesNotMatch(fall, /empfaenger|an_mail|adresse_an/i, "kein Empfänger im Protokoll");
assert.match(server, /extern: selbst \|\| mdEinst\.kontakt_extern\?\.an === true/, "mitglied_details meldet die Erlaubnis");
assert.match(server, /externFelder: Object\.keys\(kontakt\)\.filter\(\(f\) => selbst \|\| frei\("kontakt_" \+ f\)\)/, "auch der Admin gibt nur freigegebene Felder weiter");

// --- App: Knopf, Blatt, Wege, ausgegraut ---
assert.match(app, /zugang\(\) === "mitglied" \? '<button class="knopf" onclick="kwExtern\(\)">/, "Knopf nur für Mitglieder");
assert.match(app, /kwxBlatt: "📤 Kontakt weiterleiten"/, "Fenstername");
assert.match(app, /ir-aus" aria-disabled="true"/, "nicht erlaubte Knöpfe ausgegraut");
assert.match(app, /teilenMitRueckfall\(\{ files: \[f\], title: m\.name, text \}\)/, "Teilen-Menü mit Kontaktkarte");
assert.match(app, /mailto:\?subject=/, "E-Mail über das Mail-Programm");
assert.match(app, /api\("kontakt_weitergeben"/, "Server prüft vor dem Weitergeben");
assert.match(html, /id="setKontaktExtern" onchange="kontaktExternSetzen\(this\.checked\)"/, "Schalter unter ⚙️ Privatsphäre");
assert.match(app, /id: "kontakt_extern", thema: "privat"/, "Hilfe-Eintrag");

// --- vCard und Text: nur angekreuzte Felder ---
const stueck = (anf, ende) => app.slice(app.indexOf(anf), app.indexOf(ende, app.indexOf(anf)));
const code = stueck("function kwVcard(", "function kwExtern(");
const nurZiffern = (t) => String(t).replace(/[^\d+]/g, "");
const R = new Function("nurZiffern", code + "; return { kwVcard, kwText };")(nurZiffern);
const m = { name: "Erika Muster" }, k = { handy: "0171 123", mail: "e@x.de", adresse: { strasse: "Weg 1", plz: "59368", ort: "Werne" } };
const v = R.kwVcard(m, k, ["handy"]);
assert.match(v, /^BEGIN:VCARD\r\nVERSION:3\.0\r\nN:Muster;Erika;;;/);
assert.match(v, /TEL;TYPE=CELL:0171123/);
assert.doesNotMatch(v, /EMAIL|ADR/, "nicht angekreuzt → nicht in der Karte");
assert.match(R.kwVcard(m, k, ["adresse"]), /ADR;TYPE=HOME:;;Weg 1;Werne;;59368;Deutschland/);
const t = R.kwText(m, k, ["mail", "adresse"]);
assert.match(t, /E-Mail: e@x\.de/); assert.match(t, /Anschrift: Weg 1, 59368 Werne/); assert.doesNotMatch(t, /Handy/);
console.log("✅ kontakt-extern: alle Prüfungen bestanden");
