// KC-CLUB-SITZUNG-FRIST + KC-CLUB-SITZUNG-AUFGABE-START (2.750.0, Wunsch Hansi 29.10.2026: „3 Tage vorher. Und der Clubsprecher muss beim
// Programmstart erinnert werden, welche Aufgabe zu erledigen ist – mit Abhaken. Ja, nein oder später nochmal erinnern und Änderungen noch zulassen.
// Dann nächste Aufgaben auch so handhaben“). Verhaltensprüfung (offline, nachgebaute Daten).
// Aufruf: node tests/sitzung-aufgaben.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync("index.html", "utf8");

const q = app.slice(app.indexOf("// KC-CLUB-SITZUNG-FRIST ("), app.indexOf("// KC-CLUB-BUERO-RAUM (1.65.0"));
const fTag = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", weekday: "short", day: "2-digit", month: "2-digit" });
let speicher = {};
const localStorage = { getItem: (k) => speicher[k] ?? null, setItem: (k, v) => { speicher[k] = String(v); } };
const mach = (vorstand) => new Function("ICH", "zeitKurz", "wann", "esc", "CA_VORHER_MIN", "CA_DAUER_STD", "fTag", "localStorage",
  q + "\nreturn { buFristText, buKnapp, buSchritteFuer, buSchritteHtml, buAufgabeFuer, buAufgabeMerken, buAufgabeMerker };")(
  { vorstand }, (x) => "am " + x.slice(0, 10), (x) => x, (x) => String(x), 120, 6, fTag, localStorage);
const A = mach(true);
const H = 3600000, T = 86400000, jetzt = Date.now(), iso = (ms) => new Date(jetzt + ms).toISOString();
const sitzung = (x) => ({ id: "S1", titel: "Clubsitzung", beginn: iso(5 * T), vorbereitet: false, einladung_am: null, erinnerung_am: null, geaendert_nach_einladung: false, aktentasche: null, ohne: 3, ...x });

// --- 1) Frist: Einladung spätestens 3 Tage vorher
assert.equal(A.buFristText({ beginn: "2026-10-30T16:00:00Z" }), "bis spätestens Di., 27.10.", "Sitzung Fr 30.10. → Frist Di 27.10.");
assert.equal(A.buKnapp(sitzung({ beginn: iso(5 * T) })), false, "5 Tage vorher: noch Zeit");
assert.equal(A.buKnapp(sitzung({ beginn: iso(2 * T) })), true, "2 Tage vorher: Frist vorbei");
let l = A.buSchritteFuer(sitzung({ beginn: iso(2 * T) }));
assert.equal(l[0].knapp, true, "Tagesordnung fehlt 2 Tage vorher → knapp");
assert.match(l[0].u, /bis spätestens/, "Frist steht beim Schritt");
assert.match(A.buSchritteHtml(sitzung({ beginn: iso(2 * T) })), /class="bu-schritt jetzt knapp".*⚠️ Knapp – die Mitglieder haben nur noch wenig Zeit/s, "rot markiert");
l = A.buSchritteFuer(sitzung({ beginn: iso(2 * T), vorbereitet: true }));
assert.equal(l[1].knapp, true, "Einladung fehlt 2 Tage vorher → knapp");
l = A.buSchritteFuer(sitzung({ beginn: iso(2 * T), vorbereitet: true, einladung_am: iso(-5 * T), geaendert_nach_einladung: true }));
assert.equal(l[1].knapp, false, "Änderung nach rechtzeitiger Einladung ist nicht „knapp“ (Themen bis zum Vorabend erlaubt)");
assert.doesNotMatch(A.buSchritteHtml(sitzung({ beginn: iso(5 * T) })), /knapp/, "mit Zeit: nichts rot");

