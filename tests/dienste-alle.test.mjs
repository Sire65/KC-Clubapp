// 3.50.0 KC-CLUB-DIENSTE-ALLE (Hansi 27.11.2026 „warum nur ein paar Tage angezeigt, wie kann man den Zeitraum ändern“): Mein Dienst zeigt die nächsten 5,
// die übrigen kommenden Dienste aufklappbar. Aufruf: node tests/dienste-alle.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const server = lies("supabase/functions/kc-club/index.ts"), app = lies("app.js");
assert.ok(/soll: \{ naechste: \(soll \?\? \[\]\)\.slice\(0, 60\)\.map\(zeit\)/.test(server), "Server liefert alle kommenden (bis 60)");
assert.ok(/const vorne = so\.naechste\.slice\(0, 5\), rest = so\.naechste\.slice\(5\);/.test(app) && /<summary>▾ Alle \$\{so\.naechste\.length\} Dienste anzeigen<\/summary>/.test(app), "5 sichtbar, Rest aufklappbar");
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/dienste-alle.test.mjs"), "läuft in der CI");
console.log("dienste-alle: ok");
