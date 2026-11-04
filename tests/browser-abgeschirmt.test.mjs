// KC-TESTS-OHNE-ECHTSERVER (04.11.2026, Wunsch Hansi): jedes Browser-Skript schirmt alle Anfragen ab – nie gegen den echten Club-Server.
// Aufruf: node tests/browser-abgeschirmt.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const wurzel = new URL("../", import.meta.url);
const dateien = ["tests", "tools"].flatMap((d) => fs.readdirSync(new URL(d + "/", wurzel)).filter((f) => /\.(mjs|js|cjs)$/.test(f)).map((f) => `${d}/${f}`))
  .filter((f) => f !== "tests/browser-abgeschirmt.test.mjs");
let browser = 0;
for (const f of dateien) {
  const s = fs.readFileSync(new URL(f, wurzel), "utf8");
  if (!/\b(chromium|firefox|webkit|puppeteer)\b[\s\S]{0,200}\.launch\(/.test(s) && !/\.launch\(\)/.test(s) && !/newPage\(\)/.test(s)) continue;
  if (!/\.goto\(/.test(s)) continue;
  browser++;
  const gotos = (s.match(/\.goto\(/g) || []).length, routes = (s.match(/\.route\("\*\*\/\*"/g) || []).length;
  assert.ok(routes >= 1, `${f}: Browser ohne seite.route("**/*", …) – jede Anfrage abschirmen (AGENTS.md KC-TESTS-OHNE-ECHTSERVER)`);
  assert.ok(/\.abort\(\)/.test(s), `${f}: fremde Anfragen müssen mit abort() enden`);
  assert.ok(!/https:\/\/ptblnpiroqftcvlsrhac\.supabase\.co\/functions/.test(s.replace(/\/\/[^\n]*/g, "")), `${f}: ruft den echten Server direkt auf`);
  assert.ok(routes >= Math.min(gotos, 1), `${f}: ${gotos} Seitenaufrufe, ${routes} Abschirmung(en)`);
  // Netzsperre (Pflicht seit 04.11.2026): jeder launch() bekommt die Sperre für Supabase, Cloudflare und GitHub
  assert.ok(/--host-resolver-rules=MAP \*\.supabase\.co 0\.0\.0\.0, MAP \*\.supabase\.com 0\.0\.0\.0/.test(s), `${f}: Netzsperre --host-resolver-rules fehlt`);
  const starts = [...s.matchAll(/\.launch\(([^)]*)\)/g)].map((m) => m[1]);
  assert.ok(starts.length && starts.every((a) => a.includes("OHNE_ECHTSERVER")), `${f}: jeder launch() mit args: [OHNE_ECHTSERVER, …]`);
}
assert.ok(browser >= 3, `Browser-Skripte gefunden: ${browser}`);
assert.ok(fs.readFileSync(new URL(".github/workflows/tests.yml", wurzel), "utf8").includes("node tests/browser-abgeschirmt.test.mjs"), "läuft in der CI");
console.log(`browser-abgeschirmt: ${browser} Browser-Skripte abgeschirmt`);
