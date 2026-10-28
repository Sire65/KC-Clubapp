// KC-CLUB-KOM-SYMBOLE (28.10.2026, Wunsch Hansi „oberer Bereich zu unruhig/übervoll“ → „Symbol mit kleinem Wort darunter, unter Zahnrad einstellbar“).
// Aufruf: node tests/kom-symbole.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs"; // 2.730.0 KC-CLUB-TEILE: app.js + teile/*.js
const app = programmText();
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const leiste = html.slice(html.indexOf('<div class="kom-leiste">'), html.indexOf('<div id="onlineLeiste">'));
assert.ok((leiste.match(/<span class="kl-i">/g) || []).length === 6 && /id="abMerker"/.test(leiste), "alle Knöpfe (mit Anrufbeantworter) in EINER Reihe, Symbol + Wort");
assert.ok(/html\.kom-sym \.kom-leiste \{ flex-wrap: nowrap;/.test(html) && /html\.kom-sym \.kom-leiste \.knopf:not\(\.versteckt\) \{[^}]*flex-direction: column;/.test(html) && /html\.kom-sym \.kom-leiste \.kl-t \{ display: none; \}/.test(html), "Symbol mit kleinem Wort darunter, versteckte Knöpfe bleiben versteckt");
assert.ok(/id="setKomSym" onchange="einstellung\('komSym', this\.checked\)"/.test(html) && /\["setKomSym", "komSym"\]/.test(app) && /w\.classList\.toggle\("kom-sym", einst\("komSym", true\)\);/.test(app), "unter ⚙️ einstellbar, ab Werk an");
assert.ok(/function klSetzen\(b, sym, lang, kurz\)/.test(app) && /klSetzen\(m, "📼"/.test(app) && /klSetzen\(b, an \? "☰" : "🗂️"/.test(app), "Kartei- und Anrufbeantworter-Knopf behalten Symbol + Wort");
console.log("kom-symbole: alle Prüfungen bestanden");
