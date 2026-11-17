// 2.971.0 KC-CLUB-TIPPSPIEL (Wunschliste #96): Bundesliga-Tippspiel – Punkte, Sperre ab Anpfiff, Geheimhaltung bis Anpfiff, Rechte, Datenbank
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const srv = lies("supabase/functions/kc-club/index.ts"), app = lies("app.js"), tp = lies("teile/tippspiel.js"), mig = lies("supabase/migrations/20261117_kc_club_tippspiel.sql");
// Punkte-Rechnung aus dem Server (3 genau · 2 Tordifferenz · 1 Tendenz · 0)
const quelle = srv.slice(srv.indexOf("const tippPunkte = "), srv.indexOf("let TIPP_SYNC"));
const tippPunkte = new Function(quelle.replace(/: any/g, "").replace(/\): number \| null =>/, ") =>").replace("const tippPunkte = ", "return "))();
const s = (h, g) => ({ fertig: true, tore_heim: h, tore_gast: g });
assert.equal(tippPunkte({ heim: 2, gast: 1 }, s(2, 1)), 3, "genau");
assert.equal(tippPunkte({ heim: 2, gast: 1 }, s(3, 2)), 2, "Tordifferenz");
assert.equal(tippPunkte({ heim: 1, gast: 1 }, s(2, 2)), 2, "Unentschieden mit anderer Toranzahl = Tordifferenz");
assert.equal(tippPunkte({ heim: 2, gast: 0 }, s(1, 0)), 1, "Tendenz");
assert.equal(tippPunkte({ heim: 0, gast: 1 }, s(2, 0)), 0, "daneben");
assert.equal(tippPunkte({ heim: 0, gast: 1 }, { fertig: false, tore_heim: 0, tore_gast: 1 }), null, "nicht fertig = noch keine Punkte");
// Server: Rechte, Sperre ab Anpfiff, andere erst ab Anpfiff, Quelle nur auf dem Server
const fall = srv.slice(srv.indexOf('case "tipp_stand": case "tipp_mitmachen": case "tipp_abgeben"'), srv.indexOf('case "advent_preis_melden"'));
assert.ok(/ich\.zugang !== "mitglied" && ich\.zugang !== "aushilfe"/.test(fall), "Mitglieder und Aushilfen");
assert.ok(/"tipp_stand", "tipp_mitmachen", "tipp_abgeben"/.test(srv) && /"tipp_stand", "tipp_mitmachen", "tipp_abgeben"/.test(app), "Aushilfen dürfen die drei Aufrufe");
assert.ok(/Date\.parse\(s\.anpfiff\) <= Date\.now\(\)\) throw new Fehler\("Das Spiel läuft schon/.test(fall), "Tippen nur bis Anpfiff");
assert.ok(/andere: los \?/.test(fall), "Tipps der anderen erst ab Anpfiff");
assert.ok(/h >= 0 && h <= 20 && g >= 0 && g <= 20/.test(fall), "nur Zahlen 0–20");
assert.ok(/const TIPP_LIGA = "bl1", TIPP_QUELLE = "https:\/\/api\.openligadb\.de"/.test(srv) && /AbortSignal\.timeout\(8000\)/.test(srv), "kostenlose Quelle, mit Zeitgrenze");
assert.ok(!/openligadb/i.test(tp) || /OpenLigaDB\./.test(tp), "App fragt OpenLigaDB nie selbst");
assert.ok(!/fetch\(/.test(tp) && !/heimBild|gastBild/.test(tp), "keine fremden Bilder/Seiten im Browser");
// App: Programmteil, Laufband, Einstieg
assert.ok(/tippspiel: \{ einstieg: \["tpStart", "tpTag", "tpMitmachen", "tpTippen", "tpZeigen"\], sri: "sha384-/.test(app), "Programmteil mit Fingerabdruck");
assert.ok(/\{ const tp = tpLaufband\(\); if \(tp\) add\(tp\); \}/.test(app) && /function tpLaufband\(\)/.test(app), "Hinweis im Info-Laufband");
assert.ok(/onclick="tpStart\(\)">⚽ Bundesliga-Tippspiel<\/button>/.test(lies("teile/spiele.js")), "Knopf bei 🎲 Spiele");
// Datenbank
assert.ok(/primary key \(person_id, spiel_id\)/.test(mig) && (mig.match(/enable row level security/g) || []).length === 3 && /revoke all on public\.kc_club_tipp from public, anon, authenticated/.test(mig) && /kc_neon_resume_tables/.test(mig), "Tabellen geschützt, gespiegelt, ein Tipp je Spiel");
console.log("tippspiel: alle Prüfungen bestanden");
