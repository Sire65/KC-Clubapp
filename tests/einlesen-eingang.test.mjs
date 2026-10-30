// KC-CLUB-EINLESEN-EINGANG (2.780.0, Wunsch Hansi 30.10.): statische Prüfung (offline).
// Aufruf: node tests/einlesen-eingang.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");
const teil = (a, b) => { const i = app.indexOf(a), j = app.indexOf(b, i + 1); assert.ok(i > 0 && j > i, `fehlt: ${a}`); return app.slice(i, j); };
// „Wohin damit?“: neuer Knopf nur für die Clubleitung, die bisherigen Wege bleiben
const ziel = teil("function einlZiel(dateien", "function einlEingang()");
assert.ok(/\$\{L \? '<button class="knopf" onclick="einlEingang\(\)">👥 In die Eingangskörbe von Mitgliedern/.test(ziel), "Knopf nur für Leitung");
for (const k of ["einlAblegen()", "einlInKorb", "einlNachricht()", "einlPerMail()"]) assert.ok(ziel.includes(k), `bisheriger Weg bleibt: ${k}`);
// Fenster: Dateien anhaken, An wen? (Alle, Gruppe, Amt, bestimmte), Register, Nachricht
const eg = teil("function einlEingang()", "// ---------- 2.669.0 KC-CLUB-ERKENNUNG-DATEI");
assert.ok(/ARCHIV_TYP_OK\(einlMime\(d\)\)/.test(eg) && /data-ei=/.test(eg), "nur Dateien, die ins Archiv passen");
assert.ok(/zwStart\("einlEgAn", \{[^}]*alleText: BU_ALLE_TEXT, alle: \(\) => \(MITGLIEDER \|\| \[\]\)\.filter\(\(m\) => zwIch\(m\.person_id\) && sammelOk\(m\) && okFrei\(m\)\)/.test(eg), "bekannte Empfängerwahl wie Aktentasche/Ablagekorb");
assert.ok(/EINGANG_REGISTER/.test(eg) && /id="einlEgNotiz"/.test(eg), "Register und Nachricht");
// Senden: Rückfrage, je Datei ein Aufruf mit Datei-Inhalt, Bescheid beim letzten; danach die übrigen Dateien zurück in „Wohin damit?“
assert.ok(/await frage\(/.test(eg), "Rückfrage vor dem Senden");
assert.ok(/api\("archiv_eingang_verteilen", \{ personen: ids, name: f\.name, mime: einlMime\(f\), daten: base64\(await f\.arrayBuffer\(\)\),/.test(eg) && /letzte: n === dateien\.length - 1, anzahl: dateien\.length/.test(eg), "vorhandener Server-Kern");
assert.ok(/rest = E\.dateien\.filter\(\(d\) => !dateien\.includes\(d\)\)/.test(eg) && /if \(rest\.length\) einlZiel\(rest, \{ korbId: E\.korbId \}\)/.test(eg), "übrige Dateien – je Person eine eigene Datei möglich");
// Server: unverändert – nur Clubleitung, prüft Typ und Größe
const sv = server.slice(server.indexOf('case "archiv_eingang_verteilen"'), server.indexOf('case "archiv_eingang_senden"'));
assert.ok(/nurLeitung\(ich\);/.test(sv) && /ARCHIV_DATEITYPEN\.test\(mime\)/.test(sv) && /dateiAblegen\(ich, p\.name, mime, p\.daten, ARCHIV_DATEITYPEN\)/.test(sv), "Server prüft Rechte, Typ und Größe");
// Hilfe, Fenstername, Spur
assert.ok(/id: "buero_einlesen_eingang"/.test(app) && /"h:buero_einlesen_eingang": \["buero"\]/.test(app), "Hilfe-Eintrag");
assert.ok(/einlEgBlatt: "👥 Einlesen: in die Eingangskörbe"/.test(app), "Fenstername für die Wege der Mitglieder");
console.log("einlesen-eingang: alle Prüfungen bestanden");
