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
  assert.equal(l.length, 3, "vergangener Termin fällt weg");
  assert.deepEqual([l[0].art, l[0].name, l[0].frei, l[0].titel], ["biete", "Hansi", 2, "Köcheclub-Sitzung"], "Angebot mit freien Plätzen, früherer Termin zuerst");
  assert.deepEqual([l[1].art, l[1].id, l[1].plaetze, l[1].frei], ["voll", "M2", 1, undefined], "KC-CLUB-MITFAHRT-AUSGEBUCHT: volles Angebot → art voll, nach dem freien");
  assert.deepEqual([l[2].art, l[2].name, l[2].bezug_art], ["suche", "Anne", "aktion"], "Suche zur Aktion");
  // KC-CLUB-MITFAHRT-AUSGEBUCHT: Gäste zählen mit (der Laden zählt kc_club_mitfahrt_gast in plaetzeBelegt) – 1 Mitfahrer + 2 Gäste = 3 von 3
  const g = mitfahrtLaufbandListe([angebote[0]], [], new Map([["M1", 3]]), termine, name);
  assert.deepEqual([g.length, g[0].art, g[0].name], [1, "voll", "Hansi"], "Gäste belegen Plätze → ausgebucht");
  // Vorrang: zu viele Einträge → Suchen und freie Angebote vor „voll“
  const viele = [], suchenV = [];
  for (let i = 0; i < 6; i++) viele.push({ id: "V" + i, bezug_art: "treffen", bezug_id: "T1", fahrer: "P-V" + i, plaetze: 2 });
  for (let i = 0; i < 4; i++) suchenV.push({ bezug_art: "aktion", bezug_id: "A1", person_id: "P-S" + i });
  const frei1 = { id: "F1", bezug_art: "aktion", bezug_id: "A1", fahrer: "P-F", plaetze: 4 };
  const belegt = new Map(viele.map((m) => [m.id, 2]));
  const v = mitfahrtLaufbandListe([...viele, frei1], suchenV, belegt, termine, name);
  assert.equal(v.length, 6, "höchstens MITFAHRT_LB_MAX");
  assert.deepEqual(v.map((x) => x.art), ["voll", "suche", "suche", "suche", "suche", "biete"], "4 Suchen + 1 freies Angebot bleiben, nur 1 volles füllt auf; Reihenfolge nach Termin");
  assert.ok(srv.includes('select("mitfahrt_id").in("mitfahrt_id", mids); for (const x of [...(pl ?? []), ...await mitfahrtGaeste(mids)])'), "Laden zählt Gäste mit");
  assert.ok(!JSON.stringify(l).includes("notiz"), "keine Notizen im Laufband");
}
assert.ok(/const pMfLb = mitfahrtLaufband\(ich\)\.catch\(/.test(srv) && /mitfahrtenOffen: await pMfLb,/.test(srv), "init liefert mitfahrtenOffen, Fehler stören den Start nicht");
assert.ok(/MITFAHRT_LB_MS = 5 \* 60000/.test(srv) && /ich\.zugang !== "mitglied" && ich\.zugang !== "aushilfe"\) return \[\];/.test(srv.slice(srv.indexOf("async function mitfahrtLaufband("))), "gemerkt (sparsam), nur Mitglieder/Aushilfen");
for (const c of ["mitfahrt_anbieten", "mitfahrt_platz", "mitfahrt_gast", "mitfahrt_suchen", "mitfahrt_loeschen"]) // mitfahrt_platz auch in Vertretung (fuer → gleiche Aktion)
  assert.ok(new RegExp(`case "${c}": \\{\\n        mitfahrtLaufbandVergessen\\(\\);`).test(srv), `${c} verwirft die gemerkte Liste`);

