// KC-CLUB-AUFGABEN-STAND (19.11.2026, Wunsch Hansi „Gib allen mit offenen Aufgaben eine Startmeldung mit der Aufgabe und ob sie erledigt ist: Ja, teilweise, nein.
// Das Ergebnis muss dann im nächsten Protokoll erscheinen als erledigt am, oder teilweise oder noch nicht.“). Aufruf: node tests/aufgaben-stand.test.mjs (offline)
// Rechnet die „dran“-Logik und den Protokoll-Abschnitt mit Beispieldaten nach (keine echten Aufgaben) und prüft die Stellen in Server, App, Migration.
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const srv = lies("supabase/functions/kc-club/index.ts"), app = programmText();
const funktion = (q, kopf) => { const a = q.indexOf(kopf); assert.ok(a >= 0, `${kopf} fehlt`); return q.slice(a, q.indexOf("\n}\n", a) + 2); };
const ohneTypen = (t) => t.replace(/: any(\[\])?/g, "");
const konst = srv.slice(srv.indexOf("const AST_TAG_MS = "), srv.indexOf("\n", srv.indexOf("const AST_TAG_MS = ")));
const dran = new Function(ohneTypen(konst + "\n" + funktion(srv, "function aufgabeStandDran(")) + "\nreturn aufgabeStandDran;")();
const liste = new Function(ohneTypen(funktion(srv, "function aufgabenStandListe(")) + "\nreturn aufgabenStandListe;")();

// ---- 1. Wann kommt die Startmeldung? (Sitzung 24.11.2026 18:00 Uhr Berlin = 17:00 UTC)
const S = Date.parse("2026-11-24T17:00:00Z"), T = 86400000, A = (x = {}) => ({ id: "a1", stand: "offen", erledigt_am: null, faellig: null, ...x });
const um = (iso) => Date.parse(iso);
assert.equal(dran(A(), S, um("2026-11-16T10:00:00Z"), "2026-11-16"), null, "8 Tage vorher: noch nicht");
assert.equal(dran(A(), S, um("2026-11-19T10:00:00Z"), "2026-11-19"), "sitzung", "≤ 7 Tage vorher, keine Meldung → fragen");
assert.equal(dran(A({ stand: "erledigt" }), S, um("2026-11-19T10:00:00Z"), "2026-11-19"), null, "erledigt → nie wieder");
assert.equal(dran(A({ erledigt_am: "2026-11-18T10:00:00Z" }), S, um("2026-11-19T10:00:00Z"), "2026-11-19"), null, "abgehakt → nie wieder");
assert.equal(dran(A({ spaeter_bis: "2026-11-20T10:00:00Z", gefragt_am: "2026-11-19T10:00:00Z" }), S, um("2026-11-19T12:00:00Z"), "2026-11-19"), null, "Später → 24 Std. Ruhe");
assert.equal(dran(A({ spaeter_bis: "2026-11-20T10:00:00Z", gefragt_am: "2026-11-19T10:00:00Z" }), S, um("2026-11-21T10:00:00Z"), "2026-11-21"), null, "einmal gefragt: bis 2 Tage vorher Ruhe");
assert.equal(dran(A({ spaeter_bis: "2026-11-20T10:00:00Z", gefragt_am: "2026-11-19T10:00:00Z" }), S, um("2026-11-22T18:00:00Z"), "2026-11-22"), "sitzung2", "zweites Mal ab 2 Tage vorher");
assert.equal(dran(A({ gefragt_am: "2026-11-22T18:00:00Z" }), S, um("2026-11-23T10:00:00Z"), "2026-11-23"), null, "nach dem zweiten Mal nicht noch einmal");
assert.equal(dran(A({ stand: "teilweise", stand_am: "2026-11-19T10:00:00Z", gefragt_am: "2026-11-19T10:00:00Z" }), S, um("2026-11-23T10:00:00Z"), "2026-11-23"), null, "teilweise gemeldet → erst im nächsten Zyklus");
assert.equal(dran(A({ stand: "nicht", stand_am: "2026-11-10T10:00:00Z", gefragt_am: "2026-11-10T10:00:00Z" }), S, um("2026-11-19T10:00:00Z"), "2026-11-19"), "sitzung", "Meldung aus dem vorigen Zyklus zählt nicht");
// überfällig ohne Sitzung: höchstens alle 7 Tage, nach einer Meldung seit Fälligkeit nicht mehr
assert.equal(dran(A({ faellig: "2026-11-10" }), null, um("2026-11-19T10:00:00Z"), "2026-11-19"), "faellig", "überfällig → fragen");
assert.equal(dran(A({ faellig: "2026-11-10", gefragt_am: "2026-11-15T10:00:00Z" }), null, um("2026-11-19T10:00:00Z"), "2026-11-19"), null, "überfällig: höchstens alle 7 Tage");
assert.equal(dran(A({ faellig: "2026-11-10", gefragt_am: "2026-11-11T10:00:00Z" }), null, um("2026-11-19T10:00:00Z"), "2026-11-19"), "faellig", "überfällig: nach 7 Tagen wieder");
assert.equal(dran(A({ faellig: "2026-11-10", stand: "nicht", stand_am: "2026-11-12T10:00:00Z", stand_ziel: "2026-12-15" }), null, um("2026-11-19T10:00:00Z"), "2026-11-19"), null, "neues Ziel gilt");
assert.equal(dran(A({ faellig: "2026-11-30" }), null, um("2026-11-19T10:00:00Z"), "2026-11-19"), null, "noch nicht fällig, keine Sitzung → nichts");
// „🔔 Nachfragen“ / Erinnerung 2 Tage vorher: bis zur nächsten Meldung (oder „Später“)
assert.equal(dran(A({ nachgefragt_am: "2026-11-19T09:00:00Z" }), null, um("2026-11-19T10:00:00Z"), "2026-11-19"), "nachgefragt", "Nachfrage der Clubleitung");
assert.equal(dran(A({ nachgefragt_am: "2026-11-19T09:00:00Z", stand: "teilweise", stand_am: "2026-11-19T09:30:00Z" }), null, um("2026-11-19T10:00:00Z"), "2026-11-19"), null, "nach der Meldung nicht mehr");

