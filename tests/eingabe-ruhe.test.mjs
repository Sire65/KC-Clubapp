// KC-CLUB-EINGABE-RUHE (2.789.0, Wunsch Hansi 31.10.): statische Prüfung (offline).
// Aufruf: node tests/eingabe-ruhe.test.mjs
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
assert.ok(/const FENSTER_OFFEN = "\.blatt:not\(\.versteckt\), #dwFenster";/.test(app), "eine Stelle: offenes Fenster inkl. Dienstwünsche");
// alle automatischen Hinweise warten über FENSTER_OFFEN – das alte Muster bleibt nur beim Schließen-Kreuz (blattX)
const alt = app.match(/document\.querySelector\("\.blatt:not\(\.versteckt\)/g) || [];
assert.equal(alt.length, 2, "nur noch zwei Stellen ohne FENSTER_OFFEN: Schließen-Kreuz und Kopf-Szenen (teile/szenen.js, nur Bewegung im Kopf – unter dem Vollbild nicht zu sehen)");
assert.ok(/new MutationObserver\(\(\) => \{ if \(blattXPlan \|\| !document\.querySelector\("\.blatt:not\(\.versteckt\)"\)\)/.test(app), "die eine Stelle ist das Schließen-Kreuz");
for (const f of ["wasNeuZeigen", "pwErinnern", "einstiegPruefen", "filmHinweisPruefen", "startHinweisPruefen", "spEinladung", "dgPruefen", "taHinweisPruefen", "rcAngebotPruefen", "updateRuhig", "smHinweisPruefen", "scHinweisPruefen", "buAufgabePruefen", "ekHinweisPruefen"]) {
  const i = app.indexOf(`function ${f}(`); assert.ok(i > 0, f); assert.ok(app.slice(i, i + 1500).includes("FENSTER_OFFEN"), `${f} wartet bei offenen Dienstwünschen`);
}
// Eingangskorb-Hinweis: wartet bei offenen Dienstwünschen und gibt dabei nicht auf
assert.ok(/neu \? "\.dlg, #rgSchicht, #filmSchicht, #egBlatt, #dwFenster" : FENSTER_OFFEN \+ ", \.dlg, #rgSchicht, #filmSchicht, #egBlatt"/.test(app), "Eingangskorb-Hinweis wartet");
assert.ok(/if \(eingabeRuhe\(\) \|\| \+\+EGH\.versuche < 30\) setTimeout\(\(\) => eingangHinweisPruefen\(neu\), 3000\);/.test(app), "Warten zählt nicht");
// Sprach-Ansagen schweigen, Anrufe bleiben
assert.ok(/ansAn\(x\.art\.split\("-"\)\[0\]\) \|\| inRuheJetzt\(INIT\?\.einstellungen\?\.ruhezeit\) \|\| \(eingabeRuhe\(\) && x\.art !== "anklopfen"\)\) return;/.test(app), "Ansage schweigt – Anklopfen (Anruf) nicht");
assert.ok(/function onlineAnsageSprechen\(namen\) \{\n  if \(document\.hidden \|\| inRuheJetzt\(INIT\?\.einstellungen\?\.ruhezeit\) \|\| eingabeRuhe\(\)\) return;/.test(app), "Online-Ansage schweigt");
assert.ok(!/eingabeRuhe/.test(app.slice(app.indexOf("function anrufEingehend("), app.indexOf("function anrufEingehend(") + 2000)), "Anrufe klingeln weiter");
// Selbst-Update (2.788.0) bleibt gesperrt
assert.ok(/const UPDATE_SPERRE_SEL = \["#dwFenster"\];/.test(app), "Update-Schutz bleibt");
console.log("eingabe-ruhe: alle Prüfungen bestanden");
