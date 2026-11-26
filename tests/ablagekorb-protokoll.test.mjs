// KC-CLUB-ABLAGEKORB-PROTOKOLL (3.44.0, Wunsch Hansi 26.11.2026 „im Ablagekorb als Option: als Protokoll-Anlage einfügen mit Protokoll-Auswahl“): statische Prüfung (offline).
// Aufruf: node tests/ablagekorb-protokoll.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");
const teil = (t, a, b) => { const i = t.indexOf(a), j = t.indexOf(b, i + 1); assert.ok(i > 0 && j > i, `fehlt: ${a}`); return t.slice(i, j); };
// Knopf im Ablagekorb: nur bei Dateien und Protokoll-Recht
assert.ok(/\$\{x\.anlagen\.length && ICH\?\.protokolle !== false \? `<button class="knopf klein" onclick="ablkProtokoll\('\$\{x\.id\}'\)">📋 Als Protokoll-Anlage<\/button>`/.test(app), "Knopf im Ablagekorb");
const c = teil(app, "async function ablkProtokoll(id)", "async function ablkFertig(");
assert.ok(/api\("protokolle_liste"/.test(c) && /p\.status === "entwurf" && p\.darfBearbeiten/.test(c), "Auswahl: nur Entwürfe, die ich bearbeiten darf");
assert.ok(/<option disabled>/.test(c) && /erst „Korrigieren“/.test(c), "Veröffentlichte grau mit Hinweis");
assert.ok(/data-pf=/.test(c) && /!w\.size \|\| w\.has\(f\.id\)/.test(c), "Dateien anhakbar, vorbelegt mit der Korb-Auswahl");
assert.ok(/api\("ablagekorb_zu_protokoll", \{ id, protokoll, ids:/.test(c) && /await einmal\(knopf/.test(c), "ein Aufruf, Doppeltippen gesperrt");
assert.ok(/ablkPrBlatt: "📋 Als Protokoll-Anlage"/.test(app), "Fenstername");
// Server: nur Admin, nur Entwurf, Bearbeitungsrecht, Grenze 20, eigene Kopie, erledigt bzw. abgespalten
const s = teil(server, 'case "ablagekorb_zu_protokoll"', 'case "ablagekorb_liste"');
assert.ok(/nurAdmin\(ich\); nurProtokolle\(ich\);/.test(s), "nur Admin mit Protokoll-Recht");
assert.ok(/if \(!darfBearbeiten\(ich, pr\)\) throw/.test(s) && /if \(pr\.status !== "entwurf"\) throw/.test(s), "nur Entwurf, nur wer bearbeiten darf");
assert.ok(/\+ ids\.length > 20\) throw/.test(s), "höchstens 20 Anlagen");
assert.ok(/ablkIds\(z\)/.test(s) && /alle\.filter\(\(x\) => roh\.includes\(x\)\)/.test(s), "nur Dateien dieses Eintrags");
assert.ok(/const k = await dateiDuplizieren\(ich, aid\);/.test(s) && /attachment_id: k\.id/.test(s), "Kopie hängt am Protokoll – das Original räumt der Korb weg");
assert.ok(/status: "erledigt", ergebnis, erledigt_von/.test(s) && /update\(\{ anlagen: bleibt \}\)/.test(s), "alle → erledigt, Teil → abgespalten, Rest bleibt offen");
console.log("ablagekorb-protokoll: ok");
