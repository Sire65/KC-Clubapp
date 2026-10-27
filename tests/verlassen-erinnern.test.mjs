// KC-CLUB-VERLASSEN-ERINNERN (26.10.2026, Wunsch Hansi „beim Verlassen: du hast noch … – Ja, Nein, später erinnern“): statische Prüfung (offline).
// Aufruf: node tests/verlassen-erinnern.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), server = lies("supabase/functions/kc-club/index.ts");
assert.ok(/function appSchliessen\(\) \{ verlassenFragen\(appSchliessenJetzt\); \}/.test(app) && /verlassenFragen\(\(\) => \{ if \(Date\.now\(\) - letztesZurueck > 3000\)/.test(app), "App schließen und Zurück fragen vorher");
assert.ok(/if \(!t\.length \|\| Date\.now\(\) - VLF\.gefragt < 10 \* 60000\) \{ weiter\(\); return false; \}/.test(app) && /!INIT\._offline && !VT\?\.fuer/.test(app), "nur wenn etwas offen, höchstens alle 10 Min., nicht offline/vertretend");
assert.ok(/data-w="nein">👀 Nein, jetzt ansehen/.test(app) && /data-w="spaeter">⏰ Später nochmal erinnern/.test(app) && /data-w="ja">🚪 Ja, verlassen/.test(app), "drei Knöpfe");
assert.ok(/api\("verlassen_erinnern", \{ minuten: 120, was: t\.map\(\(x\) => x\.text\)\.join\(", "\) \}\)/.test(app), "Später → Erinnerung vormerken");
assert.ok(/"nutzung_melden", "verlassen_erinnern"/.test(server) && /case "verlassen_erinnern": \{/.test(server) && /VE_MINUTEN = \[60, 120, 240\]/.test(server), "Server-Aktion");
const lauf = server.slice(server.indexOf("async function verlassenErinnernLauf("), server.indexOf("async function geplantFaelligLauf("));
assert.ok(/\.lte\("wert->>faellig", jetzt\(\)\)/.test(lauf) && /<= seit \+ 120000/.test(lauf) && /sendenGewaehlt\("club_nachricht", \[pid\], \["push"\]/.test(lauf) && /\.delete\(\)\.eq\("person_id", pid\)\.eq\("schluessel", VE_KEY\)/.test(lauf), "Lauf: fällig, entfällt nach Rückkehr, Push mit Ruhezeit, Merker weg");
assert.ok(/await verlassenErinnernLauf\(\)\.catch/.test(server), "im Wartungslauf");
console.log("verlassen-erinnern: alle Prüfungen bestanden");
