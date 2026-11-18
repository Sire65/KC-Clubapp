// 18.11.2026 KC-CLUB-LEITUNG-SPARSAM (Wunsch Hansi „einsparen über die direkte Leitung“): weniger Datenbank-Abfragen, solange die direkte
// Leitung (Supabase Realtime) steht – ohne Leitung bleibt alles wie bisher (Notweg). Aufruf: node tests/leitung-sparsam.test.mjs (offline)
import assert from "node:assert/strict";
import fs from "node:fs";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const stueck = (von, bis) => { const a = app.indexOf(von); assert.ok(a >= 0, "fehlt: " + von); const b = app.indexOf(bis, a); assert.ok(b > a, "Ende fehlt: " + bis); return app.slice(a, b); };
assert.ok((app.match(/KC-CLUB-LEITUNG-SPARSAM/g) || []).length >= 8, "jede Stelle ist gekennzeichnet");

// a) Countdowns: Abholzeit im Gerät, 6-Stunden-Regel über App-Starts hinweg (je Zugang), localStorage nur mit try/catch
{
  const teil = stueck("const CD_STAND_KEY", "const CD = {");
  const speicher = new Map(), localStorage = { getItem: (k) => speicher.has(k) ? speicher.get(k) : null, setItem: (k, v) => speicher.set(k, String(v)), removeItem: (k) => speicher.delete(k) };
  const ctx = { KEY: "a".repeat(42) + "abc123", CD: { stand: -1 } };
  const f = new Function("localStorage", "ctx", `with (ctx) { ${teil}\nreturn { cdStandLesen, cdStandMerken }; }`)(localStorage, ctx);
  assert.equal(f.cdStandLesen(), 0, "nichts gemerkt → gleich holen");
  const t = Date.now() - 3600000; f.cdStandMerken(t);
  assert.equal(ctx.CD.stand, t); assert.equal(f.cdStandLesen(), t, "nach dem Neustart gilt der gemerkte Stand");
  ctx.KEY = "b".repeat(48); assert.equal(f.cdStandLesen(), 0, "anderer Zugang → neu holen");
  ctx.KEY = "a".repeat(42) + "abc123"; f.cdStandMerken(0); assert.equal(f.cdStandLesen(), 0, "zurückgesetzt (z. B. neuer privater Termin)");
  speicher.set("kc_club_cd_stand", `${Date.now() + 86400000}|abc123`); assert.equal(f.cdStandLesen(), 0, "Zeit in der Zukunft gilt nicht");
  const kaputt = { getItem() { throw new Error("gesperrt"); }, setItem() { throw new Error("gesperrt"); }, removeItem() { throw new Error("gesperrt"); } };
  const g = new Function("localStorage", "ctx", `with (ctx) { ${teil}\nreturn { cdStandLesen, cdStandMerken }; }`)(kaputt, ctx);
  assert.equal(g.cdStandLesen(), 0, "ohne Speicher kein Fehler"); g.cdStandMerken(5); assert.equal(ctx.CD.stand, 5, "Stand trotzdem im Speicher der App");
  assert.ok(/stand: -1, uhr: null \};/.test(app) && app.includes("if (CD.stand < 0) CD.stand = CD.daten ? cdStandLesen() : 0;"), "erst beim Start gelesen (Zugang ist dann bekannt), ohne gespeicherte Daten gleich holen");
  assert.ok(app.includes("cdStandMerken(Date.now()); cdFrisch();") && (app.match(/cdStandMerken\(0\)/g) || []).length >= 2, "Erfolg gemerkt, Neu-holen-Stellen löschen den Merker");
  assert.ok(!/CD\.stand = 0/.test(app), "kein Zurücksetzen mehr am Merker vorbei");
}

// b) Push-Nachricht bei offener App: Online-Abgleich und Terminanfragen nur ohne Leitung
assert.ok(app.includes("pushNeuLaden(); if (!rtAn()) { onlinePing(); setTimeout(() => taHinweisPruefen(9), 1500); }"), "Push → nur ohne Leitung nachfragen");
assert.ok(app.includes('if (e.data?.typ === "online-ansage") { onlineAnsageSprechen([e.data.name]); if (!onlLeitungVoll()) onlinePing(); }'), "Online-Ansage → mit Anwesenheit kein Extra-Abgleich");