// App: Laufband-Eintrag
{
  const teil = app.slice(app.indexOf("function ilMitfahrt(m)"), app.indexOf("function ilTerminLink(id)"));
  const fTag = { format: () => "Sa., 28.11." }, wann = () => "Di., 24.11. um 18:00";
  const ilMitfahrt = new Function("fTag", "wann", teil + "\nreturn ilMitfahrt;")(fTag, wann);
  let e = ilMitfahrt({ art: "biete", id: "M1", name: "Hansi", frei: 2, bezug_art: "treffen", bezug_id: "T1", titel: "Köcheclub-Sitzung", beginn: "x" });
  assert.equal(e.sym, "🚗"); assert.equal(e.t, "Hansi bietet eine Mitfahrt an"); assert.match(e.u, /Köcheclub-Sitzung · Di\., 24\.11\. um 18:00 · 2 Plätze frei – mitfahren\? Antippen/);
  assert.equal(e.auf, 'ilMitfahrtOeffnen("treffen", "T1")', "KC-CLUB-MITFAHRT-SPRUNG: direkt zum Abschnitt Mitfahren");
  e = ilMitfahrt({ art: "suche", id: "x", name: "Anne", bezug_art: "aktion", bezug_id: "A1", titel: "Adventsmarkt", beginn: "x" });
  assert.equal(e.sym, "🙋"); assert.equal(e.t, "Anne sucht eine Mitfahrgelegenheit"); assert.equal(e.auf, 'ilMitfahrtOeffnen("aktion", "A1")');
  e = ilMitfahrt({ art: "biete", id: "M1", eigen: true, frei: 1, bezug_art: "treffen", bezug_id: "T1", titel: "Köcheclub-Sitzung", beginn: "x" });
  assert.equal(e.t, "Du bietest eine Mitfahrt an"); assert.match(e.u, /1 Platz frei$/); assert.equal(e.stufe, "gold", "eigene auch gelb (Fund Hansi 20.11.)");
  // KC-CLUB-MITFAHRT-AUSGEBUCHT
  e = ilMitfahrt({ art: "voll", id: "M2", name: "Hansi", plaetze: 3, bezug_art: "treffen", bezug_id: "T1", titel: "Köcheclub-Sitzung", beginn: "x" });
  assert.deepEqual([e.id, e.sym, e.t, e.stufe], ["mitfahrt:voll:M2", "🚗", "Hansis Mitfahrt ist ausgebucht", "weiss"], "für alle sichtbar, ruhiger als ein freies Angebot");
  assert.equal(e.u, "Köcheclub-Sitzung · Di., 24.11. um 18:00 · alle 3 Plätze sind vergeben"); assert.equal(e.auf, 'ilMitfahrtOeffnen("treffen", "T1")', "Antippen öffnet die Mitfahrt beim Termin");
  e = ilMitfahrt({ art: "voll", id: "M2", name: "Klaus", plaetze: 1, bezug_art: "aktion", bezug_id: "A1", titel: "Adventsmarkt", beginn: "2026-11-28T12:00:00Z" });
  assert.equal(e.t, "Klaus’ Mitfahrt ist ausgebucht"); assert.match(e.u, /der Platz ist vergeben$/);
  e = ilMitfahrt({ art: "voll", id: "M2", eigen: true, name: "Hansi", plaetze: 2, bezug_art: "treffen", bezug_id: "T1", titel: "Köcheclub-Sitzung", beginn: "x" });
  assert.equal(e.t, "Deine Mitfahrgelegenheit ist ausgebucht ✅"); assert.equal(e.stufe, "gold", "eigene gelb wie bisher");
}
assert.ok(/for \(const m of INIT\?\.mitfahrtenOffen \|\| \[\]\) add\(ilMitfahrt\(m\)\);/.test(app), "Laufband nutzt die Startdaten (keine eigene Abfrage)");
console.log("mitfahrt-laufband: alle Prüfungen bestanden");
// KC-CLUB-LAUFBAND-LISTE (20.11.2026): ▾ am oberen Rand → Rollliste aller Meldungen; eigene Mitfahrt nicht mehr „weiß“ hinter den 7
{
  const { readFileSync } = await import("node:fs");
  const a = readFileSync(new URL("../app.js", import.meta.url), "utf8"), h = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const chk = (b, t) => { if (!b) throw new Error(t); };
  chk(/IL\.alle = \[tf, \.\.\.sichtbar\.filter\(\(m\) => m\.id !== tf\.id\)\];/.test(a), "Liste enthält alle Meldungen");
  chk(/class="il-alle" aria-expanded=/.test(a) && /onclick="event\.stopPropagation\(\);ilListeUmschalten\(\)"/.test(a), "▾-Knopf am Laufband");
  chk(/function ilListeUmschalten\(\)/.test(a) && /new Function\(m\.auf\)\(\)/.test(a.slice(a.indexOf("function ilListeUmschalten"))), "Antippen springt dorthin");
  chk(/stufe: "gold", sym: m\.art === "biete" \? "🚗" : "🙋"/.test(a), "eigene Mitfahrt gelb, nicht weiß");
  chk(/String\(m\.id\)\.startsWith\("mitfahrt:"\) \|\| l\.indexOf\(m\) < 7/.test(a), "Mitfahrten fallen nicht hinter die 7");
  chk(/\.il-alle \{ position: absolute; top: -2px;/.test(h) && /\.il-liste \{[^}]*max-height: 62vh; overflow-y: auto;/.test(h), "CSS Pfeil und Rollliste");
  console.log("mitfahrt-laufband (Liste): ok");
}
// KC-CLUB-MITFAHRT-SPRUNG (20.11.2026, Fund Hansi „gelangt in den Kalender, aber nicht genau zur Mitfahrgelegenheit“)
{
  const { readFileSync } = await import("node:fs");
  const a = readFileSync(new URL("../app.js", import.meta.url), "utf8"), h = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  const f = a.slice(a.indexOf("function ilMitfahrtOeffnen("), a.indexOf("function ilTerminLink("));
  if (!/if \(\+\+n < 30\) setTimeout\(v, 300\)/.test(f) || !/treffenInfo\(id, false\)/.test(f) || !/querySelector\("\.mf-block"\)/.test(f) || !/scrollIntoView/.test(f)) throw new Error("wartet auf den Termin, öffnet ihn und rollt zu „Mitfahren“");
  if (!/<div class="mf-block" style=/.test(a) || !/\.mf-block\.mf-blitz \{ animation: aufblitzen/.test(h)) throw new Error("Abschnitt Mitfahren markiert und leuchtet auf");
  console.log("mitfahrt-laufband (Sprung): ok");
}
