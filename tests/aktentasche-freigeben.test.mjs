// KC-CLUB-AKTENTASCHE-FREIGEBEN + KC-CLUB-EINGANG-DURCHGEHEN + KC-CLUB-ZIELWAHL (2.741.0, Wunsch Hansi): statische Prüfung (offline).
// Aufruf: node tests/aktentasche-freigeben.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");
const teil = (a, b) => { const i = app.indexOf(a), j = app.indexOf(b, i + 1); assert.ok(i > 0 && j > i, `fehlt: ${a}`); return app.slice(i, j); };

// --- Aktentasche: Knopf, Auswahl der Teile, An wen?, Senden
assert.ok(/onclick="atDruckWahl\(\)">🖨️ Drucken – auswählen<\/button><button class="knopf haupt" onclick="atFreigabeWahl\(\)">📤 Freigeben<\/button>/.test(app), "📤 Freigeben unten in der Tasche");
const fw = teil("function atFreigabeWahl()", "const atFreiTeile");
assert.ok(/data-fk=/.test(fw) && /<div id="atFreiAn"><\/div>/.test(fw) && /zwStart\("atFreiAn"/.test(fw) && /EINGANG_REGISTER/.test(fw), "Teile anhaken, An wen?, Register-Vorschlag");
assert.ok(/sammelOk\(m\) && okFrei\(m\)/.test(fw), "„Alle“ ohne Mitglieder, die nichts bekommen wollen / Aushilfen");
const td = teil("async function atTeilDatei(i)", "async function atFreigeben(");
assert.ok(/anlageAlsDatei\(/.test(td) && /druckSeiteBauen\(\)/.test(td) && /druckPdfBlob\(\)/.test(td) && /finally \{ DRUCK = alt; \}/.test(td), "Anlage unverändert, sonst PDF aus der Druckansicht");
for (const art of ["tagesordnung", "teilnehmer", "aufgaben", "vorschlag", "abstimmung", "protokoll"]) assert.ok(td.includes(`"${art}"`), "Art " + art);
const fg = teil("async function atFreigeben(", "function atDruckLos()");
assert.ok(/await frage\(/.test(fg) && /api\("archiv_eingang_verteilen", \{ personen: ids,/.test(fg) && /letzte: n === teile\.length - 1, anzahl: teile\.length/.test(fg), "nach Rückfrage, je Teil ein Aufruf, Bescheid beim letzten");
assert.ok(/ARCHIV_TYP_OK\(f\.type\)/.test(fg), "nur Dateitypen, die ins Archiv passen");

// --- Server: Verteilen in die Eingangskörbe
const sv = server.slice(server.indexOf('case "archiv_eingang_verteilen"'), server.indexOf('case "archiv_eingang_senden"'));
assert.ok(/nurLeitung\(ich\);/.test(sv), "nur Clubleitung (Clubsprecher, Kassenwart) und Admin");
assert.ok(/filter\(\(id\) => id !== ich\.person_id\)\.slice\(0, 200\)/.test(sv) && /ARCHIV_DATEITYPEN\.test\(mime\)/.test(sv), "Empfänger begrenzt, Dateityp geprüft");
assert.ok(/zugangAus\(rolle\.get\(x\.person_id\)\) === "mitglied"/.test(sv) && /Gast\/Aushilfe – kein Archiv/.test(sv), "Gäste/Aushilfen übersprungen und genannt");
assert.ok(/status: "pruefung"/.test(sv) && /archivOrdnerVon\(/.test(sv) && /PERSOENLICH_GRENZE/.test(sv), "Eingangskorb = persönlicher Ordner, zur Prüfung, Speichergrenze");
assert.ok(/frei \?\? await dateiAblegen\(sys,/.test(sv) && /if \(frei\) await dateienEntfernen\(\[frei\.id\]\)/.test(sv), "eigene Kopie je Empfänger, ungenutzte Datei wird entfernt");
assert.ok(/nebenbei\(verteilen\(\)/.test(sv) && /if \(letzte\) await senden\("club_nachricht", \[x\.person_id\], \{\s*titel: "📥 Neu in deinem Eingangskorb"/.test(sv), "im Hintergrund, eine Mitteilung je Empfänger");

// --- Mitglied: Hinweis beim Öffnen → ansehen → ablegen oder löschen
assert.ok(/setTimeout\(filmHinweisPruefen, 4000\); setTimeout\(eingangHinweisPruefen, 5000\);/.test(app), "Hinweis beim Start");
assert.ok(/if \(e\.data\?\.typ === "push" && \/\^📥 Neu in deinem Eingangskorb\/\.test\(e\.data\.titel \|\| ""\)\) eingangNeu\(\);/.test(app), "Hinweis sofort bei offener App (Push)");
// KC-CLUB-EINGANG-SOFORT: direkte Leitung – ohne Neustart, auch über offenen Fenstern (Clubabend Live)
assert.ok(/if \(s\.art === "eingang"\) \{ eingangNeu\(\); return; \}/.test(app), "Signal „eingang“ der direkten Leitung");
assert.ok(/if \(letzte\) await db\.rpc\("kc_club_rt_klingeln", \{ p_personen: \[x\.person_id\], p_art: "eingang" \}\)/.test(server), "Server klingelt beim Empfänger an");
assert.ok(/document\.querySelector\(neu \? "\.dlg, #rgSchicht, #filmSchicht, #egBlatt" :/.test(app), "neu: auch über offenen Fenstern");
assert.ok(/: eingangDurchgehen\(true\)\);/.test(app), "am Ende neu nachsehen");
const eh = teil("async function eingangHinweisPruefen(", "async function eingangDurchgehen(");
assert.ok(/📥 Neu in deinem Eingangskorb/.test(eh) && /👀 Ja, ansehen/.test(eh) && /⏰ Später/.test(eh) && /if \(wahl === "an"\) return eingangDurchgehen\(\);/.test(eh), "Hinweis mit Knopf Ansehen");
const eg = teil("function egZeigen(", "async function egVorschau(");
assert.ok(/Möchtest du das Dokument ablegen oder löschen\?/.test(eg) && /🗄️ Ablegen/.test(eg) && /🗑️ Löschen/.test(eg), "Frage nach dem Ansehen");
assert.ok(/arWohin\(x, o, weiter\)/.test(eg) && /archiv_pruefung", \{ id: x\.id, annehmen: false \}/.test(eg), "Ablegen mit Vorschlag (arWohin), Löschen = ablehnen");
assert.ok(/function arWohin\(x, o, fertig\)/.test(app) && /await arLaden\(\); fertig\?\.\(\);/.test(app), "nach dem Ablegen das nächste Dokument");
assert.ok(/<option value="\$\{esc\(y\.id\)\}"\$\{y\.id === o\.id \? " selected" : ""\}>/.test(app) && /regOpt\(o\.id, x\.register\)/.test(app), "Ordner und Register sind vorgeschlagen");
assert.ok(/pdfSeiteAlsBild\(pdf, n, 900\)/.test(app.slice(app.indexOf("async function egVorschau("))), "PDF-Vorschau im Fenster");

// --- An wen? (Baustein)
const zw = teil("const ZWAHL = {};", "function buBerechtigt()");
assert.ok(/chip\("alle", "👥 Alle"\)\}\$\{chip\("einzeln", "👤 Einzeln"\)\}\$\{chip\("gruppe", "🧑‍🤝‍🧑 Gruppe"\)\}\$\{chip\("amt", "🎖️ Amt"\)\}/.test(zw), "Alle · Einzeln · Gruppe · Amt");
assert.ok(/const zwIds = \(feld\) => \{ const Z = ZWAHL\[feld\]; return Z\.art === "alle" \? Z\.alle\(\) : Z\.ids\.filter\(zwIch\); \};/.test(zw), "nie an mich selbst");
console.log("aktentasche-freigeben: alle Prüfungen bestanden");
