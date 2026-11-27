// 3.45.0 KC-CLUB-AUFBAU-CHECK (Wunsch Hansi 26.11.2026): Stand startklar? Automatische Prüfung + Liste zum Abhaken. Aufruf: node tests/aufbau-check.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const server = lies("supabase/functions/kc-club/index.ts"), teil = lies("teile/aufbaucheck.js"), app = lies("app.js"), sw = lies("sw.js");
const fall = (n) => server.slice(server.indexOf(`case "${n}": {`), server.indexOf("case ", server.indexOf(`case "${n}": {`) + 10));
for (const n of ["aufbau_check", "aufbau_haken"]) assert.ok(/if \(!\(await mcDarf\(ich\)\)\) throw new Fehler/.test(fall(n)), `${n}: nur Clubleitung und wer heute Dienst hat`);
assert.ok(/if \(ich\.vorstand \|\| ich\.admin\) return true;/.test(server) && /\(await irDienste\(\[heute\], ich\.person_id\)\)\.some/.test(server), "mcDarf: Clubleitung oder Dienst heute");
assert.ok(/\.in\("pfad", \["\/kassen-verbindungen", "\/verbindungsqualitaet"\]\)/.test(fall("aufbau_check")), "nur Technik-Meldungen des Stands (keine Umsätze)");
assert.ok(/\^\[a-z0-9_-\]\{2,60\}\$/.test(fall("aufbau_haken")) && /onConflict: "tag,punkt"/.test(fall("aufbau_haken")), "Haken je Tag und Punkt, Kennung geprüft");
const mig = lies("supabase/migrations/20261126_kc_club_aufbau_check.sql");
assert.ok(/enable row level security/.test(mig) && /revoke all on public\.kc_club_aufbau_check from public, anon, authenticated/.test(mig) && /to service_role/.test(mig), "Tabelle nur für den Server");
assert.ok(/aufbaucheck: \{ einstieg: \["acStart"\]/.test(app) && /aufbaucheck: "/.test(sw) && /onclick="acStart\(\)">🧰 Aufbau-Check ›/.test(app), "Teil eingetragen, Knopf in der Admin-Zentrale");
assert.ok(/id: "aufbau_check"/.test(app) && /acBlatt: "🧰 Aufbau-Check"/.test(app), "Hilfe und Fenstername");
// Ampel-Logik mit Beispieldaten
const esc = (s) => String(s);
const { acAuto, AC_LISTE } = new Function("esc", teil.slice(0, teil.indexOf("const AC_SYM")) + "; return { acAuto, AC_LISTE };")(esc);
const jetzt = new Date().toISOString(), alt = new Date(Date.now() - 3600000).toISOString();
const gut = acAuto({ stand: { zuletzt: jetzt, manager: true, tv: { zuletzt: jetzt }, sperre: { aktiv: false, von: "2026-12-04", bis: "2026-12-14" } },
  kassen: ["KASSE-01", "KASSE-02", "KASSE-03"].map((kasse) => ({ kasse, gekoppelt: true, zuletzt: jetzt, lag_ms: 40 })), qr: 3, pc_manager: jetzt, preise: jetzt });
assert.ok(gut.every(([, st]) => st === "ok" || st === "info"), "alles da → alles grün");
const schlecht = acAuto({ stand: { zuletzt: alt, manager: false }, kassen: [{ kasse: "KASSE-01", gekoppelt: true, zuletzt: alt, lag_ms: 2000 }], qr: 1, pc_manager: null, preise: null });
const st = Object.fromEntries(schlecht.map(([t, s]) => [t, s]));
assert.equal(st["Mini-PC meldet sich (Internet über den Router)"], "fehlt"); assert.equal(st["Kasse 2"], "fehlt"); assert.equal(st["Kasse 1: WLAN"], "fehlt");
assert.equal(st["Kassen-QR-Codes zum Koppeln"], "warn"); assert.equal(st["Fernseher holt die Präsentation"], "info", "ohne TV-Meldung nur Hinweis, Haken von Hand");
const ids = AC_LISTE.flatMap(([, l]) => l.map(([id]) => id));
assert.ok(ids.length >= 20 && new Set(ids).size === ids.length && ids.every((i) => /^[a-z0-9_-]{2,60}$/.test(i)), "Prüfpunkte eindeutig und gültig");
for (const p of ["router", "minipc", "kasse1", "kasse2", "kasse3", "scanner1", "scanner2", "scanner3", "tv", "testbon", "stechuhr"]) assert.ok(ids.includes(p), "Punkt " + p);
assert.ok(/!document\.hidden && !ruht\(\)\) acLaden\(\); \}, 30000\)/.test(teil), "Takt alle 30 s, ruht im Schlafmodus");
// 3.45.0 KC-CLUB-MORGEN-CHECK (Hansi 27.11.2026): Zeiten aus dem Dienstplan, am 04.12. 2 Std. Vorlauf, sonst 1 Std.
const mc = server.slice(server.indexOf("const MC = {"), server.indexOf("async function mcDarf("));
assert.ok(/vorlauf: \{ "2026-12-04": 120 \}/.test(mc) && /vorlaufStandard: 60/.test(mc) && /nachMin: 30/.test(mc) && /vorOeffnungMin: 15/.test(mc), "Vorlauf und Zeitpunkte");
assert.ok(/ohne: \/vorbereitung\|nachbereitung\/i/.test(mc) && /x\.startMs === ankunft/.test(mc), "erster Dienst ohne Vor-/Nachbereitung");
for (const sch of ["start", "technik", "erinnerung"]) assert.ok(new RegExp(`await protokoll\\(null, MC\\.aktion, \\{ tag: heute, schritt: "${sch}"`).test(mc), `Schritt ${sch}: erst merken, dann senden`);
assert.ok(/if \(p\.length\) \{/.test(mc) && /leitungIds\(\)/.test(mc), "Warnung nur, wenn etwas fehlt – an Clubleitung und ersten Dienst");
assert.ok(/await morgenCheckLauf\(\)\.catch/.test(server), "läuft im Zeitplaner");
const mcListe = JSON.parse(mc.match(/liste: (\[[^\]]*\])/)[1].replace(/'/g, '"'));
const { AC_MORGEN } = new Function("esc", teil.slice(0, teil.indexOf("const AC_SYM")) + "; return { AC_MORGEN };")(esc);
assert.deepEqual(AC_MORGEN.flatMap(([, l]) => l.map(([id]) => id)), mcListe, "Server-Erinnerung zählt genau die Morgen-Punkte");
assert.ok(/else if \(h === "#morgencheck"\) acStart\("morgen"\);/.test(app) && /id: "morgen_check"/.test(app), "Sprung aus dem Push, Hilfe");
assert.ok(/data-acmodus/.test(teil) && /AC_ABEND/.test(teil), "Umschalter Aufbau/Morgen/Abend");
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/aufbau-check.test.mjs"), "läuft in der CI");
console.log("aufbau-check: ok");
