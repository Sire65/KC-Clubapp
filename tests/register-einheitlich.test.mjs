// KC-CLUB-REGISTER-EINHEITLICH (03.11.2026, Wunsch Hansi „alles soll gleich sein“). Aufruf: node tests/register-einheitlich.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), srv = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261103_kc_club_register_einheitlich.sql");
const obj = (src) => Function(`return ${src}`)();

// eine Liste – Server, App und Migration gleich
const srvListe = obj(srv.match(/const REGISTER_EINHEITLICH: Record<string, string> = (\{[\s\S]*?\});/)[1]);
const appListe = obj(app.match(/const AR_REG_EINHEITLICH = (\{[^\n]*\});/)[1]);
const migListe = Object.fromEntries([...mig.match(/with m\(alt, neu\) as \(values ([\s\S]*?)\),\n  t as/)[1].matchAll(/\('([^']+)', '([^']+)'\)/g)].map((m) => [m[1], m[2]]));
assert.deepEqual(appListe, srvListe, "App = Server");
assert.deepEqual(migListe, srvListe, "Migration = Server");

// Vorgaben enthalten keine alten Namen; „Sonstiges“ immer zuletzt
const arten = srv.match(/const ARCHIV_ARTEN[^=]*= \{([\s\S]*?)\n\};/)[1];
for (const m of arten.matchAll(/^\s+(\w+): \{[^\n]*register: (\[[^\]]*\])/gm)) {
  const reg = JSON.parse(m[2]);
  assert.equal(reg[reg.length - 1], "Sonstiges", `${m[1]}: Sonstiges zuletzt`);
  for (const r of reg) assert.ok(!srvListe[r], `${m[1]}: alter Name ${r}`);
}
assert.match(srv, /vertraege: \{[^\n]*register: \["Vereinsverträge", "Versicherungen", "Miete & Räume", "Lieferanten", "Sonstiges"\]/, "wie der feste Ordner Verträge");
for (const alt of Object.keys(srvListe)) {
  assert.doesNotMatch(app.replace(/const AR_REG_EINHEITLICH = [^\n]*/, ""), new RegExp(`\\["${alt}"\\]|register: \\[[^\\]]*"${alt}"`), `App: ${alt} nicht mehr als Register-Vorgabe`);
  assert.doesNotMatch(srv.replace(/const REGISTER_EINHEITLICH[\s\S]*?\};/, ""), new RegExp(`register: \\[[^\\]]*"${alt}"|\\["${alt}"\\]`), `Server: ${alt} nicht mehr als Register-Vorgabe`);
}
assert.match(app, /const REG = \["Protokolle", "Vorschläge", "Sonstiges"\];/);

// Server vereinheitlicht beim Speichern (Dokumente ziehen mit) und beim Ablegen
assert.match(srv, /map\(\(x\) => registerEinheitlich\(txt\(x, 30\)\)\)/);
assert.match(srv, /const auto = vorher\.filter\(\(r\) => registerEinheitlich\(r\) !== r\)/);
assert.match(srv, /o\.register\.includes\(gewuenscht\) \? gewuenscht/);
const ein = Function("REGISTER_EINHEITLICH", `return ${srv.match(/const registerEinheitlich = (\(r: string\) => \{[^\n]*\});/)[1].replace("(r: string)", "(r)")};`)(srvListe);
assert.equal(ein("Allgemein"), "Sonstiges"); assert.equal(ein("2026 › Protokoll"), "2026 › Protokolle"); assert.equal(ein("Preislisten"), "Preislisten");
const paareSrc = srv.match(/function registerUmbenennenPaare[\s\S]*?\n\}/)[0].replace(/: unknown|: string\[\]|: \{ alt: string; neu: string \}\[\]/g, "").replace(/new Set<string>\(\)/g, "new Set()").replace(/\(x as any\)/g, "x");
const paare = Function("txt", "registerEinheitlich", `${paareSrc}; return registerUmbenennenPaare;`)((v, n) => String(v ?? "").trim().slice(0, n), ein);
assert.deepEqual(paare([], ["Protokoll", "Sitzungsprotokolle", "Anlagen"], ["Protokolle", "Anlagen"]),
  [{ alt: "Protokoll", neu: "Protokolle" }, { alt: "Sitzungsprotokolle", neu: "Protokolle" }], "zwei alte → ein Register zusammengelegt");

// Migration: nur Vereinsordner, Mitglieder → Personal, alter Ordner in den Papierkorb (nicht gelöscht)
assert.match(mig, /where o\.id = d\.ordner_id and o\.besitzer is null/);
assert.match(mig, /where o\.besitzer is null and exists \(select 1 from unnest\(o\.register\)/);
assert.match(mig, /update public\.kc_club_archiv_ordner set geloescht_am = now\(\), geloescht_von = alt\.erstellt_von where id = alt\.id;/);
assert.doesNotMatch(mig, /\bdelete\b|drop table/i);
assert.ok(fs.existsSync(new URL("../tools/db-test/106_register_einheitlich_test.sql", import.meta.url)));

// App: Formular zeigt alte Namen gleich vereinheitlicht und merkt sich das Umbenennen
const logik = app.match(/let arRegUm = \[\], arRegVorher = \[\];[\s\S]*?function arRegEntfernen[^\n]*\n/)[0];
const t = Function("eingabe", "melde", "arRegZeigen", `let arReg = []; ${logik}; return { start: arRegStart, um: arRegUmbenennen, z: () => ({ arReg, arRegUm }) };`)(async () => "Sitzungen", () => {}, () => {});
t.start(["Protokoll", "Sitzungsprotokolle", "Anlagen"]);
assert.deepEqual(t.z(), { arReg: ["Protokolle", "Anlagen"], arRegUm: [{ alt: "Protokoll", neu: "Protokolle" }, { alt: "Sitzungsprotokolle", neu: "Protokolle" }] });
await t.um(0);
assert.deepEqual(t.z().arRegUm, [{ alt: "Protokoll", neu: "Sitzungen" }, { alt: "Sitzungsprotokolle", neu: "Sitzungen" }], "beide alten ziehen mit um");
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/register-einheitlich.test.mjs"), "läuft in der CI");
console.log("register-einheitlich: ok");
