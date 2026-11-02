// KC-CLUB-PINNWAND-NADELN (2.813.0, Wunsch #64 Hansi): gelesene Zettel ab dem Folgetag als Nadel im Rahmen bzw. unter „Ältere Zettel“.
// Aufruf: node tests/pinnwand-nadeln.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync("index.html", "utf8"), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");
// Server: nur der eigene Zeitpunkt „zuerst gesehen“ – vorhandene Tabelle, keine neue Abfrage
assert.ok(/gesehen: vonMir \? null : meine\?\.gesehen_am \?\? null,/.test(server), "eigener Gesehen-Zeitpunkt je Zettel");
// App: Regel echt ausführen
const a = app.indexOf("const pwAlt = (z) =>"), code = app.slice(a, app.indexOf("function pwNadel(", a));
const heute = "2026-11-02";
const { pwAlt, pwNadelFuerMich } = new Function("pwOffen", "heuteIso", "berlinTagApp", "ICH", code + "\nreturn { pwAlt, pwNadelFuerMich };")(
  (z) => z.wichtig && !z.erledigt && (!z.vonMir || z.fuer === "ich"), () => heute, (t) => String(t).slice(0, 10), { admin: false });
const gestern = "2026-11-01T18:00:00Z", heuteZ = "2026-11-02T08:00:00Z";
assert.equal(pwAlt({ gesehen: gestern }), true, "gestern gesehen → ab heute abgelegt");
assert.equal(pwAlt({ gesehen: heuteZ }), false, "heute gesehen → bleibt bis morgen groß");
assert.equal(pwAlt({ gesehen: null }), false, "nie gesehen → groß");
assert.equal(pwAlt({ gesehen: gestern, wichtig: true }), false, "wichtig und nicht erledigt → bleibt groß");
assert.equal(pwAlt({ gesehen: gestern, wichtig: true, erledigt: heuteZ }), true, "wichtig, aber erledigt → abgelegt");
assert.equal(pwAlt({ vonMir: true, fuer: "alle", anzahl: 3, offen: [], erstellt_am: gestern }), true, "eigener Zettel, alle haben ihn gesehen");
assert.equal(pwAlt({ vonMir: true, fuer: "alle", anzahl: 3, offen: ["Klaus"], erstellt_am: gestern }), false, "eigener Zettel, noch nicht alle");
assert.equal(pwAlt({ vonMir: true, fuer: "ich", erstellt_am: gestern }), false, "Zettel nur für mich bleibt");
assert.equal(pwNadelFuerMich({ vonMir: false }), false, "Mitglied: fremde Zettel unter „Ältere Zettel“");
assert.equal(pwNadelFuerMich({ vonMir: true }), true, "eigene Zettel als Nadel");
assert.ok(/ICH\?\.admin \|\| ICH\?\.vorstand/.test(code), "Admin und Clubleitung sehen Nadeln");
// Anzeige: Nadel antippen macht groß, nichts wird gelöscht
assert.ok(/onclick="pwNadel\('\$\{esc\(z\.id\)\}'\)"/.test(app) && /📌 wieder als Nadel/.test(app), "antippen = groß, zurück = Nadel");
assert.ok(/🗂️ Ältere Zettel ansehen \(\$\{archiv\.length\}\)/.test(app), "Mitglieder sehen ältere Zettel auf Knopfdruck");
assert.ok(!/pinnwand_gelesen[^\n]*delete/.test(server.slice(server.indexOf('case "pinnwand": {'), server.indexOf('case "pinnwand_anheften"'))), "nichts gelöscht");
assert.ok(/\.kork \.pw-nadel\.f1 \{ --nadel:/.test(html) && /\.kork \.pw-nadel\.f4 \{ --nadel:/.test(html), "Nadel in Zettelfarbe");
console.log("pinnwand-nadeln: alle Prüfungen bestanden");
