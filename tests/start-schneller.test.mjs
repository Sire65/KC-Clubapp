// KC-CLUB-START-SCHNELLER (2.837.0, Gesamtprüfung #44 F): oft gerufene Datums-Helfer bauen ihr Format nicht bei jedem Aufruf neu
// (heuteIso() lief beim Start hunderte Male und kostete auf dem Handy ≈ 0,1 s). Aufruf: node tests/start-schneller.test.mjs
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
assert.ok(/const TAG_ISO_FMT = new Intl\.DateTimeFormat\("sv-SE", \{ timeZone: TZ \}\)/.test(app), "ein gemeinsames Tagesformat");
for (const name of ["heuteIso", "berlinIso", "isoBerlin", "tagVon", "kkJetzt"]) {
  const m = app.match(new RegExp(`const ${name} = \\([^)]*\\) => [^\\n]*`)); assert.ok(m, name + " vorhanden");
  assert.ok(!/new Intl\.DateTimeFormat/.test(m[0]), `${name} baut kein Format je Aufruf`);
}
assert.ok(!/=> new Intl\.DateTimeFormat\("sv-SE", \{ timeZone: TZ \}\)\.format/.test(app), "kein Tagesformat je Aufruf mehr");
// Ergebnis gleich wie vorher
const TZ = "Europe/Berlin", f = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ });
for (const d of [new Date("2026-03-29T00:30:00Z"), new Date("2026-10-25T23:30:00Z"), new Date("2026-12-31T23:30:00Z")])
  assert.equal(f.format(d), new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(d));
assert.equal(f.format(new Date("2026-12-31T23:30:00Z")), "2027-01-01", "Berliner Datum, nicht UTC");
console.log("start-schneller: alle Prüfungen bestanden");
