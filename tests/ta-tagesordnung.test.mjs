// KC-CLUB-TA-TAGESORDNUNG (12.11.2026): Terminanfrage → Häkchen „Als Tagesordnung übernehmen“ → Besprechungsvorlage im Club-Design
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
assert.match(app, /\$\{!ab && !a\.spiel && \(a\.vonMir \|\| a\.meine === "ja" \|\| a\.meine === "vielleicht"\) \? taToSchalterHtml\(a\) : ""\}/, "Häkchen nur für Anfragende und Zusagende, nicht bei Absage oder Partie");
assert.match(app, /📋 <b>Als Tagesordnung übernehmen<\/b>/);
assert.match(app, /besprechung: \{ ablegen: \{ register: \["Besprechungen", "Protokolle", "Sonstiges"\][^}]*\}, bauen: \(o, id\) => taBesprechungDruck\(id\) \}/, "Druckart mit Ablegen");
assert.match(app, /const TA_TO_KEY = "kc_club_ta_tagesordnung";/, "nur auf dem Gerät gemerkt");
// Punkte aus der Notiz: Zeilen und „;“, Aufzählungszeichen und Nummern weg
const m = /function taToAusNotiz\(notiz\) \{([\s\S]*?)\n\}/.exec(app); assert.ok(m, "taToAusNotiz da");
const taToAusNotiz = new Function("notiz", m[1]);
assert.deepEqual(taToAusNotiz("1. Weihnachtsmarkt Dienstplan\n- Einkauf Glühwein; Kasse\n• Sonstiges\n\nTOP 5: Termine 2027\n2) x"), ["Weihnachtsmarkt Dienstplan", "Einkauf Glühwein", "Kasse", "Sonstiges", "Termine 2027"]);
assert.deepEqual(taToAusNotiz(""), []);
assert.deepEqual(taToAusNotiz(null), []);
assert.equal(taToAusNotiz(Array.from({ length: 30 }, (_, i) => "Punkt " + i).join("\n")).length, 20, "höchstens 20 Punkte");
// Vorlage: Teilnehmer zum Abhaken, TOP-Tabelle mit Notizen und Wer/Bis wann, Verschiedenes, nächster Termin
for (const t of ["Teilnehmer", "Tagesordnung", "Notizen / Ergebnis", "Wer? Bis wann?", "Verschiedenes", "Nächster Termin", "Besprechung: "]) assert.ok(app.includes(t), t);
console.log("ta-tagesordnung: ok");
