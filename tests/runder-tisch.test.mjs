// KC-CLUB-RUNDER-TISCH (2.760.0, Stufe RT1): Regeln des Runden Tisches.
// Aufruf: node tests/runder-tisch.test.mjs (offline)
import assert from "node:assert/strict";
import fs from "node:fs";
import { RT, rtEndeMs, rtPhase, rtAnlegenPruefen, rtSitzt, rtSicher, rtBeitretenPruefen, rtGastgeberPruefen, rtAufraeumen, rtText } from "../supabase/functions/kc-club/runder-tisch.js";

const M = 60000, T = 86400000, B = Date.parse("2026-11-05T19:00:00Z"); // Do 20:00 Berlin
const tisch = { beginn: new Date(B).toISOString(), dauer_min: 60, verlaengert_min: 0, plaetze: 18, status: "geplant" };

// Phasen
assert.equal(rtPhase(tisch, B - 20 * M), "geplant");
assert.equal(rtPhase(tisch, B - 15 * M), "gleich", "15 Min. vorher erscheint der Tisch");
assert.equal(rtPhase(tisch, B), "offen");
assert.equal(rtPhase(tisch, B + 60 * M), "vorbei");
assert.equal(rtPhase({ ...tisch, verlaengert_min: 30 }, B + 60 * M), "offen", "verlängert");
assert.equal(rtPhase({ ...tisch, geschlossen_am: new Date(B + 10 * M).toISOString() }, B + 11 * M), "vorbei", "früher geschlossen");
assert.equal(rtPhase({ ...tisch, status: "abgesagt" }, B), "abgesagt");
assert.equal(rtEndeMs(tisch), B + 60 * M);

// Einladen
const e = { thema: "Club-Song", beginnMs: B, dauer: 60, plaetze: 18 };
assert.equal(rtAnlegenPruefen(e, B - T, 0), null);
assert.match(rtAnlegenPruefen({ ...e, thema: "  " }, B - T, 0), /Thema/);
assert.match(rtAnlegenPruefen({ ...e, thema: "x".repeat(RT.themaMax + 1) }, B - T, 0), /zu lang/);
assert.match(rtAnlegenPruefen(e, B + 10 * M, 0), /Vergangenheit/);
assert.match(rtAnlegenPruefen(e, B - (RT.vorausTage + 1) * T, 0), /im Voraus/);
assert.match(rtAnlegenPruefen({ ...e, dauer: 45 }, B - T, 0), /Dauer/);
assert.match(rtAnlegenPruefen({ ...e, plaetze: 19 }, B - T, 0), /Plätze/);
assert.match(rtAnlegenPruefen({ ...e, plaetze: 3 }, B - T, 0), /Plätze/);
assert.match(rtAnlegenPruefen({ ...e, plaetze: 4.5 }, B - T, 0), /Plätze/);
assert.match(rtAnlegenPruefen(e, B - T, RT.offenMax), /schon 3 Tische/);
assert.equal(RT.plaetzeMax, 18, "Wahl Hansi: höchstens 18");

// Wer sitzt? frisch / unsicher / weg
const z = (pid, vorSek) => ({ person_id: pid, dabei_seit: new Date(B - 600000).toISOString(), zuletzt_da: new Date(B - vorSek * 1000).toISOString(), verlassen_am: null });
assert.ok(rtSitzt(z("a", 10), B) && rtSicher(z("a", 10), B));
assert.ok(rtSitzt(z("a", 100), B) && !rtSicher(z("a", 100), B), "nach 90 s grau, aber noch am Platz");
assert.ok(!rtSitzt(z("a", RT.frischSek + 1), B), "nach 150 s ist der Platz frei");
assert.ok(!rtSitzt({ ...z("a", 10), verlassen_am: new Date(B).toISOString() }, B), "verlassen");
assert.ok(!rtSitzt({ person_id: "a", dabei_seit: null, zuletzt_da: null }, B), "nur zugesagt ist nicht am Tisch");

// Platz nehmen: Vorlauf, voll, schon da
assert.match(rtBeitretenPruefen(tisch, B - 20 * M, [], "a"), /ab 15 Minuten/);
assert.equal(rtBeitretenPruefen(tisch, B - 10 * M, [], "a"), null);
const voll = Array.from({ length: 18 }, (_, i) => z("p" + i, 5));
assert.match(rtBeitretenPruefen(tisch, B + M, voll, "neu"), /voll/);
assert.equal(rtBeitretenPruefen(tisch, B + M, voll, "p3"), null, "wer schon sitzt, darf bleiben");
assert.equal(rtBeitretenPruefen(tisch, B + M, [...voll.slice(1), z("weg", 999)], "neu"), null, "abgelaufener Platz ist frei");
assert.match(rtBeitretenPruefen({ ...tisch, status: "abgesagt" }, B, [], "a"), /abgesagt/);
assert.match(rtBeitretenPruefen(tisch, B + 61 * M, [], "a"), /vorbei/);

