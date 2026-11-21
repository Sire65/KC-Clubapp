// 21.11.2026 KC-CLUB-PW-TA-SPARSAM (Sparbilanz 21.11.: „pinnwand_neu“ nur −23 %, „terminanfragen_liste“ nur −19 % je aktive Personenstunde):
// mit stehender Leitung keine Zusatzabfrage beim Start (Stand aus „pinnwand“ bzw. init), bei Rückkehr < 10 Min. keine Abfrage, Signal lädt sofort,
// ohne Leitung wie bisher. Aufruf: node tests/pw-ta-sparsam.test.mjs (offline, Sandbox – keine Netz- oder DB-Zugriffe)
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const stueck = (von, bis) => { const a = app.indexOf(von); assert.ok(a >= 0, "fehlt: " + von); const b = app.indexOf(bis, a); assert.ok(b > a, "Ende fehlt: " + bis); return app.slice(a, b); };
assert.ok((app.match(/KC-CLUB-PW-TA-SPARSAM/g) || []).length >= 8, "jede Stelle ist gekennzeichnet");

// Uhr und Zeitgeber zum Selbst-Weiterdrehen
function uhr() {
  let jetzt = 1_800_000_000_000, n = 0; const offen = [];
  const Date_ = class extends Date { static now() { return jetzt; } };
  return { Date: Date_, setTimeout: (f, ms) => { offen.push({ f, bis: jetzt + (ms || 0), id: ++n }); return n; }, clearTimeout: () => {},
    weiter(ms) { const ziel = jetzt + ms; for (;;) { offen.sort((a, b) => a.bis - b.bis); const t = offen[0]; if (!t || t.bis > ziel) break; offen.shift(); jetzt = t.bis; t.f(); } jetzt = ziel; },
    get jetzt() { return jetzt; } };
}
const ruhig = () => new Promise((r) => setImmediate(r));

