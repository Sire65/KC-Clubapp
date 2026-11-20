// KC-CLUB-MITFAHRT-LAUFBAND (20.11.2026, Wunsch Hansi „zeige in der Laufschrift an, wenn jemand eine Mitfahrgelegenheit sucht oder anbietet“)
// Aufruf: node tests/mitfahrt-laufband.test.mjs   (ohne Netz)
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
const srv = readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");

// Server: reine Auswahl
{
  const teil = srv.slice(srv.indexOf("const MITFAHRT_LB_MS"), srv.indexOf("async function mitfahrtLaufbandLaden"));
  const { mitfahrtLaufbandListe } = new Function(stripTypeScriptTypes(teil, { mode: "transform" }) + "\nreturn { mitfahrtLaufbandListe };")();
  const termine = new Map([["treffen:T1", { titel: "Köcheclub-Sitzung", beginn: "2026-11-24T17:00:00Z" }], ["aktion:A1", { titel: "Adventsmarkt", beginn: "2026-11-28T12:00:00Z" }]]);
  const angebote = [{ id: "M1", bezug_art: "treffen", bezug_id: "T1", fahrer: "P-HANSI", plaetze: 3 }, { id: "M2", bezug_art: "treffen", bezug_id: "T1", fahrer: "P-VOLL", plaetze: 1 },
    { id: "M3", bezug_art: "treffen", bezug_id: "ALT", fahrer: "P-X", plaetze: 2 }];
  const suchen = [{ bezug_art: "aktion", bezug_id: "A1", person_id: "P-ANNE" }];
  const name = (p) => ({ "P-HANSI": "Hansi", "P-ANNE": "Anne" })[p] || "Jemand";
  const l = mitfahrtLaufbandListe(angebote, suchen, new Map([["M1", 1], ["M2", 1]]), termine, name);
  assert.equal(l.length, 2, "volles Angebot und vergangener Termin fallen weg");
  assert.deepEqual([l[0].art, l[0].name, l[0].frei, l[0].titel], ["biete", "Hansi", 2, "Köcheclub-Sitzung"], "Angebot mit freien Plätzen, früherer Termin zuerst");
  assert.deepEqual([l[1].art, l[1].name, l[1].bezug_art], ["suche", "Anne", "aktion"], "Suche zur Aktion");
  assert.ok(!JSON.stringify(l).includes("notiz"), "keine Notizen im Laufband");
}
assert.ok(/const pMfLb = mitfahrtLaufband\(ich\)\.catch\(/.test(srv) && /mitfahrtenOffen: await pMfLb,/.test(srv), "init liefert mitfahrtenOffen, Fehler stören den Start nicht");
assert.ok(/MITFAHRT_LB_MS = 5 \* 60000/.test(srv) && /ich\.zugang !== "mitglied" && ich\.zugang !== "aushilfe"\) return \[\];/.test(srv.slice(srv.indexOf("async function mitfahrtLaufband("))), "gemerkt (sparsam), nur Mitglieder/Aushilfen");
for (const c of ["mitfahrt_anbieten", "mitfahrt_platz", "mitfahrt_suchen", "mitfahrt_loeschen"])
  assert.ok(new RegExp(`case "${c}": \\{\\n        mitfahrtLaufbandVergessen\\(\\);`).test(srv), `${c} verwirft die gemerkte Liste`);

// App: Laufband-Eintrag
{
  const teil = app.slice(app.indexOf("function ilMitfahrt(m)"), app.indexOf("function ilTerminLink(id)"));
  const fTag = { format: () => "Sa., 28.11." }, wann = () => "Di., 24.11. um 18:00";
  const ilMitfahrt = new Function("fTag", "wann", teil + "\nreturn ilMitfahrt;")(fTag, wann);
  let e = ilMitfahrt({ art: "biete", id: "M1", name: "Hansi", frei: 2, bezug_art: "treffen", bezug_id: "T1", titel: "Köcheclub-Sitzung", beginn: "x" });
  assert.equal(e.sym, "🚗"); assert.equal(e.t, "Hansi bietet eine Mitfahrt an"); assert.match(e.u, /Köcheclub-Sitzung · Di\., 24\.11\. um 18:00 · 2 Plätze frei – mitfahren\? Antippen/);
  assert.equal(e.auf, 'ilTerminOeffnen("T1")');
  e = ilMitfahrt({ art: "suche", id: "x", name: "Anne", bezug_art: "aktion", bezug_id: "A1", titel: "Adventsmarkt", beginn: "x" });
  assert.equal(e.sym, "🙋"); assert.equal(e.t, "Anne sucht eine Mitfahrgelegenheit"); assert.equal(e.auf, 'aktionOeffnen("A1")');
  e = ilMitfahrt({ art: "biete", id: "M1", eigen: true, frei: 1, bezug_art: "treffen", bezug_id: "T1", titel: "Köcheclub-Sitzung", beginn: "x" });
  assert.equal(e.t, "Du bietest eine Mitfahrt an"); assert.match(e.u, /1 Platz frei$/); assert.equal(e.stufe, "weiss");
}
assert.ok(/for \(const m of INIT\?\.mitfahrtenOffen \|\| \[\]\) add\(ilMitfahrt\(m\)\);/.test(app), "Laufband nutzt die Startdaten (keine eigene Abfrage)");
console.log("mitfahrt-laufband: alle Prüfungen bestanden");