// Gastgeber
assert.match(rtGastgeberPruefen(tisch, "absagen", B - T, false), /nur, wer eingeladen/);
assert.equal(rtGastgeberPruefen(tisch, "absagen", B - T, true), null);
assert.match(rtGastgeberPruefen(tisch, "absagen", B + M, true), /geschlossen, nicht abgesagt/);
assert.equal(rtGastgeberPruefen(tisch, "verlaengern", B + M, true), null);
assert.equal(rtGastgeberPruefen({ ...tisch, verlaengert_min: 30 }, "verlaengern", B + M, true), null);
assert.match(rtGastgeberPruefen({ ...tisch, verlaengert_min: 60 }, "verlaengern", B + M, true), /Höchstens 60/);
assert.match(rtGastgeberPruefen(tisch, "verlaengern", B - M, true), /solange der Tisch läuft/);
assert.equal(rtGastgeberPruefen(tisch, "schliessen", B + M, true), null);
assert.match(rtGastgeberPruefen(tisch, "constructor", B + M, true), /Unbekannte/);

// Aufräumen (Wahl Hansi: Medien 7 Tage, Text 30 Tage)
const ende = B + 60 * M;
assert.deepEqual(rtAufraeumen(tisch, ende + 6 * T), { medien: false, text: false });
assert.deepEqual(rtAufraeumen(tisch, ende + 7 * T), { medien: true, text: false });
assert.deepEqual(rtAufraeumen(tisch, ende + 30 * T), { medien: true, text: true });
assert.deepEqual(rtAufraeumen({ ...tisch, medien_geloescht_am: "x" }, ende + 30 * T), { medien: false, text: true });
assert.deepEqual(rtAufraeumen({ ...tisch, status: "abgesagt" }, B + 7 * T), { medien: true, text: false }, "abgesagt: ab dem geplanten Beginn gerechnet");
assert.deepEqual(rtAufraeumen(tisch, B), { medien: false, text: false }, "laufender Tisch nie");

assert.equal(rtText(tisch), "Do 05.11. 20:00 Uhr · 60 Min.");

// Migration: Tabellen mit Rechten, Platzgrenze unter Sperre, Funktion nur für den Club-Server
const sql = fs.readFileSync(new URL("../supabase/migrations/20261030_kc_club_v2760_runder_tisch.sql", import.meta.url), "utf8");
assert.match(sql, /plaetze integer not null[^,]*check \(plaetze between 4 and 18\)/);
assert.match(sql, /for update/, "Platzgrenze unter Zeilensperre");
assert.match(sql, /revoke all on function public\.kc_club_tisch_beitreten\([^)]*\) from public, anon, authenticated;/);
assert.match(sql, /grant execute on function public\.kc_club_tisch_beitreten\([^)]*\) to service_role;/);
assert.match(sql, /set search_path = public/);

// Server und App: dieselben Grenzen, Zugang nur für Mitglieder, Freigabe erst „nur Admin“
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
assert.match(server, /runder_tisch: \{ t: "🪑 Runder Tisch", [^}]*standard: "admin" \}/, "erst Hansi testet");
for (const a of ["tisch_liste", "tisch_anlegen", "tisch_zusage", "tisch_platz", "tisch_verlassen", "tisch_gastgeber"]) {
  assert.ok(server.includes(`case "${a}":`), "Server-Aktion fehlt: " + a);
  assert.ok(app.includes(`"${a}"`), "App ruft nicht: " + a);
  assert.ok(!server.slice(server.indexOf("const ZUGANG_AKTIONEN"), server.indexOf("const ZUGANG_ERLAUBT")).includes(`"${a}"`), "Gäste/Aushilfen dürfen nicht: " + a);
}
assert.match(app, /const RT_HERZ_TISCH_MS = 60000;/, "Herzschlag alle 60 s (KC-DB-SPARSAM)");
assert.match(server, /tischWartung\(stuendlich\)/, "Erinnerung und Aufräumen in der Wartung");
console.log("OK – Runder Tisch: Regeln geprüft");