// ---- 2. Abschnitt „Stand der Aufgaben“ im Protokoll vom 24.11. (voriges Protokoll 30.10., davor 02.10.)
const P = [{ id: "p1002", datum: "2026-10-02", status: "veroeffentlicht" }, { id: "p3010", datum: "2026-10-30", status: "veroeffentlicht" }, { id: "pEnt", datum: "2026-10-20", status: "entwurf" }];
const N = { F: "Frank", C: "Christina", K: "Klaus", D: "Dieter", E: "Erika" };
const Z = [
  { id: "t1", protokoll_id: "p3010", person_id: "F", text: "Tablets beschaffen", gruppe: "G", erledigt_am: "2026-11-21T10:00:00Z", bemerkung: "2 Tablets gekauft" },
  { id: "t2", protokoll_id: "p3010", person_id: "C", text: "Tablets beschaffen", gruppe: "G", erledigt_am: "2026-11-21T10:00:00Z", bemerkung: "2 Tablets gekauft" },
  { id: "t3", protokoll_id: "p3010", person_id: "K", text: "Glühwein bestellen", stand: "teilweise", stand_am: "2026-11-22T09:00:00Z", stand_text: "Angebot fehlt noch", stand_von: "K" },
  { id: "t4", protokoll_id: "p1002", person_id: "D", text: "Schürzen nähen", stand: "nicht", stand_am: "2026-11-20T09:00:00Z", stand_text: "Stoff fehlt", stand_ziel: "2026-12-15", stand_von: "D" },
  { id: "t5", protokoll_id: "p1002", person_id: "E", text: "Kasse prüfen" },
  { id: "t6", protokoll_id: "p1002", person_id: "E", text: "Längst erledigt", erledigt_am: "2026-10-05T10:00:00Z" },
  { id: "t7", protokoll_id: "pEnt", person_id: "E", text: "aus einem Entwurf" },
  { id: "t8", protokoll_id: "p3010", person_id: "K", text: "Am Abend erledigt", erledigt_am: "2026-10-30T20:00:00Z", bemerkung: "ok" },
];
const L = liste(Z, P, "2026-11-24", (id) => N[id]);
assert.deepEqual(L.map((e) => e.text), ["Kasse prüfen", "Schürzen nähen", "Am Abend erledigt", "Glühwein bestellen", "Tablets beschaffen"], "offen gebliebene aus allen früheren Protokollen, erledigte nur seit dem vorigen; keine aus Entwürfen");
const tab = L.find((e) => e.text === "Tablets beschaffen");
assert.deepEqual([tab.stand, tab.namen, tab.notiz, tab.aus], ["erledigt", ["Frank", "Christina"], "2 Tablets gekauft", "2026-10-30"], "gemeinsame Aufgabe einmal mit beiden Namen");
const gw = L.find((e) => e.text === "Glühwein bestellen"), sz = L.find((e) => e.text === "Schürzen nähen"), ka = L.find((e) => e.text === "Kasse prüfen");
assert.deepEqual([gw.stand, gw.notiz, gw.neu], ["teilweise", "Angebot fehlt noch", true]);
assert.deepEqual([sz.stand, sz.ziel, sz.aus], ["nicht", "2026-12-15", "2026-10-02"], "noch nicht – neues Ziel, aus dem Protokoll vom 02.10.");
assert.deepEqual([ka.stand, ka.neu, ka.fehlt], ["keine", false, ["E"]], "keine Rückmeldung → fehlt (für „Nachfragen“)");
assert.equal(liste(Z, P, "2026-10-02", (id) => N[id]).length, 0, "erstes Protokoll: nichts aus früheren");
// alte Meldung (vor dem vorigen Protokoll) zählt in der Übersicht nicht als neue Rückmeldung
const alt = liste([{ id: "x", protokoll_id: "p1002", person_id: "D", text: "X", stand: "teilweise", stand_am: "2026-10-10T10:00:00Z", stand_text: "halb" }], P, "2026-11-24", (id) => N[id]);
assert.deepEqual([alt[0].stand, alt[0].neu, alt[0].fehlt], ["teilweise", false, ["D"]]);

