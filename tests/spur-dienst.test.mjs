// KC-CLUB-SPUR-DIENST (13.11.2026): Dienst-Vorgänge in den Wegen – neu/geändert, nie Inhalte
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
assert.match(server, /async function spurServer\(pid: string, w: string, mit\?: string\) \{\n  try \{ if \(!SPUR_WAS\.test\(w\) \|\| \(mit && !spurMitOk\(mit\)\)\) return; await protokoll\(pid, "spur", \{ s: \[mit \? \[Date\.now\(\), w, mit\] : \[Date\.now\(\), w\]\] \}\); \} catch/, "Server schreibt nur Kennungen, stört nie");
for (const [aktion, re] of [["Dienstwünsche", /spurServer\(ich\.person_id, alt \? "tat_dw_geaendert" : "tat_dw_neu", "f" \+ r\.data\.revision\)/],
  ["Stunden", /spurServer\(ich\.person_id, "tat_stunden"/], ["Ist-Zeiten", /spurServer\(ich\.person_id, ergebnis === "passt" \?/], ["Kommen\/Gehen", /"tat_dienst_gehen" : "tat_dienst_kommen"/],
  ["Korrektur", /spurServer\(ich\.person_id, "tat_dienst_korrigiert"\)/], ["Tausch anbieten", /spurServer\(ich\.person_id, "tat_tausch_anbieten"/], ["Tausch-Aktion", /spurServer\(ich\.person_id, "tat_tausch_" \+ aktion/]])
  assert.match(server, re, aktion);
// alle Namen mit Beschriftung, kurz genug für die Prüfung im Server
const namen = [...server.matchAll(/"(tat_(?:dw|stunden|ist|dienst|tausch)[a-z_]*)"/g)].map((m) => m[1]).filter((n) => n !== "tat_tausch_");
for (const a of ["uebernehmen", "zurueckziehen", "zuruecktreten", "bestaetigen", "ablehnen"]) namen.push("tat_tausch_" + a);
for (const n of new Set(namen)) { assert.ok(app.includes(`${n}: "`), "Beschriftung für " + n); assert.ok(/^[a-z][a-z0-9_]{0,29}$/.test(n), "Name zu lang: " + n); }
assert.match(app, /if \(\/\^tat_\(dw\|stunden\|ist\|dienst\|tausch\)\/\.test\(w\)\)/, "Fassung/Tag lesbar");
console.log("spur-dienst: ok");
