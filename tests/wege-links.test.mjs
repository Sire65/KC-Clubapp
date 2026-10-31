// KC-CLUB-WEGE-LINKS (31.10.2026, Wunsch Hansi „wenn ich einen Eintrag anklicke, dass der Link direkt ins Programm zu dem Punkt geht“)
// Aufruf: node tests/wege-links.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
// Server: Chat-Kennung nur, wenn der Admin selbst Teilnehmer ist (KC-CHATS-PRIVAT)
assert.ok(/spurUuid\(x\.mit\) && \(tn \?\? \[\]\)\.some\(\(z: any\) => z\.thread_id === x\.mit && z\.person_id === ich\.person_id\) \? \{ c: x\.mit \} : \{\}/.test(server), "Chat-Link nur für eigene Unterhaltungen");
assert.ok(/x\.mit\?\.startsWith\("KC-P-"\) \? \{ p: x\.mit \} : \{\}/.test(server), "Mitglied-Kennung");
// App: Ziele
const z = app.slice(app.indexOf("function spurZiel(x) {"), app.indexOf("function spurGehe(i) {"));
assert.ok(/if \(w === "chat"\) return x\.c \? \(\) => chatOeffnen\(x\.c\) : null;/.test(z), "fremder Chat ohne Link");
assert.ok(/x\.p \? \(\) => mitgliedOeffnen\(x\.p\)/.test(z) && /FENSTER_OEFFNEN\[k\] \|\| null/.test(z) && /hzZuEintrag\(k\)/.test(z) && /rundgangStart\(false, k\)/.test(z) && /filmZeigen\(k\)/.test(z), "Mitglied, Fenster, Hilfe, Video, Film");
assert.ok(/!SPUR_OHNE_ZIEL\.includes\(w\) && document\.getElementById\("v-" \+ w\)\) return \(\) => zeige\(w\);/.test(z), "Bereiche");
// alle Öffner in FENSTER_OEFFNEN gibt es wirklich
const reg = app.slice(app.indexOf("const FENSTER_OEFFNEN = {"), app.indexOf("const SPUR_OHNE_ZIEL"));
for (const [, id, fn] of reg.matchAll(/(\w+): \(\) => (\w+)\(/g)) {
  assert.ok(new RegExp(`function ${fn}\\(`).test(app), `Öffner fehlt: ${fn} (${id})`);
  assert.ok(new RegExp(`${id}: "`).test(app.slice(app.indexOf("const FENSTER_NAMEN = {"))), `Fenster ohne Namen: ${id}`);
}
assert.ok(/onclick="spurGehe\(\$\{i\}\)"/.test(app) && /class="spur-pfeil"/.test(app), "Zeile antippbar mit ›");
console.log("wege-links: ok");
