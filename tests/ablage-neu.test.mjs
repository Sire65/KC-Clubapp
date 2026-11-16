// 2.961.0 KC-CLUB-ABLAGE-NEU (Wunschliste #95, Hansi 16.11.2026): im Ablage-Fenster „➕ Neues Register …“ und (Archiv-Pflege) „➕ Neuer Ordner …“
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const teil = app.slice(app.indexOf("async function archivAblageFragen("), app.indexOf("// ----- 1.19.0: Chat als Textdatei"));
assert.ok(/<option value="\$\{AR_NEU\}">➕ Neues Register …<\/option>/.test(teil), "Register + Neu in der Auswahl");
assert.ok(/ABL\?\.d\?\.darf \? `<option value="\$\{AR_NEU\}">➕ Neuer Ordner …<\/option>` : ""/.test(teil), "Ordner + Neu nur für die Archiv-Pflege");
assert.ok(/onchange="ablOrdnerWahl\(\)"/.test(teil) && /onchange="ablRegWahl\(\)"/.test(teil), "Auswahl reagiert auf ➕");
assert.ok(/if \(ordner_id === AR_NEU \|\| register === AR_NEU\) return melde\(/.test(teil), "nie in „__neu__“ ablegen");
const reg = app.slice(app.indexOf("async function arRegisterNeuAnlegen("), app.indexOf("async function arOrdnerNeuAnlegen("));
assert.ok(/const so = reg\.indexOf\("Sonstiges"\), neu = so >= 0 \? \[\.\.\.reg\.slice\(0, so\), name, \.\.\.reg\.slice\(so\)\]/.test(reg), "„Sonstiges“ bleibt das letzte Register");
assert.ok(/>= 12\)/.test(reg) && /gibt es schon/.test(reg), "höchstens 12 Register, keine doppelten");
assert.ok(/api\("archiv_ordner_speichern", o\.besitzer \? \{ id: o\.id, register: neu, farbe: o\.farbe \}/.test(reg), "vorhandener Serverweg, eigener Ordner nur Register/Farbe");
const ord = app.slice(app.indexOf("async function arOrdnerNeuAnlegen("), app.indexOf("async function arOrdnerNeuAnlegen(") + 1500);
assert.ok(/if \(!d\?\.darf\) return null;/.test(ord) && /art: "sonstiges", jahr, titel/.test(ord), "neuer Club-Ordner nur Archiv-Pflege");
assert.ok(app.includes("<b>„➕ Neues Register …“</b>"), "Hilfe erklärt es");
console.log("ablage-neu: alle Prüfungen bestanden");