// ---------- Pinnwand ----------
const PW_CODE = stueck("async function pwStart(", "// KC-CLUB-PINNWAND-LIVE (0.57.0)") + stueck("const PW_LIVE_MS = 45000", "// KC-CLUB-PINNWAND-DIREKT (0.58.0)");
function pinnwand({ leitung = true, zettel = [], wasNeu = false } = {}) {
  const u = uhr(), rufe = [], hoerer = [], speicher = new Map();
  const ctx = {
    Date: u.Date, setTimeout: u.setTimeout, clearTimeout: u.clearTimeout,
    localStorage: { getItem: (k) => speicher.get(k) ?? null, setItem: (k, v) => speicher.set(k, String(v)) },
    document: { addEventListener: (art, f) => { if (art === "visibilitychange") hoerer.push(f); }, hidden: false },
    RT: { ok: leitung, aufbauten: leitung ? 1 : 0 }, rtAn: () => ctx.RT.ok, ruht: () => false, ICH: { person_id: "p1" },
    PW: { neu: 0, zettel: [] }, pwZahl: () => {}, pwUebernehmen: (r) => { ctx.PW.zettel = r.zettel; }, pwHilfeNeu: () => [], pwOffen: () => false,
    PW_NIE_AUTO: true, aktuelleAnsicht: "start", START_HASH: "", pwErinnern: () => true, einstiegPruefen: () => false, einrichtenEinmal: () => false, tippDesTages: () => {},
    einst: (k, v) => (k === "wasNeu2" ? wasNeu : v), wasNeuZeigen: () => false, ruheInfo: () => true, pwFenster: () => {}, zeige: () => {}, pwLaden: () => {},
    meldungen: [], melde: (t) => ctx.meldungen.push(t), ton: () => {},
    api: async (aktion) => { rufe.push(aktion); if (aktion === "pinnwand") return { zettel }; if (aktion === "pinnwand_neu") return { neu: [], anzahl: 0 }; return {}; },
  };
  const f = new Function("ctx", `with (ctx) { ${PW_CODE}\nreturn { pwStart, pwLive, get aufbau() { return PW_AUFBAU; } }; }`)(ctx);
  const sichtbar = (hidden) => { ctx.document.hidden = hidden; hoerer.forEach((h) => h()); };
  return { ...f, ctx, u, rufe, sichtbar, neu: () => rufe.filter((r) => r === "pinnwand_neu").length };
}
const fremd = [{ id: "z1", vonMir: false, gesehen: null, von: { vorname: "Anne" } }, { id: "z2", vonMir: false, gesehen: "2026-11-20" }, { id: "z3", vonMir: true, gesehen: null }];
{
  // Start mit Leitung: kein pinnwand_neu, Zahl aus dem stillen Laden
  const p = pinnwand({ zettel: fremd });
  await p.pwStart(false); await ruhig();
  assert.equal(p.neu(), 0, "Start: keine Zusatzabfrage pinnwand_neu");
  assert.deepEqual(p.rufe, ["pinnwand"], "Start: nur das stille Laden");
  assert.equal(p.ctx.PW.neu, 1, "Zahl = fremde, ungesehene Zettel");
  // Leitung baut sich 2 s nach dem Stand auf → gilt als gedeckt; erster Takt (45 s) fragt nicht
  p.u.weiter(2000); p.ctx.RT.aufbauten++; p.ctx.RT.aufbauAm = p.u.jetzt;
  p.u.weiter(43000); await p.pwLive(true);
  assert.equal(p.neu(), 0, "erster Takt nach Start: gedeckt, keine Abfrage");
  assert.equal(p.ctx.meldungen.length, 1, "noch nicht gemeldeter Zettel wird wie bisher nach 45 s einmal gemeldet");
  // Rückkehr nach 1 Min. mit Leitung (neu aufgebaut nach Hintergrund-Trennung) → keine Abfrage, auch nicht im nächsten Takt
  p.sichtbar(true); p.u.weiter(60000); p.ctx.RT.ok = false; p.sichtbar(false);
  p.u.weiter(1500); p.ctx.RT.ok = true; p.ctx.RT.aufbauten++; p.ctx.RT.aufbauAm = p.u.jetzt;
  p.u.weiter(9000); await ruhig();
  assert.equal(p.neu(), 0, "Rückkehr < 10 Min. mit Leitung → keine Abfrage");
  await p.pwLive(true); assert.equal(p.neu(), 0, "Neuaufbau nach Rückkehr gilt als gedeckt");
  // späterer Neuaufbau (Funkloch, > 15 s nach dem Stand) → Lücke → gleich fragen
  p.u.weiter(60000); p.ctx.RT.aufbauten++; p.ctx.RT.aufbauAm = p.u.jetzt;
  await p.pwLive(true); assert.equal(p.neu(), 1, "Funkloch → Takt fragt sofort");
  // Signal „pinnwand“ → pwLive() ohne Takt → sofort
  await p.pwLive(); assert.equal(p.neu(), 2, "Signal lädt sofort");
  // Takt nach 10 Min. fragt wie bisher
  p.u.weiter(10 * 60000); await p.pwLive(true); assert.equal(p.neu(), 3, "10-Min.-Takt bleibt");
  // Rückkehr nach > 10 Min. → fragen
  p.sichtbar(true); p.u.weiter(11 * 60000); p.sichtbar(false); p.u.weiter(1500); await ruhig();
  assert.equal(p.neu(), 4, "Rückkehr > 10 Min. → Abfrage");
}
{
  // Rückkehr, Leitung steht nach 10 s nicht → Abfrage (Notweg)
  const p = pinnwand({ zettel: fremd });
  await p.pwStart(false); p.sichtbar(true); p.u.weiter(60000); p.ctx.RT.ok = false; p.sichtbar(false);
  p.u.weiter(10000); await ruhig();
  assert.equal(p.neu(), 1, "Leitung nach 10 s nicht da → fragen");
}
{
  // ohne Leitung: Takt alle 45 s wie bisher
  const p = pinnwand({ leitung: false, zettel: fremd });
  await p.pwStart(false);
  p.u.weiter(45000); await p.pwLive(true); assert.equal(p.neu(), 1, "ohne Leitung: Takt fragt");
  p.u.weiter(45000); await p.pwLive(true); assert.equal(p.neu(), 2, "ohne Leitung: jeder Takt fragt");
  p.sichtbar(true); p.u.weiter(30000); p.sichtbar(false); p.u.weiter(10000); await ruhig();
  assert.equal(p.neu(), 3, "ohne Leitung: Rückkehr fragt");
}
{
  // „👋 Was ist neu“ eingeschaltet → wie bisher mit pinnwand_neu (das Fenster braucht die Zettel)
  const p = pinnwand({ zettel: fremd, wasNeu: true });
  await p.pwStart(false); assert.deepEqual(p.rufe, ["pinnwand_neu", "pinnwand"], "Was-ist-neu: alte Reihenfolge");
  const q = pinnwand({ zettel: fremd, wasNeu: true });
  await q.pwStart(true); assert.deepEqual(q.rufe, ["pinnwand"], "Begrüßung offen (nur zählen) → keine Zusatzabfrage");
}
assert.ok(!/chatLaden\(false\); setTimeout\(pwLive, 1500\);/.test(app), "Rückkehr ruft pwLive nicht mehr ungeprüft");
assert.ok(app.includes("RT.aufbauten++; RT.aufbauAm = Date.now();"), "Zeitpunkt des Leitungsaufbaus gemerkt");

