// KC-CLUB-GESPRAECHE (Stufe 1 Telefonate, 30.10.2026, Wunsch Hansi „sehen, wer gerade mit wem spricht, anklopfen – die anderen nehmen mich auf“).
// Aufruf: node tests/gespraeche.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { GS, gespraecheBilden, gespraecheSichtbar, dazuEmpfaenger, dazuStand } from "../supabase/functions/kc-club/gespraeche.js";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), server = lies("supabase/functions/kc-club/index.ts"), html = lies("index.html");
const T = Date.parse("2026-10-30T10:00:00Z"), vor = (min) => new Date(T - min * 60000).toISOString();

// Gespräche bilden: Zweiergespräch, Konferenz aus mehreren Beinen (Querverbindungen automatisch), Video
const gs = gespraecheBilden([
  { id: "a1", von: "KLAUS", an: "HANSI", art: "ton", konferenz_id: null, automatisch: false, angenommen_am: vor(4) },
  { id: "k1", von: "ANNE", an: "CHRIS", art: "ton", konferenz_id: "K", automatisch: false, angenommen_am: vor(10) },
  { id: "k2", von: "ANNE", an: "RUTH", art: "ton", konferenz_id: "K", automatisch: false, angenommen_am: vor(6) },
  { id: "k3", von: "CHRIS", an: "RUTH", art: "ton", konferenz_id: "K", automatisch: true, angenommen_am: vor(6) },
  { id: "v1", von: "KARLA", an: "STEVEN", art: "video", konferenz_id: null, automatisch: false, angenommen_am: vor(1) },
  { id: "x", von: "A", an: "B", angenommen_am: null },
]);
assert.equal(gs.length, 3, "drei Gespräche (unfertiges Bein zählt nicht)");
const k = gs.find((g) => g.konferenz === "K");
assert.deepEqual(k.teilnehmer, ["ANNE", "CHRIS", "RUTH"], "Konferenz = alle Beteiligten");
assert.equal(k.id, "k1", "angeklopft wird am ältesten nicht automatischen Bein");
assert.equal(k.seit, vor(10));
assert.equal(gs.find((g) => g.id === "v1").art, "video");

// Sichtbarkeit: alle online + Schalter an → mit Namen; einer unsichtbar/aus → nur anonym; eigenes Gespräch → ichDrin, nicht klopfbar
const on = new Set(["KLAUS", "HANSI", "ANNE", "CHRIS", "RUTH", "KARLA", "STEVEN", "PAUL"]);
const einst = new Map([["RUTH", { erlaubt: true, gespraeche: false }]]);
let s = gespraecheSichtbar(gs, on, einst, "PAUL", T);
assert.deepEqual(s.liste.map((g) => g.id).sort(), ["a1", "v1"]);
assert.equal(s.anonym, 1, "Konferenz mit Ruth (Schalter aus) nur anonym");
const a1 = s.liste.find((g) => g.id === "a1");
assert.equal(a1.seitSek, 240); assert.equal(a1.klopfbar, true); assert.equal(a1.ichDrin, false);
assert.equal(s.liste.find((g) => g.id === "v1").klopfbar, false, "Video: (noch) kein Dazukommen");
s = gespraecheSichtbar(gs, new Set([...on].filter((x) => x !== "HANSI")), new Map(), "PAUL", T);
assert.ok(!s.liste.some((g) => g.id === "a1") && s.anonym === 1, "Hansi unsichtbar/Inkognito → ohne Namen");
s = gespraecheSichtbar(gs, on, new Map(), "KLAUS", T);
assert.equal(s.liste.find((g) => g.id === "a1").ichDrin, true); assert.equal(s.liste.find((g) => g.id === "a1").klopfbar, false);
s = gespraecheSichtbar(gs, on, new Map([["KLAUS", { erlaubt: false }], ["HANSI", { erlaubt: false }]]), "PAUL", T);
assert.equal(s.liste.find((g) => g.id === "a1").klopfbar, false, "beide Anklopfen aus → nicht klopfbar");
const voll = gespraecheBilden([1, 2, 3].map((i) => ({ id: "f" + i, von: "P0", an: "P" + i, art: "ton", konferenz_id: "V", automatisch: i > 1, angenommen_am: vor(2) })));
assert.equal(gespraecheSichtbar(voll, new Set(["P0", "P1", "P2", "P3"]), new Map(), "PAUL", T).liste[0].voll, true, `ab ${GS.max} voll`);

