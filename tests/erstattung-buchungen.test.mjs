// KC-CLUB-ERSTATTUNG-BUCHUNGEN (11.11.2026, Wunsch Hansi „Buchungsliste für den Kassenwart“). Aufruf: node tests/erstattung-buchungen.test.mjs (offline)
// Browser-Prüfung: tools/hilfe/buchungsliste-browser.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), bu = lies("teile/buero.js"), srv = lies("supabase/functions/kc-club/index.ts"), html = lies("index.html");
const f = srv.slice(srv.indexOf('case "erstattung_buchungen"'), srv.indexOf('case "erstattung_export_markieren"'));
assert.match(f, /if \(!ich\.admin && !ich\.vorstand && !\(ich\.aemter \|\| \[\]\)\.some\(\(a: string\) => \/\^\(kassenwart\|clubsprecher\)\/i\.test\(a\)\)\) throw new Fehler\([^)]*, 403\)/, "nur Kassenwart, Clubsprecher, Vorstand, Admin");
assert.match(f, /\.neq\("status", "abgelehnt"\)/, "abgelehnte nie");
assert.match(f, /if \(\+d\.slice\(0, 4\) !== jahr\) return;/, "Jahr nach Datum der Fahrt/Auslage");
assert.match(f, /bar: a\.status === "erstattet" && a\.ausgezahlt === "bar" \? am : null/);
assert.match(f, /ueb: a\.status === "erstattet" && a\.ausgezahlt !== "bar" \? am : null/);
assert.match(f, /from\("kc_communication_thread_participants"\)\.select\("thread_id,person_id"\)/, "Gruppen nur als Mitgliederliste");
assert.doesNotMatch(f, /kc_communication_messages|\.body|inhalt/i, "keine Chat-Inhalte");
assert.match(f, /await protokoll\(ich\.person_id, "erstattung_buchungsliste", \{ jahr, zeilen: zeilen\.length \}\);/, "protokolliert ohne Beträge");
// App
assert.match(app, /\n  buero: \{ einstieg: \["ersBuchOeffnen", "eblDruck", /);
assert.match(app, /buchungsliste: \{ ablegen: \{ register: \["Kasse", "Erstattungen", "Sonstiges"\][^}]*\}, bauen: \(\) => eblDruck\(\) \}/, "Druck im Club-Design, im Ordner ablegbar");
assert.match(app, /onclick="ersBuchOeffnen\(\)">📒 Buchungsliste<\/button>/);
assert.match(bu, /onclick="ersBuchOeffnen\(\)">📒 Buchungsliste<\/button>/, "auch im Büro-Eingang");
for (const k of ["jahr", "monat", "art", "gruppe", "person", "stand"]) assert.ok(bu.includes(`eblFilterBlock("${k}",`), "Filter " + k);
assert.match(bu, /<details class="ebl-f"\$\{EBL\.auf\[k\] \? " open" : ""\}/, "Filter einklappbar, Zustand gemerkt");
assert.match(bu, /kopf\("bar", "💶 Bar am"\)\}\$\{kopf\("ueb", "🏦 Überwiesen am"\)\}/, "Spalten Bar am / Überwiesen am mit Symbol");
assert.match(bu, /return \{ titel: `Buchungsliste Erstattungen \$\{EBL\.jahr\}`, unter: [^,]+, html, quer: true \};/);
assert.match(html, /\.ebl-rolle \{ overflow-x: auto;/, "Tabelle scrollt in sich, nie die Seite");
console.log("erstattung-buchungen: alles grün");
