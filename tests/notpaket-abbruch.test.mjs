// KC-CLUB-NOTPAKET-ABBRUCH (2.862.0, Wunsch Hansi 05.11.2026 „damit so was vermerkt wird“): stille Abbrüche beim Bau des Notfall-Pakets
// (Server bricht mit „CPU Time exceeded“ ab, kein catch) werden beim nächsten Lauf als Fehler eingetragen; Wächter 🧯 Notfall-Paket.
// Aufruf: node tests/notpaket-abbruch.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
const srv = readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");
const mig = readFileSync(new URL("../supabase/migrations/20261105_kc_club_notpaket_abbruch.sql", import.meta.url), "utf8");
assert.ok(/add column if not exists bau_start timestamptz/.test(mig) && /Rückweg: alter table public\.kc_club_notbetrieb drop column if exists bau_start/.test(mig), "Spalte + Rückweg");
const lauf = srv.slice(srv.indexOf("async function notpaketLauf("), srv.indexOf("// ---------- KC-CLUB-SONDERSTUNDEN (KICC-F-100)"));
const iPruef = lauf.indexOf("if (st.bau_start && Date.now() - Date.parse(String(st.bau_start)) > NOT_ABBRUCH_MS)"), iStart = lauf.indexOf('update({ bau_start: jetzt() })');
const iBauen = lauf.indexOf("const paket = await notpaketBauen("), iUnv = lauf.indexOf("return { ok: true, unveraendert: true }");
assert.ok(iPruef > 0 && iPruef < lauf.indexOf("const { data: fp }"), "Abbruch-Prüfung gleich am Anfang (vor der Fehlerpause)");
assert.ok(iStart > iUnv && iStart < iBauen, "Start-Marke erst, wenn wirklich gebaut wird (nicht bei „unverändert“ oder Drossel)");
assert.ok(/fehler: null, bau_start: null \}\)\.eq\("id", 1\);/.test(lauf) && /update\(\{ fehler, fehler_am: jetzt\(\), bau_start: null \}\)/.test(lauf), "Erfolg und normaler Fehler löschen die Marke");
assert.ok(/update\(\{ fehler, fehler_am: st\.bau_start, bau_start: null \}\)/.test(lauf) && /protokoll\(null, "notpaket_fehler", \{ erzwungen: false, fehler, abgebrochen: true/.test(lauf), "Abbruch → Fehler + Protokoll");
assert.ok(/const NOT_ABBRUCH_MS = NOT_GRUPPE_MS \+ 60000;/.test(srv), "Grenze länger als jeder Bau");
// Wächter-Bewertung echt ausführen
const b0 = srv.indexOf("function notpaketBefund("), bcode = stripTypeScriptTypes(srv.slice(b0, srv.indexOf("\n}\n", b0) + 2), { mode: "transform" });
const befund = new Function("fZeit", bcode + "\nreturn notpaketBefund;")({ format: (d) => d.toISOString().slice(11, 16) });
const vor = (min) => new Date(Date.now() - min * 60000).toISOString();
assert.equal(befund(null)[0], "grau"); assert.equal(befund({ url: false })[0], "grau");
assert.equal(befund({ url: true, hochgeladen_am: vor(30) })[0], "gruen");
assert.equal(befund({ url: true, hochgeladen_am: vor(120), fehler: "Bau abgebrochen", fehler_am: vor(20) })[0], "gruen", "frischer Abbruch: Neuversuch abwarten (kein Alarm)");
assert.match(befund({ url: true, hochgeladen_am: vor(120), fehler: "Bau abgebrochen", fehler_am: vor(20) })[2], /letzter Fehler/, "aber vermerkt");
assert.equal(befund({ url: true, hochgeladen_am: vor(120), fehler: "Bau abgebrochen", fehler_am: vor(50) })[0], "gelb", "Neuversuch hat auch nicht geklappt → gelb");
assert.equal(befund({ url: true, hochgeladen_am: vor(30), fehler: null, fehler_am: vor(50) })[0], "gruen", "danach wieder gebaut → grün");
assert.equal(befund({ url: true, hochgeladen_am: vor(27 * 60) })[0], "rot", "älter als ein Tag → rot");
assert.equal(befund({ url: true })[0], "rot", "noch nie gebaut → rot");
assert.ok(/\{ id: "notpaket", sym: "🧯", name: "Notfall-Paket", app: \(d\) => notpaketBefund\(d\.notpaket\) \}/.test(srv), "Wächter auf dem Server");
assert.ok(/notpaket: nb \? \{ url: !!nb\.url, hochgeladen_am:/.test(srv) && !/notpaket: nb \? \{[^}]*privat/.test(srv), "nur Zeiten und Fehlertext – nie die Schlüssel");
assert.ok(/\{ id: "notpaket", gruppe: "sicherung", sym: "🧯", name: "Notfall-Paket"/.test(app), "Kachel in der Wächter-Übersicht");
console.log("notpaket-abbruch: alle Prüfungen bestanden");
