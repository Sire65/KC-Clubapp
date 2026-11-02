// KC-CLUB-FEE-FEENKUSS (02.11.2026, Wunsch Hansi „die kleine Fee fragt manchmal: Möchtest du einen Feenkuss probieren? Wenn ja, Rezept anzeigen“): statische Prüfung (offline).
// Aufruf: node tests/fee-feenkuss.test.mjs
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
assert.ok(/const FEE_FEENKUSS_ANTEIL = 0\.25;/.test(app), "manchmal: etwa jedes 4. Antippen");
assert.ok(/function feeSpruch\(\) \{\n  if \(Math\.random\(\) < FEE_FEENKUSS_ANTEIL\) return feeFeenkussFrage\(\);/.test(app), "Frage statt Spruch, sonst Spruch wie bisher");
assert.ok(/Möchtest du einen Feenkuss probieren\?/.test(app) && /onclick="feeFeenkussJa\(\)">😋 Ja, gern!</.test(app) && />Nein, danke</.test(app), "Frage mit Ja und Nein");
assert.ok(/async function feeFeenkussJa\(\) \{[\s\S]*?await rzStart\(\);[\s\S]*?find\(\(x\) => feeIstFeenkuss\(x\.titel\)\);\n  if \(r\) rzZeigen\(r\.id\);/.test(app), "Ja öffnet das Rezept im Club-Rezeptbuch");
// Titel-Erkennung
const m = app.match(/const feeIstFeenkuss = (\(t\) => [^\n]*);/); assert.ok(m, "Titel-Erkennung vorhanden");
const ist = eval(m[1]);
for (const t of ["Feenküsse", "Feenkuss", " Feenkuesse", "FEENKÜSSE mit Toffifee"]) assert.ok(ist(t), `erkannt: ${t}`);
for (const t of ["Butterplätzchen", "", null, "Kuss der Fee"]) assert.ok(!ist(t), `nicht erkannt: ${t}`);
console.log("fee-feenkuss: alle Prüfungen bestanden");