// ---- 3. Zeile im Protokoll (App) – wie Hansis Beispiel
const TAG_ISO_FMT = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit" });
const zeile = new Function("TAG_ISO_FMT", funktion(app, "function astTag(") + funktion(app, "function aufgabeStandZeile(") + "\nreturn aufgabeStandZeile;")(TAG_ISO_FMT);
assert.equal(zeile(tab), "✅ erledigt am 21.11. – Frank, Christina: Tablets beschaffen – „2 Tablets gekauft“ (aus dem Protokoll vom 30.10.)");
assert.equal(zeile(gw), "🔶 teilweise (Stand 22.11.) – Klaus: Glühwein bestellen – „Angebot fehlt noch“ (aus dem Protokoll vom 30.10.)");
assert.equal(zeile(sz), "❌ noch nicht (Stand 20.11.) – Dieter: Schürzen nähen – „Stoff fehlt“ – neues Ziel 15.12. (aus dem Protokoll vom 02.10.)");
assert.equal(zeile(ka), "❔ keine Rückmeldung – Erika: Kasse prüfen (aus dem Protokoll vom 02.10.)");
assert.equal(zeile({ ...tab, am: "2026-11-21T23:30:00Z" }), "✅ erledigt am 22.11. – Frank, Christina: Tablets beschaffen – „2 Tablets gekauft“ (aus dem Protokoll vom 30.10.)", "deutsche Zeit");

// ---- 4. Datenbank: nur neue Spalten, wiederholbar
const mig = lies("supabase/migrations/20261119_kc_club_aufgaben_stand.sql");
for (const s of ["stand text not null default 'offen'", "stand_am timestamptz", "stand_von text", "stand_text text", "stand_ziel date", "stand_verlauf jsonb not null default '[]'::jsonb", "gefragt_am timestamptz", "spaeter_bis timestamptz", "nachgefragt_am timestamptz"])
  assert.ok(mig.includes(`alter table public.kc_club_aufgaben add column if not exists ${s};`), `Spalte ${s}`);
