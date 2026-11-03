// KC-CLUB-VORSCHLAG-ERLEDIGT (2.833.0, Wunsch #76 Hansi): Erledigtes eingeklappt nach Sitzung, „📄 Im Protokoll“, Jahresabschluss legt Liste ins Archiv.
// Aufruf: node tests/vorschlag-erledigt.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { programmText } from "./programm.mjs";
const app = programmText(), srv = readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
assert.ok(/\.neq\("status", "offen"\)[^\n]*\.limit\(200\)/.test(srv), "Server liefert das ganze Jahr Erledigtes (200)");
assert.ok(/behandeltIn: v\.behandelt_in \?\? null/.test(srv), "Server nennt das Protokoll, in dem behandelt wurde");
const l = app.slice(app.indexOf("async function vorschlaegeLaden()"), app.indexOf("function balken(v)"));
assert.ok(/\+ vsErledigtHtml\(fertig\);/.test(l) && /klappenMerken\(\$\("vorschlagListe"\)\)/.test(l), "Erledigt als Klappbereich, Auf/Zu gemerkt");
assert.ok(/<details class="karte vs-erledigt" data-klappe="vs_erledigt"/.test(l) && /class="pr-monat vs-gruppe"/.test(l), "eingeklappt, je Sitzung eigener Bereich");
assert.ok(/v\.behandeltIn \? `<button[^`]*protokollOeffnen\('\$\{esc\(v\.behandeltIn\)\}'\)">📄 Im Protokoll<\/button>`/.test(app), "Knopf „Im Protokoll“");
// Gruppierung echt ausführen
const g0 = l.indexOf("function vsErledigtHtml(fertig)"), gcode = l.slice(g0);
const vs = new Function("tagKurz", "CJ_MONATE", "esc", "vorschlagKachel", gcode + "\nreturn vsErledigtHtml;")((d) => d.slice(8, 10) + "." + d.slice(5, 7) + ".", ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"], (x) => String(x), (v) => `<k>${v.id}</k>`);
const T = { id: "t1", beginn: "2026-10-30T18:00:00Z" };
const h = vs([{ id: "a", art: "thema", treffen: T }, { id: "b", art: "thema", treffen: T }, { id: "c", art: "abstimmung", treffen: null, abgeschlossen_am: "2026-08-05T10:00:00Z" }]);
assert.ok(/Sitzung 30\.10\./.test(h) && /2 Themen/.test(h) && /August 2026/.test(h) && /1 Abstimmung/.test(h), "Sitzung/Monat mit Anzahl");
assert.ok(h.indexOf("Sitzung 30.10.") < h.indexOf("August 2026"), "neueste zuerst");
assert.equal(vs([]), "", "nichts Erledigtes → kein Bereich");
// Jahresabschluss
const j = app.slice(app.indexOf("async function prJahrAbschliessen(jahr)"), app.indexOf("function protokollFilter()"));
assert.ok(/const REG = \["Protokolle", "Vorschläge", "Sonstiges"\]/.test(j) && /await prVorschlaegeAblegen\(jahr, o, schon\)/.test(j), "Jahresabschluss legt auch die Vorschläge ab");
assert.ok(/const marke = `vs-\$\{jahr\}-\$\{liste\.length\}`;\s*if \(schon\.has\(marke\)\) return 0;/.test(j), "nichts doppelt ablegen");
assert.ok(/register: REG, titel, datum: `\$\{jahr\}-12-31`/.test(j), "Register „Vorschläge“");
const t0 = j.indexOf("function prVorschlaegeJahrText"), tcode = j.slice(t0, j.indexOf("async function prVorschlaegeAblegen"));
const jt = new Function("tagKurz", "spEuro", "TZ", tcode + "\nreturn prVorschlaegeJahrText;")((d) => d.slice(8, 10) + "." + d.slice(5, 7) + ".", (n) => n + " €", "Europe/Berlin");
const txt = jt("2026", [{ titel: "Grillabend", art: "thema", status: "abgeschlossen", von: { name: "Klaus" }, treffen: { beginn: "2026-10-30T18:00:00Z", titel: "Clubabend" } },
  { titel: "Ausflug", art: "abstimmung", geheim: true, status: "abgeschlossen", von: { name: "Klaus" }, treffen: null, ergebnis: [{ option: "Ja", anzahl: 4, namen: ["Hansi"] }] }]);
assert.ok(/^Köcheclub Werne – Erledigte Vorschläge 2026/.test(txt) && /Sitzung 30\.10\. – Clubabend/.test(txt) && /• Grillabend \(Thema, von Klaus\)/.test(txt), "Liste nach Sitzung");
assert.ok(/Ergebnis: Ja: 4/.test(txt) && !/Hansi/.test(txt), "Ergebnis nur als Zahl, keine Namen");
console.log("vorschlag-erledigt: alle Prüfungen bestanden");
