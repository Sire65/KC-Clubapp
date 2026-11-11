// KC-EINSPIELEN-SPERRE (04.11.2026, Wunsch Hansi „Eigentlich hätte ja kein Update reingespielt werden dürfen … Anne, Wilfried und ich waren drin“
// – „Ja bauen oder ich sage es explizit: Einspielen“). Aufruf: node tests/einspielen-sperre.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
const wurzel = new URL("..", import.meta.url).pathname;
const server = fs.readFileSync(wurzel + "supabase/functions/kc-club/index.ts", "utf8");
const seite = fs.readFileSync(wurzel + ".github/workflows/seite-veroeffentlichen.yml", "utf8");
const srv = fs.readFileSync(wurzel + ".github/workflows/server-hochladen.yml", "utf8");
const agents = fs.readFileSync(wurzel + "AGENTS.md", "utf8");
// Server: nur eine Zahl, nur für die Einspiel-Abläufe, vor der normalen Anmeldung
assert.ok(/if \(a === "einspielen_ruhe"\) return await einspielenRuhe\(req\);/.test(server), "Frage vor der Anmeldung");
assert.ok(/async function einspielenRuhe\(req: Request\) \{\n\s+const quelle = await einspielenQuelle\(req\);\n\s+if \(!quelle\) return json\(\{ error: "nicht berechtigt" \}, 401\);/.test(server), "nur GitHub-Abläufe");
assert.ok(/\.select\("person_id"\)\.eq\("aktiv", true\)\s*\.gt\("zuletzt_gesehen", new Date\(Date\.now\(\) - 3 \* 60000\)/.test(server) && /return json\(\{ ok: true, drin: new Set/.test(server), "nur die Zahl, 3 Minuten wie AGENTS.md");
// Abläufe: Prüfung direkt vor dem Wartungsfenster (also kurz vor dem Ankommen)
for (const [n, y] of [["Seite", seite], ["Server", srv]]) {
  assert.ok(/- name: Termin und Ruhe abwarten[^]*?tools\/einspielen-ruhe\.sh "\$art" "\$neu"\n\s+(#[^\n]*\n\s+)?- name: Wartungsfenster an/.test(y), n + ": Sperre direkt vor dem Wartungsfenster");
  assert.ok(/\*"\[Notfall\]"\*\) art=notfall;; \*"\[Hansi: einspielen\]"\*\) art=hansi;;/.test(y) && /inputs:\n\s+art:/.test(y), n + ": Hansi/Notfall über Commit-Text oder Run workflow");
}
assert.ok(/git diff --quiet "\$VORHER" HEAD -- version\.json && neu=nein/.test(seite), "Seite: ohne neue Version kein Warten");
// Skript wirklich ausführen (mit Testwerten, ohne Netz)
const lauf = (args, env) => spawnSync("bash", [wurzel + "tools/einspielen-ruhe.sh", ...args], { env: { PATH: process.env.PATH, EINSPIEL_TAKT: "0", EINSPIEL_RUNDEN: "3", ...env }, encoding: "utf8" }).status;
const ruhig = { EINSPIEL_UTC: "1900", EINSPIEL_DRIN: "2" };
assert.equal(lauf(["termin", "ja"], { ...ruhig, EINSPIEL_UHR: "2000" }), 0, "20 Uhr, 2 drin → einspielen");
assert.equal(lauf(["termin", "ja"], { ...ruhig, EINSPIEL_UHR: "1216" }), 0, "12 Uhr → einspielen");
assert.equal(lauf(["termin", "ja"], { ...ruhig, EINSPIEL_UHR: "1816" }), 1, "18:16 ohne Hansi → nein (Fall 2.858.0)");
assert.equal(lauf(["termin", "ja"], { ...ruhig, EINSPIEL_UHR: "0905" }), 1, "09:05 → nein");
assert.equal(lauf(["hansi", "ja"], { ...ruhig, EINSPIEL_UHR: "1816" }), 0, "Hansi sagt einspielen → ja");
assert.equal(lauf(["hansi", "ja"], { EINSPIEL_UTC: "1716", EINSPIEL_DRIN: "3" }), 1, "3 drin → warten, dann Abbruch");
assert.equal(lauf(["termin", "ja"], { EINSPIEL_UHR: "2000", EINSPIEL_UTC: "1615", EINSPIEL_DRIN: "0" }), 1, "Spiegelung läuft → warten");
assert.equal(lauf(["termin", "ja"], { EINSPIEL_UHR: "2000", EINSPIEL_UTC: "0150", EINSPIEL_DRIN: "0" }), 1, "FRA-Sicherung läuft → warten");
assert.equal(lauf(["notfall", "ja"], { EINSPIEL_UHR: "1816", EINSPIEL_DRIN: "9" }), 0, "Notfall → sofort");
assert.equal(lauf(["termin", "nein"], { EINSPIEL_UHR: "1816", EINSPIEL_DRIN: "9" }), 0, "keine neue Version → nichts abzuwarten");
// Regel steht in AGENTS.md
assert.ok(/KC-EINSPIELEN-SPERRE/.test(agents) && /\[Hansi: einspielen\]/.test(agents) && /\[Notfall\]/.test(agents), "Regel in AGENTS.md");
// 2.917.0 KC-CLUB-RUNDGANG-PFLICHT (Hansi 11.11.2026): veröffentlicht wird nur nach grünem Klick-Rundgang
assert.ok(/\n  rundgang:\n[\s\S]*?node tests\/rundgang\.browser\.mjs/.test(seite) && /\n  bauen:\n    needs: \[tests, rundgang\]/.test(seite), "Rundgang ist Pflicht vor dem Bauen");
console.log("einspielen-sperre: alle Prüfungen bestanden");
