// KC-CLUB-AUFGABE-GEMEINSAM (2.843.0, Wunschliste #79): Aufgabe für mehrere Personen = EINE Zeile mit allen Namen; einer hakt ab → für alle erledigt.
// Aufruf: node tests/aufgabe-gemeinsam.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { programmText } from "./programm.mjs";
const app = programmText(), srv = readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const f0 = app.indexOf("function aufgabenMitGruppe(liste)"), code = app.slice(f0, app.indexOf("\n}\n", f0) + 2);
const zus = new Function(code + "\nreturn aufgabenMitGruppe;")();
const A = (id, name, gruppe, x = {}) => ({ id, name, gruppe, text: "T", meine: false, verwalten: false, erledigt_am: null, ...x });
const l = [A("a1", "Klaus", "G"), A("b", "Erika", null), A("a2", "Anna", "G", { meine: true }), A("c1", "Solo", "H")];
const r = zus(l);
assert.equal(r, l, "Liste wird an Ort und Stelle geändert (alle Aufrufer)");
assert.deepEqual(r.map((a) => a.id), ["a1", "b", "c1"], "Gruppe nur einmal, Reihenfolge bleibt");
assert.equal(r[0].name, "Klaus, Anna"); assert.deepEqual(r[0].ids, ["a1", "a2"]); assert.ok(r[0].meine, "meine, wenn ich dabei bin");
assert.equal(r[2].ids, undefined, "Gruppe mit nur einer Zeile bleibt normal");
const e = zus([A("x1", "K", "G", { erledigt_am: "2026-11-01T10:00:00Z", bemerkung: "ok" }), A("x2", "A", "G", { erledigt_am: "2026-11-02T10:00:00Z" })]);
assert.equal(e[0].erledigt_am, "2026-11-02T10:00:00Z", "erledigt, wenn alle Zeilen erledigt"); assert.equal(e[0].bemerkung, "ok");
assert.equal(zus([A("y1", "K", "G", { erledigt_am: "2026-11-01" }), A("y2", "A", "G")])[0].erledigt_am, null, "teilweise (alte Daten) → noch offen");
assert.ok(/a\.ids\?\.length > 1 \? '<span title="gemeinsame Aufgabe/.test(app), "👥 bei gemeinsamen Aufgaben");
// Server: Abhaken und Löschen für die ganze Gruppe; Beteiligte dürfen abhaken; Bescheid an die anderen
const er = srv.slice(srv.indexOf('case "aufgabe_erledigt": {'), srv.indexOf('case "aufgabe_loeschen": {'));
assert.ok(/\.eq\("gruppe", x\.a\.gruppe\)/.test(er) && /\.update\(erledigt \? \{ erledigt_am: jetzt\(\), bemerkung \} : \{ erledigt_am: null \}\)\.in\("id", ids\)/.test(er), "ganze Gruppe abhaken");
assert.ok(/if \(!x\.verwalten && !beteiligt\.includes\(ich\.person_id\)\)/.test(er), "jeder Beteiligte darf abhaken");
assert.ok(/\[x\.a\.erstellt_von, \.\.\.\(ids\.length > 1 \? beteiligt : \[\]\)\]\.filter\(\(id\) => id && id !== ich\.person_id\)/.test(er), "Bescheid an Eintragende + andere Beteiligte, nie an sich selbst");
const lo = srv.slice(srv.indexOf('case "aufgabe_loeschen": {'), srv.indexOf("// ----- Anlagen -----"));
assert.ok(/for \(const z of zeilen\) await geloescht\(ich, "aufgabe", \{ aufgabe: z \}\);/.test(lo) && /\.delete\(\)\.in\("id", zeilen\.map/.test(lo), "ganze Gruppe löschen, jede Zeile im Papierkorb");
assert.ok(/aufgabenOffen: new Set\(aufgaben\.filter\(\(a: any\) => a\.protokoll_id === pr\.id\)\.map\(\(a: any\) => a\.gruppe \|\| a\.id\)\)\.size/.test(srv), "Zahl je Protokoll: gemeinsame Aufgabe einmal");
console.log("aufgabe-gemeinsam: alle Prüfungen bestanden");