// ---------- Terminanfragen ----------
const TA_CODE = stueck("const TAH_KEY =", "async function taAntwort(");
function termin({ leitung = true, initOffen = [], liste = [], ruhe = null } = {}) {
  const u = uhr(), rufe = [], hoerer = [], ls = new Map(ruhe ? [["kc_club_ta_hinweis", JSON.stringify(ruhe)]] : []);
  const ctx = {
    Date: u.Date, setTimeout: u.setTimeout, setInterval: () => 0, JSON,
    document: { addEventListener: (art, f) => { if (art === "visibilitychange") hoerer.push(f); }, hidden: false, querySelector: () => null },
    RT: { ok: leitung, aufbauten: 1 }, rtAn: () => ctx.RT.ok, ruht: () => false, ICH: { person_id: "p1" }, $: () => null, FENSTER_OFFEN: ".x", aktuelleAnsicht: "start",
    INIT: { terminanfragenOffen: initOffen }, INIT_AM: 0, TAH_AUFBAU: -1,
    lsLesen: (k) => ls.get(k) ?? null, lsSetzen: (k, v) => ls.set(k, v), heuteIso: () => "2026-11-21",
    blatt: 0, blattAuf: () => { ctx.blatt++; return { querySelectorAll: () => [] }; }, esc: (s) => s, wann: (s) => s, melde: () => {}, taZeigen: () => {}, taLaden: () => {},
    api: async (aktion) => { rufe.push(aktion); return { anfragen: liste }; },
  };
  ctx.INIT_AM = u.jetzt; // init dieses Starts
  const f = new Function("ctx", `with (ctx) { ${TA_CODE}\nreturn { taHinweisPruefen, taSignal }; }`)(ctx);
  const sichtbar = (hidden) => { ctx.document.hidden = hidden; hoerer.forEach((h) => h()); };
  return { ...f, ctx, u, rufe, sichtbar, n: () => rufe.filter((r) => r === "terminanfragen_liste").length };
}
const anfrage = (id) => ({ id, von: { vorname: "Anne" }, anlass: "Treffen", beginn: "2099-01-01T10:00:00Z", status: "offen" });
{
  // Start: init meldet nichts Offenes → keine Abfrage
  const t = termin(); await t.taHinweisPruefen(0, 1); assert.equal(t.n(), 0, "Start, init ohne offene Anfragen → keine Abfrage");
  // Start: offene Anfrage, aber schon „später“ und bekannt → keine Abfrage
  const t2 = termin({ initOffen: [{ id: "a1" }], ruhe: { ids: ["a1"], bis: 1_800_000_000_000 + 3600000 } });
  await t2.taHinweisPruefen(0, 1); assert.equal(t2.n(), 0, "Start, nur bekannte stillgestellte Anfragen → keine Abfrage");
  // Start: neue ID dabei → Liste holen, Hinweis zeigen
  const t3 = termin({ initOffen: [{ id: "a1" }, { id: "a2" }], liste: [anfrage("a1"), anfrage("a2")], ruhe: { ids: ["a1"], bis: 1_800_000_000_000 + 3600000 } });
  await t3.taHinweisPruefen(0, 1); assert.equal(t3.n(), 1, "neue ID → Liste holen"); assert.equal(t3.ctx.blatt, 1, "Hinweis erscheint");
  // Start: 5 Anfragen (Obergrenze des Servers) → vielleicht mehr → Liste holen
  const t4 = termin({ initOffen: ["a", "b", "c", "d", "e"].map((id) => ({ id })), ruhe: { ids: ["a", "b", "c", "d", "e"], heute: "2026-11-21" } });
  await t4.taHinweisPruefen(0, 1); assert.equal(t4.n(), 1, "5 = Obergrenze → Liste holen");
  // kein frischer init-Stand (Offline-Stand) → wie bisher
  const t5 = termin(); t5.ctx.INIT_AM = 0; await t5.taHinweisPruefen(0, 1); assert.equal(t5.n(), 1, "ohne frischen init-Stand wie bisher");
}
{
  // Rückkehr < 10 Min. mit Leitung → keine Abfrage
  const t = termin({ initOffen: [{ id: "a1" }] });
  t.sichtbar(true); t.u.weiter(60000); t.sichtbar(false); t.u.weiter(10000); await ruhig();
  assert.equal(t.n(), 0, "Rückkehr < 10 Min. mit Leitung → keine Abfrage");
  // Rückkehr > 10 Min.: neuLaden hat init frisch geholt (nichts offen) → keine Abfrage; init noch alt → Abfrage
  t.ctx.INIT.terminanfragenOffen = [];
  t.sichtbar(true); t.u.weiter(11 * 60000); t.sichtbar(false); t.u.weiter(1000); t.ctx.INIT_AM = t.u.jetzt; t.u.weiter(2000); await ruhig();
  assert.equal(t.n(), 0, "Rückkehr > 10 Min., frischer init-Stand ohne Offenes → keine Abfrage");
  t.sichtbar(true); t.u.weiter(11 * 60000); t.sichtbar(false); t.u.weiter(3000); await ruhig();
  assert.equal(t.n(), 1, "Rückkehr > 10 Min., init noch nicht frisch → Abfrage");
  // Signal „terminanfrage“ → sofort
  t.u.weiter(60000); t.taSignal(); await ruhig(); assert.equal(t.n(), 2, "Signal lädt sofort");
}
{
  // ohne Leitung: Rückkehr fragt wie bisher (nach 10 s)
  const t = termin({ leitung: false, initOffen: [{ id: "a1" }], liste: [anfrage("a1")] });
  t.sichtbar(true); t.u.weiter(30000); t.sichtbar(false); t.u.weiter(10000); await ruhig();
  assert.equal(t.n(), 1, "ohne Leitung: Rückkehr fragt");
}
assert.ok(app.includes("setTimeout(() => taHinweisPruefen(0, 1), 5000);"), "Start-Prüfung aus dem init-Stand");
assert.ok(app.includes("INIT = await initAnfrage; if (window.KCFP?.schlaeft) return; uhrAbgleich(INIT); INIT_AM = Date.now();"), "Zeitpunkt des frischen init gemerkt");
console.log("ok – pw-ta-sparsam");
