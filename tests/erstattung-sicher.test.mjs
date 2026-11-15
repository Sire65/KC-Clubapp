// 2.951.0 KC-CLUB-ERSTATTUNG-SICHER (Fund Hansi 15.11.2026: „Ich wollte mir die Erstattung per PDF ansehen, jetzt ist schon erstattet abgehakt“):
// Im Eingang ist „📄 Antrag als PDF ansehen“ der grüne Knopf; „✅ Als erstattet markieren …“ ist ein normaler Knopf und fragt immer nach.
import fs from "node:fs";
import assert from "node:assert/strict";
const bu = fs.readFileSync(new URL("../teile/buero.js", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const posten = bu.slice(bu.indexOf("function ekPosten("), bu.indexOf("// KC-CLUB-ERSTATTUNG-SONDER"));
assert.ok(/\["📄 Antrag als PDF ansehen", `ekErstBlatt\('\$\{x\.id\}'\)`, true\]/.test(posten), "PDF ist der grüne Knopf im Eingang");
assert.ok(/\["✅ Als erstattet markieren …", `ekErstattet\('\$\{x\.id\}'\)`\]/.test(posten), "Erstattet ist kein grüner Knopf mehr");
assert.ok(!/\["✅ Erstattet", /.test(bu), "alter Schnellknopf weg");
const info = bu.slice(bu.indexOf("function ekErstInfo("), bu.indexOf("function ekErstBlatt("));
assert.ok(!/knopf haupt" data-fn="ekErstattet/.test(info), "im Antrag ist Erstattet nicht der Hauptknopf");
const ok = bu.slice(bu.indexOf("function ekErstattet("), bu.indexOf("async function ekErstAblehnen("));
assert.ok(/blattAuf\("ekErstOkBlatt"/.test(ok) && /Noch nicht erstattet\./.test(ok) && /↩️ Abbrechen – noch nicht erstattet/.test(ok), "Rückfrage sagt klar: noch nichts passiert");
assert.ok(/if \(w\) ekErledigen\(id, "erstattet", w, antwort\)/.test(ok), "gespeichert wird erst mit Bar/Überweisung");
// PDF ansehen ändert nichts am Antrag
const pdf = bu.slice(bu.indexOf("function ekErstBlatt("), bu.indexOf("function ekErstattet("));
assert.ok(!/api\(/.test(pdf) && /erstAnsehen\(/.test(pdf), "PDF ansehen ruft den Server nicht");
assert.ok(/ekErstOkBlatt: "✅ Erstattung als erstattet markieren\?"/.test(app), "Fenstername");
console.log("erstattung-sicher: alle Prüfungen bestanden");
