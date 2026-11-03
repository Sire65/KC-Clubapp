// KC-CLUB-RT-DIENST + KC-CLUB-RT-SPIEL-SPARSAM (03.11.2026, Wunsch Hansi „bau 1 und 2 ein“). Aufruf: node tests/rt-dienst.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
// Server: anbieten und jede Aktion (übernehmen, bestätigen, ablehnen, zurückziehen) klingeln „dienst“; Probe nur an Admins; nie mit Inhalt
const an = server.slice(server.indexOf('case "dienst_tausch_anbieten"'), server.indexOf('case "dienst_tausch_probe"'));
const ak = server.slice(server.indexOf('case "dienst_tausch_aktion"'), server.indexOf('case "dienst_heute"'));
assert.ok(an.includes("await dtSignal(false, ich.person_id);") && ak.includes("await dtSignal(!!r.probe, ich.person_id);"), "Signal nach Anbieten und Aktion");
const fn = server.slice(server.indexOf("async function dtSignal("), server.indexOf("async function aktiveMitglieder()"));
assert.ok(fn.includes('p_art: "dienst" }') && !/p_thread|titel|kurz/.test(fn), "nur Signal, kein Inhalt");
assert.ok(fn.includes("probe ? await adminIds()") && fn.includes("catch {"), "Probe nur Admins, Fehler still");
// App: offene Tauschbörse lädt still neu, gebremst; nach Wiederverbinden nachholen
assert.ok(app.includes('if (s.art === "dienst") { clearTimeout(RT.dt); RT.dt = setTimeout(dtSignalLaden, 600 + Math.random() * 1400); return; }'));
assert.ok(/async function dtSignalLaden\(\) \{\n  if \(!\$\("dtBlatt"\) \|\| document\.hidden/.test(app), "nur bei offener Tauschbörse");
assert.ok(app.includes("function rtNachholen() { onlinePing(); dtSignalLaden(); if (typeof spNachsehen === \"function\""), "Lücke nachholen");
// Spiele: mit Leitung nur alle 2 Min. zur Sicherheit (3 s × 40), Schachuhr bleibt schnell
assert.ok(app.includes("if (rtAn() && !SP.offen.uhr?.laeuft && SPT_TAKT.n % 40) return;") && app.includes("SP_TAKT_MS = 3000"));
assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/rt-dienst.test.mjs"), "läuft in der CI");
console.log("rt-dienst: ok");
