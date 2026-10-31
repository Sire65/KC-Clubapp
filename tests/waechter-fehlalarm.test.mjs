// KC-CLUB-WAECHTER-FEHLALARM (2.795.0, 31.10.2026, Fund Hansi): Versions-Wächter gelb bei neuerer App, Geheimnis-Wächter rot wegen des Klick-Rundgangs.
// Aufruf: node tests/waechter-fehlalarm.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const server = lies("supabase/functions/kc-club/index.ts");
// vAelter nachgebildet aus dem Server-Text (TypeScript-Typen entfernt)
const i = server.indexOf("function vAelter("), quelle = server.slice(i, server.indexOf("\n}\n", i) + 2).replace(/: string/g, "");
const vAelter = new Function(`${quelle}; return vAelter;`)();
assert.equal(vAelter("2.790.0", "2.792.0"), true);
assert.equal(vAelter("2.792.0", "2.790.0"), false, "neuere App ist nicht alt");
assert.equal(vAelter("2.792.0", "2.792.0"), false);
assert.equal(vAelter("2.23.87", "2.792.0"), true, "Zahlen, nicht Buchstaben");
assert.equal(vAelter("2.1000.0", "2.999.9"), false);
assert.equal(vAelter("quatsch", "2.792.0"), true, "Unlesbares gilt als alt");
// Maßstab: neueste Version im Umlauf, mindestens die des Servers
assert.ok(server.includes("reduce((m, k) => (vAelter(m, k) ? k : m), SERVER_VERSION);") && server.includes("filter(([k]) => vAelter(k, neueste))"));
// Geheimnis-Wächter: nur der Teil „tests“ von tests.yml, Teil nicht lesbar → unbekannt
assert.ok(server.includes('const WAECHTER_GH_TEIL: Record<string, string> = { "tests.yml": "tests" };'));
assert.ok(server.includes("if (!job) { delete v[f]; return; }") && server.includes("ergebnis: job.conclusion"));
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/waechter-fehlalarm.test.mjs"), "läuft in der CI");
console.log("waechter-fehlalarm: ok");
