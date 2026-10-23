// KC-CLUB-DIENST-STEMPEL (2.590.0, 22.10.2026, Konzept „Dienst-Anmeldung in der Club-App“, Stufe 1): Regeln für Kommen/Gehen.
// Aufruf: node tests/dienst-stempel.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { DS, DS_GRUENDE, dsStand, dsDienstJetzt, dsKarteZeigen, dsVorschlag, dsPause, dsMinuten, dsGrundNoetig, dsPruefen, dsKorrekturErlaubt, dsMeter, dsVorOrt, dsPaare, dsRund } from "../supabase/functions/kc-club/dienst-stempel.js";

const M = 60000, H = 3600000, T0 = Date.parse("2026-12-05T13:00:00Z"); // 14:00 Uhr Berlin
const dienst = { ref: "s1", startMs: T0, endeMs: T0 + 8 * H, pause: 30 };

// Entscheidungen Hansi 22.10.
assert.equal(DS.grundMin, 15); assert.equal(DS.vorMin, 120); assert.equal(DS.nachMin, 120); assert.equal(DS.korrekturStd, 24); assert.equal(DS.radiusM, 300);
assert.ok(DS_GRUENDE.includes("Länger geblieben") && DS_GRUENDE.includes("Spontan mitgeholfen"), "Gründe wie an der Kasse + spontan");

// Stand aus Buchungen (stornierte zählen nicht, Reihenfolge egal)
assert.deepEqual(dsStand([]).angemeldet, false);
{
  const b = [{ id: "a", art: "in", zeit: new Date(T0).toISOString(), quelle: "kasse" }, { id: "b", art: "out", zeit: new Date(T0 + H).toISOString(), storniert_am: "x" }];
  const s = dsStand(b); assert.ok(s.angemeldet && s.quelle === "kasse" && s.naechste === "out", "Kasse-Kommen gilt auch in der App; storniertes Gehen zählt nicht");
}
// welcher Dienst + Karte
assert.equal(dsDienstJetzt([dienst], T0 - 3 * H, null), null, "3 Std. vorher noch nicht");
assert.equal(dsDienstJetzt([dienst], T0 - 90 * M, null), dienst);
assert.ok(!dsKarteZeigen(dienst, T0 - 40 * M, null) && dsKarteZeigen(dienst, T0 - 30 * M, null), "Karte ab 30 Min. vorher");
assert.ok(dsKarteZeigen(null, T0, { angemeldet: true }), "angemeldet: Karte immer");
// Vorschlag: nahe am Plan = Plan, sonst jetzt (5 Min.)
assert.equal(dsVorschlag("in", dienst, T0 - 8 * M), T0, "13:52 → 14:00");
assert.equal(dsVorschlag("in", dienst, T0 + 47 * M), dsRund(T0 + 47 * M), "14:47 → 14:45");
assert.equal(dsVorschlag("out", dienst, T0 + 8 * H + 12 * M), T0 + 8 * H, "22:12 → 22:00");
// Pause und Summe
assert.equal(dsPause(T0, T0 + 8 * H, 30), 30); assert.equal(dsPause(T0, T0 + 7 * H, 0), 30); assert.equal(dsPause(T0, T0 + 10 * H, 0), 45); assert.equal(dsPause(T0, T0 + 5 * H, 0), 0);
assert.equal(dsMinuten(T0, T0 + 8 * H, 30), 450);
// Grund ab 15 Min.
assert.ok(!dsGrundNoetig("in", T0 + 15 * M, dienst) && dsGrundNoetig("in", T0 + 20 * M, dienst) && dsGrundNoetig("out", T0, null));
// Prüfen
const t = T0 + 5 * M;
assert.equal(dsPruefen({ art: "in", zeitMs: T0, t, dienst, stand: { angemeldet: false } }), null, "normal kommen");
assert.match(dsPruefen({ art: "in", zeitMs: T0, t, dienst, stand: { angemeldet: true } }), /schon angemeldet/);
assert.match(dsPruefen({ art: "in", zeitMs: T0, t, dienst: null, stand: {} }), /spontan/);
assert.equal(dsPruefen({ art: "in", zeitMs: T0, t, dienst: null, stand: {}, spontan: true, grund: "Spontan mitgeholfen" }), null, "spontan erlaubt");
assert.match(dsPruefen({ art: "in", zeitMs: t + 20 * M, t, dienst, stand: {} }), /Zukunft/);
assert.match(dsPruefen({ art: "in", zeitMs: T0 - 3 * H, t: T0 - 3 * H, dienst, stand: {}, grund: "x" }), /außerhalb/);
assert.match(dsPruefen({ art: "in", zeitMs: T0 + 30 * M, t: T0 + 30 * M, dienst, stand: {} }), /Grund/, "30 Min. zu spät ohne Grund");
assert.equal(dsPruefen({ art: "in", zeitMs: T0 + 30 * M, t: T0 + 30 * M, dienst, stand: {}, grund: "Später gekommen" }), null);
assert.match(dsPruefen({ art: "out", zeitMs: T0, t, dienst, stand: { angemeldet: false } }), /nicht angemeldet/);
assert.match(dsPruefen({ art: "out", zeitMs: T0 - M, t, dienst, stand: { angemeldet: true, seit: new Date(T0).toISOString() } }), /nach dem Kommen/);
assert.equal(dsPruefen({ art: "out", zeitMs: T0 + 8 * H, t: T0 + 8 * H, dienst, stand: { angemeldet: true, seit: new Date(T0).toISOString() } }), null, "pünktlich gehen");
assert.match(dsPruefen({ art: "out", zeitMs: T0 + 13 * H, t: T0 + 13 * H, dienst, stand: { angemeldet: true, seit: new Date(T0).toISOString() }, grund: "x" }), /12 Std/);
// selbst korrigieren 24 Std.
assert.ok(dsKorrekturErlaubt({ erfasst_am: new Date(T0).toISOString() }, T0 + 23 * H) && !dsKorrekturErlaubt({ erfasst_am: new Date(T0).toISOString() }, T0 + 25 * H));
// Ort: 300 m, Ungenauigkeit zählt mit; ohne Orte/Standort = null (nicht geprüft)
const heim = { name: "Vereinsheim", lat: 51.6639, lon: 7.6337, radius: 300 };
assert.ok(Math.abs(dsMeter({ lat: 51.6639, lon: 7.6337 }, { lat: 51.6666, lon: 7.6337 }) - 300) < 5, "0,0027° Breite ≈ 300 m");
assert.equal(dsVorOrt({ lat: 51.6650, lon: 7.6340 }, [heim]), true);
assert.equal(dsVorOrt({ lat: 51.6800, lon: 7.6337 }, [heim]), false);
assert.equal(dsVorOrt({ lat: 51.6680, lon: 7.6337, genau: 200 }, [heim]), true, "GPS ±200 m zählt zugunsten");
assert.equal(dsVorOrt(null, [heim]), null); assert.equal(dsVorOrt({ lat: 1, lon: 1 }, []), null);
// Paare
{
  const z = (art, h) => ({ art, zeit: new Date(T0 + h * H).toISOString() });
  const p = dsPaare([z("in", 0), z("out", 8), z("in", 9)]);
  assert.equal(p.length, 2); assert.ok(p[0].kommen && p[0].gehen && p[1].kommen && !p[1].gehen);
  assert.ok(!dsPaare([z("out", 1)])[0].kommen, "Gehen ohne Kommen");
}