// c) Terminanfragen: Takt mit Leitung jedes 12. Mal (60 Min.), Rückkehr nur nach > 10 Min. oder Neuaufbau der Leitung
{
  assert.ok(/const TAH_RT_JEDES = 12, TAH_WEG_MAX_MS = 10 \* 60000;/.test(app) && /TAH_TAKT_MS = 5 \* 60000/.test(app), "5 Min. × 12 = 60 Min.");
  assert.ok(app.includes("TAH_ZULETZT = Date.now(); TAH_AUFBAU = RT.aufbauten;"), "beim Nachsehen den Stand der Leitung merken");
  assert.ok(app.includes("RT.ok = true; RT.aufbauten++;"), "jeder (Neu-)Aufbau wird gezählt");
  const teil = stueck("function taRueckkehrNoetig(", "\n") + "\n";
  const ctx = { RT: { ok: true, aufbauten: 3 }, TAH_AUFBAU: 3, TAH_WEG_MAX_MS: 600000, rtAn: () => ctx.RT.ok };
  const noetig = new Function("ctx", `with (ctx) { ${teil} return taRueckkehrNoetig; }`)(ctx);
  assert.equal(noetig(60000), false, "Leitung steht, kurz weg → nicht fragen");
  assert.equal(noetig(11 * 60000), true, "länger als 10 Min. weg → fragen");
  ctx.RT.aufbauten = 4; assert.equal(noetig(60000), true, "Leitung war unterbrochen → fragen");
  ctx.RT.aufbauten = 3; ctx.RT.ok = false; assert.equal(noetig(1000), true, "ohne Leitung wie bisher immer");
  assert.ok(app.includes("setTimeout(() => { if (taRueckkehrNoetig(weg)) taHinweisPruefen(9); }, 2500); });"), "Rückkehr in den Vordergrund");
}

// d) Pinnwand: mit Leitung 10 Min., ohne Leitung unverändert 45 s; nach Neuaufbau gleich
assert.ok(/const PW_LIVE_MS = 45000,/.test(app) && /const PW_RT_MS = 10 \* 60000;/.test(app), "45 s ohne, 10 Min. mit Leitung");
assert.ok(app.includes("if (takt === true && RT.ok && PW_AUFBAU === RT.aufbauten && Date.now() - PW_ZULETZT < PW_RT_MS) return;") && app.includes("PW_ZULETZT = Date.now(); PW_AUFBAU = RT.aufbauten;"), "Pinnwand-Bremse");