// Empfänger und Stand
assert.deepEqual(dazuEmpfaenger(["KLAUS", "HANSI"], new Map([["HANSI", { erlaubt: false }]]), "PAUL"), ["KLAUS"]);
assert.deepEqual(dazuStand([{ an: "KLAUS", status: "offen" }, { an: "HANSI", status: "spaeter" }]), { status: "offen" });
assert.deepEqual(dazuStand([{ an: "KLAUS", status: "abgebrochen" }, { an: "HANSI", status: "angenommen" }]), { status: "angenommen", von: "HANSI" });
assert.deepEqual(dazuStand([{ an: "KLAUS", status: "spaeter" }, { an: "HANSI", status: "spaeter" }]), { status: "nein" });

// Server: Einstellung (Standard an), Online-Abgleich sparsam (gemerkt), Aktionen mit Prüfungen
assert.match(server, /from "\.\/gespraeche\.js"/);
assert.match(server, /gespraeche: w\?\.gespraeche !== false \}\)/, "Schalter Standard an");
assert.match(server, /if \(Date\.now\(\) - GS_CACHE\.zeit < GS\.cacheMs\) return GS_CACHE\.d;/, "höchstens alle 15 s eine Abfrage");
assert.match(server, /gespraeche: gs\.liste\.map\(/); assert.match(server, /dazukommen: dazuAnMich\.map/); assert.match(server, /dazuMeine: /);
assert.match(server, /klopfVerpasst\(\(klopf \?\? \[\]\)\.filter\(\(x: any\) => x\.art !== "dazukommen"\)/, "Dazukommen zählt nicht als verpasstes Anklopfen");
for (const a of ["gespraech_anklopfen", "dazukommen_antwort", "dazukommen_abbrechen"]) assert.ok(server.includes(`case "${a}":`), a);
const ak = server.slice(server.indexOf('case "gespraech_anklopfen":'), server.indexOf('case "dazukommen_antwort":'));
assert.match(ak, /Dieses Gespräch ist privat\./); assert.match(ak, /inko\.get\(id\)\?\.an === true/); assert.match(ak, /teil\.size >= KONFERENZ_MAX/);
assert.match(ak, /a\.art === "video"/); assert.match(ak, /Du bist schon in diesem Gespräch\./);
const an = server.slice(server.indexOf('case "dazukommen_antwort":'), server.indexOf('case "dazukommen_abbrechen":'));
assert.match(an, /\.eq\("an", ich\.person_id\)/, "nur eigene Frage beantworten");
assert.match(an, /update\(\{ status: "abgebrochen", beantwortet_am: jetzt\(\) \}\)\.eq\("von", k\.von\)\.eq\("anruf_id", k\.anruf_id\)\.eq\("status", "offen"\)/, "andere Fragen schließen sich");

// App: Schilder im Kopf, Fenster, Netz, Annehmen ohne Klingeln, Frage im Anrufbildschirm, Schalter
assert.match(app, /const gs = gsKopf\(\), alle = \(kopie\) => gs\.map\(\(g\) => gsSchild\(g, kopie\)\)\.join\(""\) \+ namen\(kopie\);/);
for (const f of ["gsBlatt", "gsNetz", "gsAnklopfen", "gsMeineStand", "dazuAnnehmen", "dazuFrage", "dazuAntwort"]) assert.ok(app.includes(`function ${f}(`), f);
assert.match(app, /if \(klopfSprechenAnnehmen\(\) \|\| dazuAnnehmen\(\)\) return;/);
assert.match(app, /await konfEinladen\(r\.von\.person_id\);/, "Aufnehmen = vorhandene Konferenz-Einladung");
assert.match(app, /ONL\.gs = r\.gespraeche \|\| \[\]; ONL\.gsAnonym = r\.gespraecheAnonym \|\| 0;/);
assert.match(html, /id="anrufDazu"/); assert.match(html, /id="setGespraeche" checked onchange="anklopfenSetzen\(\{ gespraeche: this\.checked \}\)"/);
assert.match(html, /html\.spar \.gs-hoerer i \{ animation: none; display: none; \}/); assert.match(html, /@media \(prefers-reduced-motion: reduce\) \{ \.gs-hoerer i/);
assert.match(lies("supabase/migrations/20261030_kc_club_gespraeche_dazukommen.sql"), /'schreiben', 'sprechen', 'dazukommen'/);
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/gespraeche.test.mjs"), "läuft in der CI");
console.log("gespraeche: ok");