assert.ok(/add column if not exists aufgaben_stand jsonb;/.test(mig) && /add column if not exists aufgaben_nachgefragt_am timestamptz;/.test(mig), "Protokoll-Spalten");
assert.ok(/check \(stand in \('offen', 'teilweise', 'nicht', 'erledigt'\)\)/.test(mig) && /if not exists \(select 1 from pg_constraint where conname = 'kc_club_aufgaben_stand_check'/.test(mig), "Regel für den Stand, wiederholbar");
assert.ok(/update public\.kc_club_aufgaben set stand = 'erledigt' where erledigt_am is not null and stand <> 'erledigt';/.test(mig), "erledigte bekommen den Stand „erledigt“");
assert.ok(!/create table|drop |delete from|truncate/i.test(mig.replace(/--[^\n]*/g, "")), "nur Ergänzungen, keine neue Tabelle");
assert.ok(fs.existsSync(new URL("../tools/db-test/116_aufgaben_stand_test.sql", import.meta.url)) && /raise exception 'TESTBERICHT/.test(lies("tools/db-test/116_aufgaben_stand_test.sql")), "DB-Probelauf (bricht ab, nichts bleibt)");

// ---- 5. Server: Aktionen, Start ohne zusätzlichen Aufruf, Takt, Protokoll
const melden = srv.slice(srv.indexOf('case "aufgabe_stand_melden": {'), srv.indexOf('case "aufgabe_erledigt": {'));
assert.ok(!/length < 3/.test(melden), "KC-CLUB-AUFGABE-BEMERKUNG-FREI: teilweise auch ohne Text");
assert.ok(/if \(!zeilen\.some\(\(z: any\) => z\.person_id === ich\.person_id\)\) throw/.test(melden), "melden nur, wer die Aufgabe hat");
assert.ok(/p\.erledigt = true; p\.bemerkung = p\.text;\n      \}\n      \/\/ falls through\n      case "aufgabe_erledigt": \{/.test(srv), "✅ erledigt = dieselbe Aktion wie das Abhaken (ganze Gruppe, Bescheid)");
assert.ok(!/sendenGewaehlt|senden\(/.test(melden), "teilweise/noch nicht: keine Push");
assert.ok(/await aufgabeStandNachErledigt\(ich, ids, erledigt, bemerkung\);/.test(srv) && /stand: erledigt \? "erledigt" : "offen"/.test(srv), "Abhaken/Wieder öffnen setzt den Stand");
assert.ok(/case "aufgabe_stand_spaeter": \{[\s\S]{0,400}\.eq\("person_id", ich\.person_id\)/.test(srv), "Später nur für eigene Aufgaben");
const nf = srv.slice(srv.indexOf('case "aufgaben_nachfragen": {'), srv.indexOf("// ----- Anlagen -----"));
assert.ok(/darfBearbeiten\(ich, pr\)/.test(nf) && /aufgaben_nachgefragt_am\.lt\.\$\{grenze\}/.test(nf) && /gefragt_am: null, spaeter_bis: null/.test(nf), "Nachfragen: nur wer schreibt, höchstens 1× je 12 Std., Startmeldung kommt wieder");
assert.ok(/const aufgabenDran = p\.aufStand && ich\.protokolle && meineAufgaben\.length/.test(srv) && /\.\.\.\(aufgabenDran \? \{ aufgabenDran \} : \{\}\)/.test(srv), "init liefert die Startmeldung mit (kein eigener Aufruf)");
assert.ok(/naechstes\[0\] \?\? null\)/.test(srv.slice(srv.indexOf("const aufgabenDran = "), srv.indexOf("const aufgabenDran = ") + 400)), "Sitzung aus der schon geladenen nächsten Sitzung");
const er = funktion(srv, "async function aufgabenStandErinnern(");
assert.ok(/if \(h < 9 \|\| h >= 20\) return 0;/.test(er) && /\.eq\("art", "treffen"\)/.test(er) && /nachgefragt_am: jetzt\(\)/.test(er) && !/erinnert_am/.test(er), "Erinnerung 2 Tage vorher: 9–20 Uhr, eigene Spalte");
assert.ok(/const aufStand = stuendlich \? await aufgabenStandErinnern\(\)/.test(srv), "im stündlichen Takt");
const push = funktion(srv, "async function aufgabenStandPush(");
assert.ok(/senden\("club_aufgabe", \[pid\]/.test(push) && !/stand_text|bemerkung/.test(push), "Push je Person, ohne Bemerkungen anderer");
assert.ok(/const astLebendig = pr\.status === "entwurf" && !pr\.aufgaben_stand;/.test(srv), "Entwurf lebendig, veröffentlicht festgeschrieben");
const ver = srv.slice(srv.indexOf('case "protokoll_veroeffentlichen": {'), srv.indexOf('case "protokoll_korrigieren": {'));
assert.ok(/if \(!pr\.aufgaben_stand\) await aufgabenStandBerechnen\(pr\)/.test(ver) && /aufgaben_stand: aufgabenStandFest\(liste\)/.test(ver), "beim Veröffentlichen festschreiben");
assert.ok(!/aufgaben_stand/.test(srv.slice(srv.indexOf('case "protokoll_korrigieren": {'), srv.indexOf('case "protokoll_loeschen": {'))), "Korrektur rechnet nicht neu");
assert.ok(/aufgabeStandFelder\(a, bearb \|\| a\.person_id === ich\.person_id/.test(srv) && /aufgabeStandFelder\(a, ich\.vorstand \|\| a\.person_id === ich\.person_id/.test(srv), "Datenschutz: Stand in den Listen nur eigene/gemeinsame");

// ---- 6. App: Fenster, Knöpfe, Protokoll, Druck, Text
const fe = funktion(app, "function astFenster(");
assert.ok(/✅ Ja, erledigt/.test(fe) && /🔶 Teilweise/.test(fe) && /❌ Noch nicht/.test(fe) && /Später/.test(fe), "drei große Knöpfe + Später");
assert.ok(/f\._zu = \(\) => zu\(true\);/.test(fe) && /api\("aufgabe_stand_spaeter", \{ ids: rest \}\)/.test(fe), "Schließen ohne Antwort = Später");
assert.ok(!/text\.length < 3/.test(fe) && /api\("aufgabe_stand_melden"/.test(fe), "KC-CLUB-AUFGABE-BEMERKUNG-FREI: kein Pflichttext vor dem Senden");
assert.ok(/aufStand: astF \? 1 : 0/.test(app) && /function astFragenJetzt\(\)/.test(app), "fragt nur beim ersten Laden je Sitzung mit");
assert.ok(/onclick="astEinzeln\(/.test(app) && /aufgabeStandMarke\(a\)/.test(app), "Stand melden an der Aufgabe, Abzeichen");
assert.ok(/\$\{aufgabenStandHtml\(\)\}<!-- KC-CLUB-AUFGABEN-STAND -->/.test(app) && /<h2>Stand der Aufgaben<\/h2>/.test(app) && /"Stand der Aufgaben:"/.test(app), "Protokoll: Ansicht, Druck, Text");
assert.ok(/Rückmeldungen: \$\{gemeldet\} von \$\{l\.length\}/.test(app) && /api\("aufgaben_nachfragen"/.test(app), "Übersicht mit Nachfragen");
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/aufgaben-stand.test.mjs"), "läuft in der CI");
const br = lies("tools/hilfe/aufgaben-stand-browser.mjs");
assert.ok(/OHNE_ECHTSERVER/.test(br) && /--no-proxy-server/.test(br) && /r\.abort\(\)/.test(br), "Browser-Lauf abgeschirmt");
// ---- 7. KC-CLUB-AUFGABE-ERLEDIGT-VON (19.11.2026, Wunsch Hansi): „✔ erledigt am 19.11. von Frank“ – Beispieldaten
{
  const astTag = new Function("TAG_ISO_FMT", funktion(app, "function astTag(") + "\nreturn astTag;")(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Berlin" }));
  const txt = new Function("astTag", funktion(app, "function aufgabeErledigtText(") + "\nreturn aufgabeErledigtText;")(astTag);
  assert.equal(txt({ erledigt_am: "2026-11-19T10:00:00Z", erledigt_von_name: "Frank" }), "✔ erledigt am 19.11. von Frank");
  assert.equal(txt({ erledigt_am: "2026-11-19T23:30:00Z" }), "✔ erledigt am 20.11.", "ältere Erledigung ohne „von“; Datum in deutscher Zeit");
  assert.equal(txt({ erledigt_am: null, erledigt_von_name: "Frank" }), "", "offen → nichts");
  const standZeile = new Function("astTag", funktion(app, "function aufgabeStandZeile(") + "\nreturn aufgabeStandZeile;")(astTag);
  assert.equal(standZeile({ stand: "erledigt", am: "2026-11-21", von: "Frank", namen: ["Frank", "Christina"], text: "Tablets beschaffen" }), "✅ erledigt am 21.11. von Frank – Frank, Christina: Tablets beschaffen");
  assert.equal(standZeile({ stand: "erledigt", am: "2026-11-21", namen: ["Frank"], text: "Tablets" }), "✅ erledigt am 21.11. – Frank: Tablets", "ohne „von“ wie bisher");
  // Server: wer abgehakt hat, nur bei stand = erledigt mit stand_von
  const vonF = new Function(ohneTypen(srv.slice(srv.indexOf("const aufgabeErledigtVon = "), srv.indexOf("\n", srv.indexOf("const aufgabeErledigtVon = "))).replace(/: \(id: string\) => string/, "")) + "\nreturn aufgabeErledigtVon;")();
  const vn = (id) => ({ F: "Frank" })[id] || "";
  assert.deepEqual(vonF({ erledigt_am: "2026-11-19T10:00:00Z", stand: "erledigt", stand_von: "F" }, vn), { erledigt_von_name: "Frank" });
  assert.deepEqual(vonF({ erledigt_am: "2026-11-19T10:00:00Z", stand: null, stand_von: null }, vn), {}, "ältere Erledigung: kein „von“");
  assert.deepEqual(vonF({ erledigt_am: null, stand: "teilweise", stand_von: "F" }, vn), {}, "nicht erledigt: kein „von“ (Stand bleibt geschützt)");
  const L2 = liste([{ id: "e1", protokoll_id: "p3010", person_id: "C", text: "Tablets", gruppe: "G2", erledigt_am: "2026-11-21T10:00:00Z", stand: "erledigt", stand_von: "F" },
    { id: "e2", protokoll_id: "p3010", person_id: "F", text: "Tablets", gruppe: "G2", erledigt_am: "2026-11-21T10:00:00Z", stand: "erledigt", stand_von: "F" }], P, "2026-11-24", (id) => N[id]);
  assert.equal(L2[0].von, "Frank", "Stand der Aufgaben: erledigt von …");
  assert.ok(!("von" in L.find((e) => e.text === "Tablets beschaffen")), "ältere Erledigung im Abschnitt: kein „von“");
  const pl = srv.slice(srv.indexOf('case "protokoll_laden": {'), srv.indexOf("aufgabenNachgefragtAm:", srv.indexOf('case "protokoll_laden": {')));
  assert.ok(/\.\.\.aufgabeErledigtVon\(a, \(id\) => vorname\(leute\.get\(id\) \?\? null\)\)/.test(pl) && /map\(\(x: any\) => x\.stand_von\)\.filter\(Boolean\)/.test(pl), "protokoll_laden gibt erledigt_von_name (Vorname) für alle Leser");
  assert.ok(/aufgabeErledigtText\(a\)/.test(funktion(app, "function aufgabeZeile(")) && /erledigt_von_name: alle\.find/.test(app) && /aufgabeErledigtText\(\{ erledigt_am:/.test(funktion(app, "function druckAufgabenZeilen(")), "App: Zeile, gemeinsame Aufgabe, Druck");
}
// KC-CLUB-AUFGABEN-STAND-ZURUECK (19.11.2026): Startmeldung auch beim Zurückkommen auf die Startseite
assert.ok(app.includes('if (v === "start" && vorher !== "start" && typeof AST !== "undefined" && AST.dran.length && !AST.offen) setTimeout(() => astPruefen(0), 1500);'), "Startmeldung beim Zurückkommen auf Start");
console.log("✅ aufgaben-stand: alle Prüfungen bestanden");
