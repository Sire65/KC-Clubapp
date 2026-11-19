// KC-CLUB-SPUR-WEG (19.11.2026, Fund Hansi „Christina hat lt. Push die App verlassen, im Wegeprotokoll steht sie aber grün drin“):
// „Wege der Mitglieder“ zeigt nur als „gerade in der App“, wer die App nicht weggelegt hat. Aufruf: node tests/spur-weg.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const srv = readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
assert.ok(/const weg0 = await wegSet\(daRoh\)\.catch\(\(\) => new Set<string>\(\)\), daIds = daRoh\.filter\(\(id: string\) => !weg0\.has\(id\)\);/.test(srv), "Übersicht: Weggelegte nicht bei „gerade in der App“");
assert.ok(/const da = !!zg\?\.length && !\(await wegSet\(\[pid\]\)\.catch\(\(\) => new Set<string>\(\)\)\)\.has\(pid\)/.test(srv), "Einzelne Person: Weggelegte nicht grün (und nicht fälschlich „Online-Anzeige aus“)");
const istWeg = new Function("return " + srv.slice(srv.indexOf("const istWeg = ") + "const istWeg = ".length, srv.indexOf(";\n", srv.indexOf("const istWeg = "))).replace(/: any/g, ""))();
assert.equal(istWeg({ weg: "2026-11-19T12:25:30Z", zuletzt: "2026-11-19T12:25:10Z" }), true, "weggelegt nach der letzten Meldung → weg");
assert.equal(istWeg({ weg: "2026-11-19T12:20:00Z", zuletzt: "2026-11-19T12:25:10Z" }), false, "danach wieder da → nicht weg");
assert.equal(istWeg({ zuletzt: "2026-11-19T12:25:10Z" }), false, "ohne „weg“ → wie bisher");
console.log("spur-weg: alle Prüfungen bestanden");