// e) Online-Abgleich: mit Leitung + Anwesenheit Sicherheitsabgleich alle 10 Min., Warten auf Anklopf-Antwort 15 s; ohne Leitung exakt wie bisher
{
  const teil = stueck("const ONL_SICHER_MS", "// KC-CLUB-LEITUNG-SPARSAM: die Anzeigen");
  const uhren = [];
  const ctx = { RT: { ok: false, anw: false, anwKeys: new Set(), anwStand: false, anwKey: "gich" }, ONL: { wartet: null, timer: null }, PUSH_AKTIV: false, ONLINE_TAKT_MAX_MS: 90000,
    sparTakt: (ms) => ms, rtAn: () => ctx.RT.ok, onlinePing: () => {}, clearInterval: () => {}, setInterval: (fn, ms) => { uhren.push({ fn, ms }); return uhren.length; } };
  const f = new Function("ctx", `with (ctx) { ${teil}\nreturn { onlineTakt, anwNurIch, ONL_SICHER_MS }; }`)(ctx);
  const takt = () => { f.onlineTakt(); return uhren[uhren.length - 1].ms; };
  assert.equal(f.ONL_SICHER_MS, 600000);
  assert.equal(takt(), 15000, "ohne Leitung, ohne Push: 15 s (unverändert)");
  ctx.PUSH_AKTIV = true; assert.equal(takt(), 60000, "ohne Leitung, mit Push: 60 s (unverändert)");
  ctx.ONL.wartet = "x"; assert.equal(takt(), 4000, "Warten ohne Leitung: 4 s (unverändert)");
  ctx.RT.ok = true; assert.equal(takt(), 15000, "Warten mit Leitung: 15 s");
  ctx.ONL.wartet = null; assert.equal(takt(), 60000, "Leitung ohne Anwesenheit: 60 s (unverändert)");
  ctx.RT.anw = true; assert.equal(takt(), 600000, "Leitung + Anwesenheit: Sicherheitsabgleich alle 10 Min.");
  let opt; ctx.onlinePing = (o) => { opt = o; }; uhren[uhren.length - 1].fn(); assert.deepEqual(opt, { sicher: true }, "als Sicherheitsabgleich gekennzeichnet");
  // f) Anwesenheit: nur ich da?
  assert.equal(f.anwNurIch(), false, "ohne Anwesenheits-Stand nie „nur ich“");
  ctx.RT.anwStand = true; ctx.RT.anwKeys = new Set(["gich"]); assert.equal(f.anwNurIch(), true);
  ctx.RT.anwKeys.add("ganders"); assert.equal(f.anwNurIch(), false);
  // Signale und Rückkehr lösen weiter sofort aus
  for (const s of ['if (s.art === "online") { onlinePing(); return; }', 'if (s.art === "klopfen" || s.art === "anruf") { onlinePing();', 'if (s.art === "mitschauen") { if (SS.id) ssHolen(true); else onlinePing(); return; }'])
    assert.ok(app.includes(s), "Signal: " + s);
  assert.ok(/else onlinePing\(\); return; \}/.test(app) && /\{ onlinePing\(\); if \(aktuelleAnsicht === "spiele"/.test(app), "vorfuehren/spiel");
  assert.ok(app.includes('document.addEventListener("visibilitychange", () => { if (!document.hidden) onlinePing(); });'), "Rückkehr in den Vordergrund");
  assert.ok(app.includes("if (!ONL.timer) { onlinePing(); onlineTakt();"), "Start");
  assert.ok(app.includes("RT.anwLetzt = Date.now(); onlinePing(); }, warte);"), "Anwesenheit kommt/geht → Abgleich (gebremst)");
  assert.ok(/function rtNachholen\(\) \{ onlinePing\(\);/.test(app), "Neuaufbau der Leitung → Abgleich");
  assert.ok(app.includes("if (ONL.timer && ONL.sicher) onlineTakt(); } // 18.11.2026 KC-CLUB-LEITUNG-SPARSAM"), "Leitung bewusst getrennt → sofort wieder alter Takt (nur aus dem Sicherheitsabgleich heraus)");
  assert.equal(ctx.ONL.sicher, true, "Merker Sicherheitsabgleich"); ctx.RT.ok = false; f.onlineTakt(); assert.equal(ctx.ONL.sicher, false);
  // Anzeigen: Stand gilt als bestätigt, solange Leitung + Anwesenheit stehen und die Leitung antwortet – höchstens bis kurz nach dem fälligen Abgleich
  assert.ok(app.includes("if (onlLeitungVoll() && ONL.echt && Date.now() - ONL.echt < ONL_SICHER_MS + 90000 && Date.now() - (RT.letzte || 0) < RT_STILL_MS) ONL.stand = Date.now();"), "bestätigter Stand");
  assert.ok(app.includes("ONL.stand = ONL.echt = Date.now();") && app.includes("ONL.stand = ONL.echt = 0;"), "echter Stand / offline");
}
// f) Sicherheitsabgleich auslassen, wenn laut Anwesenheit niemand sonst da ist (nur der Takt, nie Start/Rückkehr/Signal)
assert.ok(app.includes("if (opt?.sicher === true && anwNurIch() && !ONL.liste.length && !ONL.wartet) { ONL.stand = ONL.echt = Date.now(); return; }"), "auslassen");
assert.equal((app.match(/onlinePing\(\{ sicher: true \}\)/g) || []).length, 1, "nur der Sicherheitsabgleich trägt die Kennung");
assert.ok(app.includes('} else if (d.event === "presence_state") {') && app.includes("RT.anwKeys = new Set(Object.keys(d.payload || {})); RT.anwStand = true;"), "Anwesenheits-Stand");
assert.ok(/for \(const k of Object\.keys\(d\.payload\?\.leaves \|\| \{\}\)\) RT\.anwKeys\.delete\(k\);[^\n]*\n\s*for \(const k of Object\.keys\(d\.payload\?\.joins \|\| \{\}\)\) RT\.anwKeys\.add\(k\);/.test(app), "erst gehen, dann kommen");

// Lebenszeichen bleibt unverändert – es hält „online“ (150 s), die Einspiel-Sperre (3 Min.) und IN_APP (75 s) frisch
assert.ok(/const HERZ = \{ takt: 60, abstand: 20,/.test(app) && app.includes('const r = await apiRoh("lebenszeichen", { geraet: herzGeraet(), sichtbar: document.visibilityState !== "hidden", verkehr: verkehrStand() });'), "Lebenszeichen alle 60 s");
assert.ok(/_sichtbar: 1 \} : \{\}\) \/\* KC-CLUB-ONLINE-JEDE-ANFRAGE \*\//.test(app), "jede Anfrage einer sichtbaren App trägt _sichtbar");
assert.ok(/if \(p\?\._sichtbar !== 1 \|\| a === "online" \|\| a === "weg"/.test(server) && /onlineBeiAnfrage\(ich, a, p\);/.test(server), "Server: jede sichtbare Anfrage (auch das Lebenszeichen) hält online_seit frisch");
assert.ok(/ZULETZT_TAKT_MS = 30_000/.test(server) && /update\(\{ zuletzt_gesehen: jetzt\(\), app_version: version \}\)/.test(server), "Server: zuletzt_gesehen bei jeder Anfrage (höchstens alle 30 s)");

// g) Nutzung und Wege: Takt 5 statt 2 Min., Weglegen/Schließen sofort (keepalive), neue Wege nach 15 s
assert.ok(/const NZ_TAKT_MS = 5 \* 60000;/.test(app) && app.includes("setInterval(nzSenden, sparTakt(NZ_TAKT_MS));") && app.includes("setInterval(spurSenden, sparTakt(NZ_TAKT_MS));"), "5 Min.");
assert.ok(app.includes('document.addEventListener("visibilitychange", () => { if (document.hidden) nzSenden(); });') && app.includes('document.addEventListener("visibilitychange", () => { if (document.hidden) spurSenden(true); });') && app.includes('window.addEventListener("pagehide", () => spurSenden(true));'), "Weglegen/Schließen");
assert.ok(app.includes("SPUR_BALD = setTimeout(spurSenden, 15000);"), "Wege-Live bleibt");

assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/leitung-sparsam.test.mjs"), "läuft in der CI");
console.log("leitung-sparsam: ok");
