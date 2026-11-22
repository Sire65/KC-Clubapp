// KC-CLUB-ADVENT-SERVERUHR (Wunsch Hansi 15.11.2026: „Jedes Türchen darf nur am Tag geöffnet werden, nicht schon vorher. Im Nachhinein ist es erlaubt … Ja, mit Server-Uhr absichern“)
// Aufruf: node tests/advent-serveruhr.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const stueck = (anf, ende) => { const i = app.indexOf(anf); assert.ok(i >= 0, anf); return app.slice(i, app.indexOf(ende, i)); };

assert.ok(/serverJetzt: Date\.now\(\), \/\* KC-CLUB-ADVENT-SERVERUHR/.test(server), "Server schickt beim Start seine Uhr mit");
assert.ok(/INIT = await initAnfrage; if \(window\.KCFP\?\.schlaeft\) return; uhrAbgleich\(INIT\);/.test(app), "App gleicht beim Start ab");
assert.ok(/if \(heute\.slice\(5, 7\) !== "12" \|\| Number\(heute\.slice\(8, 10\)\) < tag\) throw new Fehler/.test(server), "Preis-Türchen prüft der Server mit seiner Uhr");

const code = stueck("let UHR_VERSATZ = null;", "function akOffen()");
const R = (handyMs) => {
  const D = class extends Date { constructor(...a) { if (a.length) super(...a); else super(handyMs); } static now() { return handyMs; } };
  return new Function("Date", code.replace("let UHR_VERSATZ", "var UHR_VERSATZ") + "; return { uhrAbgleich, akHeute, akKey, get v() { return UHR_VERSATZ; } };")(D);
};
const t = (iso) => Date.parse(iso);

// Handy auf 20.12. vorgestellt, Server sagt 3.12. → Türchen 3, nicht 20
let r = R(t("2026-12-20T09:00:00Z"));
assert.equal(r.akHeute(), 20, "ohne Server-Zeit (offline): Handy-Uhr wie bisher");
r.uhrAbgleich({ serverJetzt: t("2026-12-03T09:00:00Z") });
assert.equal(r.akHeute(), 3, "vorgestelltes Handy-Datum öffnet nichts früher");
assert.equal(r.akKey(), "kc_club_advent_2026");
// Handy zurückgestellt (November), Server Dezember → trotzdem der richtige Tag
r = R(t("2026-11-10T09:00:00Z")); r.uhrAbgleich({ serverJetzt: t("2026-12-07T09:00:00Z") });
assert.equal(r.akHeute(), 7, "auch ein zurückgestelltes Handy bekommt den richtigen Tag");
// deutsche Zeit: 30.11. 23:30 UTC = 1.12. 0:30 in Berlin
r = R(t("2026-11-30T23:30:00Z")); r.uhrAbgleich({ serverJetzt: t("2026-11-30T23:30:00Z") });
assert.equal(r.akHeute(), 1, "Mitternacht nach deutscher Zeit");
// nach dem 24.: alle offen; Januar: kein Dezember
r = R(t("2026-12-28T09:00:00Z")); r.uhrAbgleich({ serverJetzt: t("2026-12-28T09:00:00Z") });
assert.equal(r.akHeute(), 24, "ab 25.12. alle Türchen (im Nachhinein erlaubt)");
r = R(t("2027-01-05T09:00:00Z")); r.uhrAbgleich({ serverJetzt: t("2027-01-05T09:00:00Z") });
assert.equal(r.akHeute(), 0);
// Unsinn vom Server → ignoriert
r = R(t("2026-12-10T09:00:00Z")); r.uhrAbgleich({ serverJetzt: "abc" }); r.uhrAbgleich({});
assert.equal(r.v, null, "ohne gültige Server-Zeit kein Versatz");

assert.ok(/if \(n > h && !akVorschau\(\)\) \{/.test(app), "spätere Türchen bleiben zu (nur Admin-Vorschau außerhalb Dezember)");
assert.ok(/const akSichtbar = \(\) => \(zugang\(\) === "mitglied" \|\| zugang\(\) === "aushilfe"\) && \(!!ICH\?\.admin \|\| akBerlin\(akJetzt\(\)\)\.m === 12\);/.test(app), "Sichtbarkeit ab Dezember nach Server-Uhr");
console.log("✅ advent-serveruhr: alle Prüfungen bestanden");
