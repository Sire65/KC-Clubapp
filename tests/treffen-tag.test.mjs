// KC-CLUB-TREFFEN-KALENDERTAG (2.761.0, Fund Hansi 30.10.2026 7:22 „Clubtreffen zeigt Morgen statt Heute 18 Uhr“): Kalendertage in deutscher Zeit.
// Aufruf: node tests/treffen-tag.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const quelle = app.slice(app.indexOf("const cdTageBis = "), app.indexOf("\n", app.indexOf("const cdTageBis = ")));
const TZ = "Europe/Berlin", berlinIso = (iso) => new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(new Date(iso));
const tageUm = (jetzt, beginn) => new Function("heuteIso", quelle + "; return cdTageBis;")(() => berlinIso(jetzt))(berlinIso(beginn));
assert.equal(tageUm("2026-10-30T06:22:00Z", "2026-10-30T17:00:00Z"), 0, "7:22 Uhr, Treffen 18 Uhr → heute");
assert.equal(tageUm("2026-10-29T23:30:00Z", "2026-10-30T17:00:00Z"), 0, "0:30 Uhr deutsche Zeit → heute");
assert.equal(tageUm("2026-10-29T22:30:00Z", "2026-10-30T17:00:00Z"), 1, "23:30 Uhr deutsche Zeit am Vortag → morgen");
assert.equal(tageUm("2026-10-29T20:00:00Z", "2026-10-30T17:00:00Z"), 1, "abends am Vortag → morgen");
assert.equal(tageUm("2026-10-24T08:00:00Z", "2026-10-30T17:00:00Z"), 6, "über die Zeitumstellung hinweg");
const it = app.slice(app.indexOf("function infoTreffen()"), app.indexOf("function infoTreffen()") + 1500);
assert.match(it, /const tage = cdTageBis\(berlinIso\(t\.beginn\)\);/, "Kopf-Feld zählt Kalendertage");
assert.match(it, /tage <= 0 \? `Heute \$\{new Intl\.DateTimeFormat\("de-DE", \{ timeZone: TZ, hour: "2-digit", minute: "2-digit" \}\)\.format\(new Date\(t\.beginn\)\)\}`/, "heute mit Uhrzeit");
assert.ok(!/Math\.ceil\(\(new Date\(t\.beginn\) - Date\.now\(\)\) \/ 86400000\)/.test(app), "keine Stunden-Aufrundung mehr");
assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/treffen-tag.test.mjs"), "läuft in der CI");
console.log("treffen-tag: ok");
