// KC-CLUB-TA-AENDERN (12.11.2026): Terminanfrage ändern/ergänzen und Angefragten Bescheid geben
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const c = server.slice(server.indexOf('case "terminanfrage_aendern"'), server.indexOf("// ----- KC-CLUB-STANDORT (0.92.0) -----"));
assert.ok(c.length > 500, "Server-Aktion terminanfrage_aendern da");
assert.match(c, /if \(a\.erstellt_von !== ich\.person_id\) throw new Fehler\("Ändern kann nur, wer angefragt hat\.", 403\);/, "nur wer angefragt hat");
assert.match(c, /if \(a\.status === "abgesagt"\)/, "nicht bei Absage");
assert.match(c, /update\(\{ anlass, ort, notiz, geaendert_am: stand \}\)\.eq\("id", a\.id\)\.eq\("erstellt_von", ich\.person_id\)/, "nur Anlass, Ort, Notiz – Zeit bleibt");
assert.ok(!/beginn:|frist:/.test(c.slice(c.indexOf("update("), c.indexOf("update(") + 120)), "Zeit und Frist werden nicht geändert");
assert.match(c, /filter\(\(e: any\) => e\.antwort !== "nein"\)/, "Bescheid nicht an die, die abgelehnt haben");
assert.match(c, /if \(p\.informieren !== false\)/, "Bescheid abwählbar");
assert.match(c, /Neu dazugekommen:/, "neue Zeilen im Bescheid");
assert.match(c, /protokoll\(ich\.person_id, "terminanfrage_geaendert", \{ anfrage: a\.id, neue_zeilen: neu\.length, informiert: empfaenger, versand \}\)/, "Protokoll ohne Inhalt");
// neue Zeilen erkennen
const z = /const zeilen = (\(t: string \| null\) => [^;]+);/.exec(c); assert.ok(z);
const zeilen = new Function("return " + z[1].replace(": string | null", ""))();
const alt = new Set(zeilen("1. A\n- B\n")), neu = zeilen("1. A\n- B\n- Neuer Finger-Barcode-Reader\n- Seltene Nutzung").filter((x) => !alt.has(x));
assert.deepEqual(neu, ["- Neuer Finger-Barcode-Reader", "- Seltene Nutzung"]);
// App
assert.match(app, /\$\{a\.spiel \? "" : `<button class="knopf klein" onclick="taAendern\('\$\{a\.id\}'\)">✏️ Ändern \/ ergänzen<\/button>`\}/, "Knopf nur bei eigener Anfrage, nicht bei Partie");
assert.match(app, /api\("terminanfrage_aendern", \{ id, anlass, ort: [^}]+informieren: !!info\?\.checked, hinweis: /);
assert.match(app, /Bescheid geben, dass sich weitere Punkte ergeben haben/);
assert.match(app, /✏️ ergänzt am /);
console.log("ta-aendern: ok");
