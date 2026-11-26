// 3.39.0 KC-CLUB-TA-AUFRAEUMEN (Wunsch Hansi 26.11.2026): abgelaufene Terminanfragen löschen; beim Absagen erst fragen, ob eine Absage-Info rausgeht.
// Aufruf: node tests/ta-aufraeumen.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const srv = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const fall = (n, bis) => srv.slice(srv.indexOf(`case "${n}": {`), srv.indexOf(`case "${bis}": {`));
// Absagen: still möglich, Standard bleibt Bescheid (ältere Apps)
const ab = fall("terminanfrage_absagen", "terminanfrage_loeschen");
assert.ok(/anfrageAbsagen\(ich, a, txt\(p\.grund, 300\), p\.benachrichtigen !== false\)/.test(ab), "benachrichtigen=false → still");
assert.ok(/if \(a\.erstellt_von !== ich\.person_id\) throw new Fehler\("Absagen kann nur, wer angefragt hat\.", 403\)/.test(ab), "nur Ersteller sagt ab");
// Löschen: nur Ersteller/Admin, nur Vorbeigegangenes oder Abgesagtes, Sicherung vorher, keine Nachricht
const lo = fall("terminanfrage_loeschen", "terminanfrage_aendern");
assert.ok(lo.length > 300);
assert.ok(/if \(a\.erstellt_von !== ich\.person_id && !ich\.admin\) continue;/.test(lo), "nur Ersteller oder Admin");
assert.ok(/if \(a\.status !== "abgesagt" && Date\.parse\(a\.ende \|\| a\.beginn\) > jetztMs\) continue;/.test(lo), "kommende nie");
assert.ok(lo.indexOf("await geloescht(ich, \"terminanfrage\"") < lo.indexOf(".delete()"), "erst Sicherung, dann löschen");
assert.ok(!/senden\(|sendenGewaehlt\(|routerSenden\(/.test(lo), "keine Nachricht beim Löschen");
assert.ok(!/"terminanfrage_loeschen"/.test(srv.slice(srv.indexOf("const ZUGANG_AKTIONEN"), srv.indexOf("const ZUGANG_ERLAUBT"))), "nicht für Gäste/Aushilfen");
// App: Dialog mit drei Wegen; Löschbar-Regel wie der Server
assert.ok(/data-w="info">📨 Absagen und Bescheid schicken<\/button><button class="knopf" data-w="still">🔕 Still absagen – ohne Info<\/button>/.test(app), "Frage vor dem Absagen");
assert.ok(/api\("terminanfrage_absagen", \{ id, grund: w\.grund, benachrichtigen: w\.info \}\)/.test(app), "Wahl geht an den Server");
const taLoeschbar = new Function("ICH", app.slice(app.indexOf("const taLoeschbar ="), app.indexOf("async function taLoeschen(")) + "; return taLoeschbar;");
const f = taLoeschbar(null), alt = new Date(Date.now() - 86400000).toISOString(), neu = new Date(Date.now() + 86400000).toISOString();
assert.equal(f({ vonMir: true, status: "offen", beginn: alt }), true, "eigene, vorbei");
assert.equal(f({ vonMir: true, status: "offen", beginn: neu }), false, "eigene, kommend → absagen statt löschen");
assert.equal(f({ vonMir: true, status: "abgesagt", beginn: neu }), true, "abgesagt");
assert.equal(f({ vonMir: false, status: "offen", beginn: alt }), false, "fremde nie (ohne Admin)");
assert.equal(taLoeschbar({ admin: true })({ vonMir: false, status: "offen", beginn: alt }), true, "Admin darf");
assert.ok(/onclick="taLoeschen\(\['\$\{a\.id\}'\]\)">🗑️ Löschen<\/button>/.test(app) && /🗑️ Abgelaufene löschen \(\$\{weg\.length\}\)/.test(app), "Knöpfe");
assert.ok(/Es geht keine Nachricht an die Angefragten\./.test(app), "Rückfrage sagt: keine Nachricht");
console.log("ta-aufraeumen: ok");
