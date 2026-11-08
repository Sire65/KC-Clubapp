// KC-SECURITY-DEFINER-REGISTER (08.11.2026, Wunsch Hansi): Jede Migration ab 08.11.2026, die eine SECURITY-DEFINER-Funktion in public anlegt,
// die angemeldete Programme (authenticated) oder Unangemeldete (anon) aufrufen dürfen, trägt sie ins Prüfregister kc_security_reviewed_exceptions ein
// (dieselbe oder eine spätere Migration) – sonst meldet der KC System Check GELB. Nur-Server-Funktionen (revoke … from public, anon, authenticated) brauchen nichts.
// Aufruf: node tests/security-definer-register.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const ordner = new URL("../supabase/migrations/", import.meta.url);
const ab = "20261108";
const dateien = fs.readdirSync(ordner).filter((f) => f.endsWith(".sql") && f.slice(0, 8) >= ab).sort();
const text = Object.fromEntries(dateien.map((f) => [f, fs.readFileSync(new URL(f, ordner), "utf8").replace(/--[^\n]*/g, "")]));
const alle = dateien.map((f) => text[f]).join("\n");
const fehler = [];
let geprueft = 0;
for (const f of dateien) {
  const s = text[f];
  for (const m of s.matchAll(/create\s+(?:or\s+replace\s+)?function\s+public\.([a-z0-9_]+)\s*\(([\s\S]*?)\)\s*returns[\s\S]*?(?:\$\$|\$[a-z_]*\$)/gi)) {
    if (!/security\s+definer/i.test(m[0])) continue;
    const name = m[1];
    geprueft++;
    const nachher = dateien.filter((x) => x >= f).map((x) => text[x]).join("\n");
    const grants = [...nachher.matchAll(new RegExp(`grant\\s+execute\\s+on\\s+function\\s+public\\.${name}\\s*\\([^)]*\\)\\s+to\\s+([^;]+);`, "gi"))].map((g) => g[1].toLowerCase());
    const revokePublic = new RegExp(`revoke\\s+(?:all|execute)\\s+on\\s+function\\s+public\\.${name}\\s*\\([^)]*\\)\\s+from\\s+[^;]*\\bpublic\\b`, "i").test(nachher);
    const revokeAnon = new RegExp(`revoke\\s+(?:all|execute)\\s+on\\s+function\\s+public\\.${name}\\s*\\([^)]*\\)\\s+from\\s+[^;]*\\banon\\b`, "i").test(nachher);
    const revokeAuth = new RegExp(`revoke\\s+(?:all|execute)\\s+on\\s+function\\s+public\\.${name}\\s*\\([^)]*\\)\\s+from\\s+[^;]*\\bauthenticated\\b`, "i").test(nachher);
    // ohne revoke from public darf jeder ausführen (Postgres-Standard)
    const anon = !revokePublic && !revokeAnon || grants.some((g) => /\banon\b/.test(g));
    const auth = !revokePublic && !revokeAuth || grants.some((g) => /\bauthenticated\b/.test(g));
    const register = (code) => new RegExp(`kc_security_reviewed_exceptions[\\s\\S]*?'${name}'[\\s\\S]*?${code}|kc_security_reviewed_exceptions[\\s\\S]*?${code}[\\s\\S]*?'${name}'`).test(nachher);
    if (auth && !register("security_definer_authenticated_execute")) fehler.push(`${f}: public.${name} – authenticated darf ausführen, fehlt im Prüfregister (security_definer_authenticated_execute)`);
    if (anon && !register("security_definer_anon_execute")) fehler.push(`${f}: public.${name} – anon darf ausführen, fehlt im Prüfregister (security_definer_anon_execute) – meist besser: revoke … from public, anon`);
  }
}
assert.deepEqual(fehler, [], "SECURITY-DEFINER-Funktionen ins Prüfregister (AGENTS.md KC-SECURITY-DEFINER-REGISTER)");
assert.ok(geprueft >= 2, `geprüfte Funktionen: ${geprueft}`);
assert.ok(alle.includes("'kc_dp_rueckmeldung_entscheiden'") && alle.includes("'kc_dp_rueckmeldungen_liste'"));
assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/security-definer-register.test.mjs"), "läuft in der CI");
console.log(`security-definer-register: ${geprueft} Funktion(en) geprüft – ok`);
