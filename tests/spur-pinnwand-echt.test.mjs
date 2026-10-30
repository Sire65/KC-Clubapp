// KC-CLUB-SPUR-PINNWAND-ECHT (2.766.0, Fund Hansi 30.10.2026: Karla „Zettel aufgehängt“, aber kein Zettel – alte App aus dem Hintergrund).
// Aufruf: node tests/spur-pinnwand-echt.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const server = lies("supabase/functions/kc-club/index.ts");
const sm = server.slice(server.indexOf('case "spur_melden":'), server.indexOf('case "start_melden":'));
assert.match(sm, /const pwT = s\.filter\(\(x: any\) => x\[1\] === "tat_pinnwand"\)/, "nur prüfen, wenn der Schritt vorkommt");
assert.match(sm, /db\.from\("kc_club_pinnwand"\)\.select\("erstellt_am"\)\.eq\("person_id", ich\.person_id\)/, "eigene Zettel");
assert.match(sm, /Math\.abs\(t - \(s\[i\]\[0\] as number\)\) <= 600000\)\) s\.splice\(i, 1\);/, "±10 Min., sonst Schritt weg");
assert.ok(sm.indexOf("const pwT") < sm.indexOf('await protokoll(ich.person_id, "spur"'), "vor dem Speichern");
// gleiche Regel wie der Server, nachgebaut: echter Zettel 1 Min. vorher bleibt, ohne Zettel fällt weg, andere Schritte bleiben
const pruefe = (s, echt) => { for (let i = s.length - 1; i >= 0; i--) if (s[i][1] === "tat_pinnwand" && !echt.some((t) => Math.abs(t - s[i][0]) <= 600000)) s.splice(i, 1); return s; };
assert.deepEqual(pruefe([[1000000, "tat_pinnwand"], [1000500, "termine"]], []), [[1000500, "termine"]]);
assert.deepEqual(pruefe([[1000000, "tat_pinnwand"]], [1000000 - 60000]), [[1000000, "tat_pinnwand"]]);
const mig = lies("supabase/migrations/20261030_kc_club_spur_pinnwand_echt.sql");
assert.match(mig, /p\.aktion = 'spur' and p\.zeit >= '2026-10-29'/, "Bereinigung nur Wege seit dem Fix");
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/spur-pinnwand-echt.test.mjs"), "läuft in der CI");
console.log("spur-pinnwand-echt: ok");