// Einbau: Migration, Server, App
{
  const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
  const mig = lies("supabase/migrations/20261022_kc_club_v2590_dienst_stempel.sql"), server = lies("supabase/functions/kc-club/index.ts"), app = lies("app.js"), html = lies("index.html");
  assert.ok(/grant select, insert, update, delete on public\.kc_dp_stempel to service_role/.test(mig) && /revoke all on public\.kc_dp_stempel from public, anon, authenticated/.test(mig) && /alter table public\.kc_dp_stempel enable row level security/.test(mig), "Rechte + RLS");
  assert.ok(/kc_dp_stempel_paare with \(security_invoker = true\)/.test(mig) && /grant select on public\.kc_dp_stempel_paare to service_role/.test(mig) && !/kc_dp_timeclock_actuals/.test(mig.replace(/--[^\n]*/g, "")), "Paare zum Lesen; schreibt NICHT in die Ist-Tabelle des Dienstplans");
  assert.ok(/kasse_event_id text unique/.test(mig) && /schema text not null default 'KC_TIME_CLOCK_V1'/.test(mig), "vorbereitet für die Kasse (Stufe 2)");
  assert.ok(/dienst_stempel: \{ t: "🟢 Dienst anmelden\/abmelden"[^}]*standard: "admin" \}/.test(server), "bis zur Freigabe nur Admin");
  for (const a of ["dienst_stand", "dienst_buchen", "dienst_korrigieren", "dienst_heute", "dienst_nachtragen", "dienst_orte"]) assert.ok(server.includes(`case "${a}"`), "Aktion " + a);
  assert.ok(/case "dienst_heute": \{\s*nurAdmin\(ich\);/.test(server) && /case "dienst_nachtragen": \{\s*nurAdmin\(ich\);/.test(server) && /case "dienst_orte": \{\s*nurAdmin\(ich\);/.test(server), "Admin-Aktionen nur Admin");
  assert.ok(/"mein_ausweis", "dienst_stand", "dienst_buchen", "dienst_korrigieren"(, "dienst_tausch_liste", "dienst_tausch_anbieten", "dienst_tausch_aktion")?\]/.test(server), "Aushilfen dürfen buchen");
  assert.ok(/const pDs = dsDarf\(ich\)\.then\(\(ok\) => \(ok \? dsLage\(ich\) : null\)\)/.test(server) && /dienstStempel: await pDs/.test(server), "init: nur wenn freigegeben (keine Abfragen sonst)");
  assert.ok(/const ziel = alle \? null : await adminIds\(\);/.test(server), "Erinnerungen vor der Freigabe nur an Admins");
  assert.ok(/id="dsKarte"/.test(html) && /dsLageSetzen\(INIT\?\.dienstStempel\)/.test(app) && /h === "#dienststempel"/.test(app) && /if \(!frei\("dienst_stempel"\)\) return/.test(app), "App: Karte, Start, Link, Freigabe");
  assert.ok(lies(".github/workflows/tests.yml").includes("node tests/dienst-stempel.test.mjs"), "läuft in der CI");
}
console.log("dienst-stempel: alle Prüfungen bestanden");