// --- 2) Start-Frage: genau eine, die nächste offene Aufgabe
assert.equal(A.buAufgabeFuer(sitzung({ beginn: iso(10 * T) }), {}), null, "mehr als 7 Tage vorher: noch nicht fragen");
assert.equal(A.buAufgabeFuer(null, {}), null, "keine Sitzung → keine Frage");
let a = A.buAufgabeFuer(sitzung(), {});
assert.equal(a.id, "vorbereiten"); assert.match(a.f.q, /Tagesordnung ist noch nicht festgelegt/); assert.equal(a.f.nein, undefined, "nur Ja oder Später");
a = A.buAufgabeFuer(sitzung({ vorbereitet: true }), {});
assert.equal(a.id, "einladung");
assert.equal(a.f.q, "Die Tagesordnung ist fertig. Sollen alle Mitglieder jetzt die Einladung bekommen?", "Hansis Frage wörtlich");
assert.equal(a.los, "buEinladung('S1', false)", "Ja → das gewohnte Einladungs-Fenster (Vorschau, dann Senden)");
assert.deepEqual(a.f.nein, ["✏️ Nein, erst die Tagesordnung ändern", "buSitzungOeffnen('S1')"], "Nein → Tagesordnung bearbeiten");
a = A.buAufgabeFuer(sitzung({ vorbereitet: true, einladung_am: iso(-T), geaendert_nach_einladung: true, aktentasche: { status: "gepackt" } }), {});
assert.equal(a.k, "S1:einladung:aenderung", "Änderung hat einen eigenen Merker");
assert.match(a.f.q, /geänderte Tagesordnung bekommen\?/); assert.equal(a.los, "buEinladung('S1', false, true)");
a = A.buAufgabeFuer(sitzung({ vorbereitet: true, einladung_am: iso(-H) }), {});
assert.equal(a.id, "aktentasche", "nach der Einladung: Aktentasche");
assert.equal(mach(false).buAufgabeFuer(sitzung({ vorbereitet: true, einladung_am: iso(-H) }), {}), null, "ohne Clubleitung keine Aktentasche");
// Später: diese Aufgabe ruht 3 Stunden, die nächste fällige kommt dran
const reif = sitzung({ vorbereitet: true, einladung_am: iso(-3 * T), beginn: iso(2 * T) });
assert.equal(A.buAufgabeFuer(reif, {}).id, "aktentasche");
a = A.buAufgabeFuer(reif, { "S1:aktentasche": jetzt + 3 * H });
assert.equal(a.id, "erinnerung", "Aktentasche auf später → Erinnerung"); assert.match(a.f.q, /^3 Mitglieder haben noch nicht geantwortet\. Erinnerung senden\?$/);
assert.equal(a.f.nein[1], "", "Nein bei der Erinnerung = nicht mehr fragen");
assert.equal(A.buAufgabeFuer(reif, { "S1:aktentasche": jetzt - 1 }).id, "aktentasche", "Später abgelaufen → wieder fragen");
assert.equal(A.buAufgabeFuer(reif, { "S1:aktentasche": jetzt + H, "S1:erinnerung": "nie" }), null, "Nein + Später → Ruhe");
assert.equal(A.buAufgabeFuer({ ...reif, id: "S2" }, { "S1:aktentasche": "nie" }).id, "aktentasche", "Merker gelten je Sitzung");
const abend = sitzung({ vorbereitet: true, einladung_am: iso(-3 * T), erinnerung_am: iso(-T), aktentasche: { status: "gepackt" }, beginn: iso(H) });
assert.match(A.buAufgabeFuer(abend, {}).f.q, /Heute ist Clubsitzung/, "am Abend: Clubabend öffnen");
// Merker: abgelaufene werden weggeräumt, „nie“ bleibt
speicher = {}; A.buAufgabeMerken("S0:x", jetzt - 1); A.buAufgabeMerken("S0:y", "nie"); A.buAufgabeMerken("S1:z", jetzt + H);
assert.deepEqual(Object.keys(A.buAufgabeMerker()).sort(), ["S0:y", "S1:z"]);

// --- 3) Einbau: beim Start nach den anderen Fenstern, nur wer im Büro schreiben darf, ohne Verbindung keine Frage, sendet nichts selbst
const f = app.slice(app.indexOf("async function buAufgabePruefen("), app.indexOf("// KC-CLUB-BUERO-RAUM (1.65.0"));
assert.match(f, /if \(!buSchreiben\(\)\) return;/, "nur Büro schreiben");
assert.match(f, /const besetzt = \(\) => document\.querySelector\("\.blatt:not\(\.versteckt\), \.dlg, #rgSchicht"\) \|\| aktuelleAnsicht !== "start";/, "wartet auf andere Fenster");
assert.match(f, /try \{ r = await api\("buero_start", \{\}, \{ still: true \}\); \} catch \{ return; \}/, "ohne Verbindung nichts raten");
assert.match(f, /kc_bu_aufgabe_gezeigt/, "einmal je App-Start");
assert.match(f, /\$\{buSchritteHtml\(t, true\)\}/, "Schritte mit ✅ abgehakt im Fenster");
assert.match(f, /⏰ Später nochmal erinnern\$\{a\.frist\?\.\(t\) \? " – Änderungen bleiben möglich" : ""\}/);
assert.doesNotMatch(f, /api\("buero_einladung"/, "die Frage selbst sendet nichts");
assert.match(app, /if \(!h \|\| h === "#"\) setTimeout\(\(\) => buAufgabePruefen\(\), 4000\);/, "beim Start (nicht nach einem Sprung-Link)");
assert.match(html, /\.bu-schritt\.knapp \{/, "rote Markierung im Stil");

// --- Gegenprobe: der Stand vor 2.750.0 hatte weder Frist noch Start-Frage
assert.ok(!/buAufgabePruefen|BU_FRIST_TAGE/.test(app.replace(q, "").replace(/setTimeout\(\(\) => buAufgabePruefen\(\), 4000\);/, "")), "alles hängt an diesem einen Baustein");
console.log("sitzung-aufgaben: alle Prüfungen bestanden");
