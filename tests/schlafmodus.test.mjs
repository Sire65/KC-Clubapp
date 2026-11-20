// KC-CLUB-SCHLAFMODUS (20.11.2026, Wunsch Hansi: vergessene, sichtbar offene Geräte sollen keine Abfragen mehr machen). Aufruf: node tests/schlafmodus.test.mjs (offline)
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), haupt = lies("app.js"), html = lies("index.html"), server = lies("supabase/functions/kc-club/index.ts");

// ---------- Hilfen: Funktionsrumpf und Rückruf eines setInterval (Klammern zählen, Zeichenketten grob überspringen) ----------
function bisKlammerZu(text, ab) { // ab = Index NACH der öffnenden Klammer; liefert Index der passenden schließenden
  let tiefe = 1, i = ab, q = null;
  for (; i < text.length && tiefe; i++) {
    const c = text[i];
    if (q) { if (c === "\\") i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === "`") q = c;
    else if (c === "(" || c === "{" || c === "[") tiefe++;
    else if (c === ")" || c === "}" || c === "]") tiefe--;
  }
  return i - 1;
}
const rumpfCache = new Map();
function rumpf(name) {
  if (rumpfCache.has(name)) return rumpfCache.get(name);
  const m = new RegExp(`(?:^|\\n)\\s*(?:async )?function ${name}\\(`).exec(app);
  let r = null;
  if (m) { const auf = app.indexOf("{", app.indexOf(")", m.index + m[0].length - 1)); r = app.slice(auf, bisKlammerZu(app, auf + 1) + 1); }
  rumpfCache.set(name, r); return r;
}
const fragt = (t) => /\bapi\(|\bapiRoh\(|fetch\(API\b/.test(t || "");
const aufrufe = (t) => [...new Set([...(t || "").matchAll(/\b([a-zA-Z_][\w]*)\(/g)].map((m) => m[1]))].filter((n) => !["if", "for", "while", "switch", "catch", "function", "return", "setTimeout", "clearTimeout", "clearInterval", "setInterval"].includes(n));

// ---------- 1. Jeder setInterval-Takt, der (direkt oder eine Stufe tiefer) beim Server fragt, prüft ruht() ----------
// Dokumentierte Ausnahmen (Stichwort im Rückruf): der Takt läuft nur, solange etwas aktiv ist, das das Einschlafen ohnehin verhindert (schlafAusnahme()),
// oder er endet beim Einschlafen von selbst.
const AUSNAHMEN = {
  anrufPruefen: "laufender Anruf (RUF) – Anruf verhindert das Einschlafen",
  "RUF !== R": "Anruf-Neuaufbau (rufNeuStart) – nur während eines Anrufs",
  konfTakt: "Konferenz-Anruf (RUF.konf)",
  anrufQualitaet: "laufender Anruf",
  'event: "heartbeat"': "Herzschlag der direkten Leitung – rtTrennen() beendet ihn beim Einschlafen",
  "SPR.start": "Sprachaufnahme läuft (höchstens 3 Min., man spricht gerade)",
  fokusVorher: "Hänger-Wächter – misst nur, meldet nur bei sichtbarer App nach einem Hänger",
  "MSCH.id": "Mitschauen-Ende (lokal), Mitschauen verhindert das Einschlafen",
  vfHolen: "Vorführen/Zuschauen (vf-an, VF.rolle) – prüft ruht() selbst bei sofort !== true",
  spgSenderTakt: "Live zeigen (VF.rolle = zeigt) – prüft ruht() selbst",
  ssHolen: "Mitschauen (SS.id) – prüft ruht() selbst bei sofort !== true",
  tlDa: "Tisch live (TL.live, stromZuschauen) – Leitung, keine Datenbank",
};
const takte = [];
for (const m of app.matchAll(/setInterval\(/g)) {
  const ab = m.index + m[0].length, zu = bisKlammerZu(app, ab), inhalt = app.slice(ab, zu);
  const zeile = app.slice(0, m.index).split("\n").length;
  const namen = aufrufe(inhalt), tief = namen.map((n) => [n, rumpf(n)]).filter(([, r]) => r);
  const direkt = fragt(inhalt), ueber = tief.filter(([, r]) => fragt(r)).map(([n]) => n);
  if (!direkt && !ueber.length) continue;
  takte.push({ zeile, inhalt: inhalt.slice(0, 160), direkt, ueber, ok: /\bruht\(\)|SCHLAF\.an/.test(inhalt) || ueber.some((n) => /\bruht\(\)|SCHLAF\.an/.test(rumpf(n).slice(0, 400))) || Object.keys(AUSNAHMEN).some((k) => inhalt.includes(k)) });
}
const offen = takte.filter((t) => !t.ok);
assert.ok(takte.length >= 15, "Abfrage-Takte gefunden: " + takte.length);
assert.deepEqual(offen.map((t) => `Programmzeile ${t.zeile}: ${t.inhalt}`), [], "Takte ohne ruht()");
// die wichtigsten Takte ausdrücklich
for (const [name, muster] of [["onlinePing", /async function onlinePing\(opt\) \{\n  if \(!KEY \|\| !ICH \|\| ruht\(\)\) return;/], ["chatTakt", /if \(chatTakt\.laeuft \|\| ruht\(\)\) return;/],
  ["pwLive", /async function pwLive\(takt\) \{\n  if \(ruht\(\) \|\| !ICH\) return;/], ["taHinweisPruefen", /if \(!ICH \|\| TAH_LAEUFT \|\| ruht\(\) \|\|/], ["herzSenden", /HB = setInterval\(\(\) => \{ if \(!ruht\(\)\) herzSenden\(\); \}/],
  ["neuLaden-Takt", /setInterval\(\(\) => \{ if \(!ruht\(\) && aktuelleAnsicht !== "chat" && \(NEU_NACH_CHAT/], ["Update-Takt", /setInterval\(\(\) => \{ if \(!ruht\(\) && aktuelleAnsicht === "start" && !chatId\) updatePruefen/],
  ["Puls", /if \(!ruht\(\) && aktuelleAnsicht === "start"\) \{\n    try \{ const r = await api\("betrieb_puls"/], ["nzSenden", /setInterval\(\(\) => \{ if \(!ruht\(\)\) nzSenden\(\); \}/], ["spurSenden", /setInterval\(\(\) => \{ if \(!ruht\(\)\) spurSenden\(\); \}/],
  ["Spiele", /aktuelleAnsicht !== "spiele" \|\| ruht\(\) \|\| KTM\.frage/]]) assert.match(app, muster, name);
// „online“-Ereignis und Push-/Signal-Neuladen nur, wenn die App nicht ruht
assert.ok(haupt.includes('window.addEventListener("online", () => { if (KEY && !ruht()) neuLaden(); owSenden(); });'), "online → neuLaden nur wach");
assert.ok(!/setTimeout\(\(\) => \{ if \(!document\.hidden\) neuLaden\(\); \}/.test(haupt), "kein neuLaden-Zeitgeber nur mit document.hidden");
assert.ok(haupt.includes('navigator.serviceWorker.addEventListener("message", (e) => { if (SCHLAF.an) return;'), "Push bei schlafender App lädt nichts");
// Sicherheitsnetz: api() fragt im Schlaf nie
assert.match(haupt, /async function api\(action, daten = \{\}, opt = \{\}\) \{\n  const sichtbar = ladeSichtbar\(action, opt\);[^\n]*if \(SCHLAF\.an\) throw Object\.assign\(new Error\("💤 Die App schläft/);
assert.ok(haupt.indexOf("function ruht()") < haupt.indexOf('document.addEventListener("visibilitychange", () => { if (!document.hidden && DS.modus'), "Schlaf-Block vor den anderen Rückkehr-Wegen");

// ---------- 2. Einschlafen nach 15 Min., Eingaben, Ausnahmen ----------
assert.ok(haupt.includes("const SCHLAF_MS = 15 * 60000, SCHLAF_CHAT_MS = 5 * 60000"), "15 Min. / Chat 5 Min.");
for (const t of ['["pointerdown", "wheel", "touchstart"]', 'addEventListener("mousemove"', 'addEventListener("keydown"']) assert.ok(haupt.includes(t), "Eingabe " + t);
assert.ok(/j - SCHLAF\.maus > 5000/.test(haupt), "mousemove gedrosselt");
const ausn = rumpf("schlafAusnahme");
for (const t of ["RUF", "#anrufSchirm", "stromZuschauen()", "VF?.rolle", "SS?.id", 'aktuelleAnsicht === "chat"', "SCHLAF_CHAT_MS", "dsBlatt", "ST?.eigen", "WKK?.art"]) assert.ok(ausn.includes(t), "Ausnahme " + t);
assert.ok(html.includes('onclick="schlafJetzt()">💤 Jetzt schlafen legen</button>'), "Menüpunkt Jetzt schlafen legen");

// ---------- 3./4. Sandbox: Einschlafen, Schicht, weg + Leitung trennen, keine Abfrage im Schlaf, Aufwachen = genau EIN neuLaden ----------
const anfang = haupt.indexOf("// ---------- KC-CLUB-SCHLAFMODUS"), ende = haupt.indexOf("// 2.837.0 KC-CLUB-START-SCHNELLER", anfang);
assert.ok(anfang > 0 && ende > anfang, "Schlaf-Block gefunden");
const block = haupt.slice(anfang, ende);
function sandbox({ wahl = null, jetzt = Date.now(), hidden = false, extra = {} } = {}) {
  const el = (id) => ({ id, hidden: false, style: { setProperty() {} }, textContent: "", innerHTML: "", tabIndex: 0, kinder: {}, setAttribute() {}, addEventListener(t, f) { (this.ev ||= {})[t] = f; },
    querySelector(s) { return (this.kinder[s] ||= el(s)); }, remove() { delete dom[this.id]; }, classList: { add() {}, remove() {}, toggle() {} } });
  const dom = {}, zaehler = { neuLaden: 0, rtVerbinden: 0, rtTrennen: 0, weg: 0, api: 0, spur: [], onlinePing: 0, chatLaden: 0 }, listener = { win: {}, doc: {} };
  const document = { hidden, head: { appendChild(s) { dom[s.id] = s; } }, body: { appendChild(d) { dom[d.id] = d; } }, documentElement: { classList: { add() {}, remove() {} } },
    getElementById: (id) => dom[id] || null, querySelector: (s) => (s.startsWith("#schlafSchicht") ? dom.schlafSchicht?.querySelector(s.slice(15)) || null : null), createElement: () => el(""),
    addEventListener: (t, f) => (listener.doc[t] ||= []).push(f) };
  const ctx = { document, Date: { now: () => ctx.__jetzt }, __jetzt: jetzt, matchMedia: () => ({ matches: false }), setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, navigator: {},
    addEventListener: (t, f) => (listener.win[t] ||= []).push(f), String, Math, RegExp, Number, Object,
    INIT: { einstellungen: wahl ? { schlafmodus: wahl } : {}, rtKanal: "k" }, KEY: "k", ICH: { person_id: "p" }, RT: { ok: false, warte: 0 }, RUF: null, VF: { rolle: null }, SS: { id: null }, ST: { eigen: null }, WKK: { art: "" },
    FENSTER: { schlaeft: false }, aktuelleAnsicht: "start", chatId: null, CHAT_AKTIV: 0, stromZuschauen: () => false, melde() {},
    neuLaden: () => { zaehler.neuLaden++; }, rtVerbinden: () => { zaehler.rtVerbinden++; ctx.RT.ok = true; }, rtTrennen: () => { zaehler.rtTrennen++; }, onlineWegMelden: () => { zaehler.weg++; },
    onlinePing: () => { zaehler.onlinePing++; }, lsNachSchlaf: (g) => { zaehler.ls = (zaehler.ls || []).concat(g); }, chatLaden: () => { zaehler.chatLaden++; }, spur: (w, m) => zaehler.spur.push(w), ...extra };
  ctx.Date = new Proxy(Date, { get: (t, k) => (k === "now" ? () => ctx.__jetzt : Reflect.get(t, k)), construct: (t, a) => new t(...(a.length ? a : [ctx.__jetzt])) });
  vm.createContext(ctx);
  vm.runInContext(block + "\n;globalThis.__S = { SCHLAF, ruht, schlafPruefen, schlafAufwachen, schlafZeitErlaubt, schlafEin, schlafAusnahme };", ctx);
  return { ctx, S: ctx.__S, dom, zaehler, listener };
}
// reine Funktion: Zeitbereich über Mitternacht
{ const { S } = sandbox(), z = S.schlafZeitErlaubt, w = { art: "zeit", von: "22:00", bis: "07:00" }, m = (h, mi = 0) => h * 60 + mi;
  assert.equal(z(null, m(12)), true, "Standard = immer"); assert.equal(z({ art: "immer" }, m(3)), true); assert.equal(z({ art: "aus" }, m(23)), false, "aus");
  assert.equal(z(w, m(22)), true); assert.equal(z(w, m(23, 59)), true); assert.equal(z(w, m(0)), true); assert.equal(z(w, m(6, 59)), true);
  assert.equal(z(w, m(7)), false); assert.equal(z(w, m(12)), false); assert.equal(z(w, m(21, 59)), false);
  const tag = { art: "zeit", von: "08:00", bis: "17:30" }; assert.equal(z(tag, m(8)), true); assert.equal(z(tag, m(17, 29)), true); assert.equal(z(tag, m(17, 30)), false); assert.equal(z(tag, m(7, 59)), false);
  assert.equal(z({ art: "zeit", von: "kaputt", bis: "x" }, m(23)), true, "ungültig → 22–7 Uhr"); assert.equal(z({ art: "zeit", von: "kaputt", bis: "x" }, m(12)), false); }
// 15 Min. ohne Eingabe → schläft; vorher nicht
{ const t0 = new Date(2026, 10, 20, 12, 0).getTime(), s = sandbox({ jetzt: t0 });
  s.ctx.__jetzt = t0 + 14 * 60000; assert.equal(s.S.schlafPruefen(s.ctx.__jetzt), false, "nach 14 Min. wach");
  s.ctx.__jetzt = t0 + 15 * 60000 + 1; assert.equal(s.S.schlafPruefen(s.ctx.__jetzt), true, "nach 15 Min. eingeschlafen");
  assert.equal(s.S.SCHLAF.an, true); assert.equal(s.S.ruht(), true, "ruht() im Schlaf");
  assert.ok(s.dom.schlafSchicht && s.dom.schlafStil, "Bildschirmschoner-Schicht + Stil"); assert.ok(s.dom.schlafSchicht.innerHTML.includes("💤 Die App schläft") && s.dom.schlafSchicht.innerHTML.includes("Hier tippen zum Aufwecken") && s.dom.schlafSchicht.innerHTML.includes("icon-192.png"));
  assert.equal(s.zaehler.weg, 1, "einmal „weg“"); assert.equal(s.zaehler.rtTrennen, 1, "Leitung getrennt"); assert.deepEqual(s.zaehler.spur, ["schlaf_ein"], "Spur-Eintrag");
  assert.equal(s.zaehler.neuLaden, 0, "im Schlaf kein Laden");
  // Push → „Neues eingegangen“ (ohne Abfrage) – hier direkt am Zustand geprüft
  // Aufwachen per Tipp: genau EIN neuLaden + Leitung
  s.dom.schlafSchicht.ev.click({ preventDefault() {}, stopPropagation() {} });
  assert.equal(s.S.SCHLAF.an, false); assert.equal(s.dom.schlafSchicht, undefined, "Schicht weg");
  assert.equal(s.zaehler.neuLaden, 1, "genau ein neuLaden"); assert.equal(s.zaehler.rtVerbinden, 1, "Leitung wieder auf");
  assert.deepEqual(s.zaehler.ls, ["tipp"], "Liegen-Schutz wird beim Aufwachen einmal entschieden");
  assert.equal(s.S.schlafAufwachen("tipp"), false, "zweites Aufwachen tut nichts"); assert.equal(s.zaehler.neuLaden, 1);
  s.ctx.__jetzt += 60000; assert.equal(s.S.schlafPruefen(s.ctx.__jetzt), false, "nach dem Aufwachen zählt die Zeit neu"); }
// Aufwachen über visibilitychange: kein eigenes neuLaden (die vorhandenen Rückkehr-Wege laden genau einmal)
{ const t0 = Date.now(), s = sandbox({ jetzt: t0 }); s.ctx.__jetzt = t0 + 16 * 60000; s.S.schlafPruefen(s.ctx.__jetzt);
  s.ctx.document.hidden = false; s.listener.doc.visibilitychange.forEach((f) => f());
  assert.equal(s.S.SCHLAF.an, false); assert.equal(s.zaehler.neuLaden, 0, "Rückkehr: Laden übernimmt der vorhandene Weg"); }
// Taste weckt
{ const t0 = Date.now(), s = sandbox({ jetzt: t0 }); s.ctx.__jetzt = t0 + 16 * 60000; s.S.schlafPruefen(s.ctx.__jetzt);
  s.listener.win.keydown.forEach((f) => f({ preventDefault() {}, stopPropagation() {} })); assert.equal(s.S.SCHLAF.an, false); assert.equal(s.zaehler.neuLaden, 1); }
// Eingabe hält wach
{ const t0 = Date.now(), s = sandbox({ jetzt: t0 }); s.ctx.__jetzt = t0 + 10 * 60000; s.listener.win.pointerdown.forEach((f) => f());
  s.ctx.__jetzt = t0 + 20 * 60000; assert.equal(s.S.schlafPruefen(s.ctx.__jetzt), false, "Tipp vor 10 Min. → noch wach"); }
// Ausnahmen und Einstellung
for (const [name, extra] of [["Anruf", { RUF: { id: 1 } }], ["Video/Bühne", { stromZuschauen: () => true }], ["Vorführen", { VF: { rolle: "zeigt" } }], ["Mitschauen", { SS: { id: "x" } }],
  ["Standort", { ST: { eigen: {} } }], ["Wecker", { WKK: { art: "wecker" } }]]) {
  const t0 = Date.now(), s = sandbox({ jetzt: t0, extra }); s.ctx.__jetzt = t0 + 30 * 60000; assert.equal(s.S.schlafPruefen(s.ctx.__jetzt), false, "Ausnahme " + name); }
{ const t0 = Date.now(), s = sandbox({ jetzt: t0, extra: { aktuelleAnsicht: "chat", chatId: "c" } }); s.ctx.CHAT_AKTIV = t0 + 27 * 60000; s.ctx.__jetzt = t0 + 30 * 60000;
  assert.equal(s.S.schlafPruefen(s.ctx.__jetzt), false, "lebhafter Chat (< 5 Min.)"); s.ctx.__jetzt = t0 + 33 * 60000; assert.equal(s.S.schlafPruefen(s.ctx.__jetzt), true, "ruhiger Chat schläft"); }
{ const t0 = Date.now(), s = sandbox({ jetzt: t0, wahl: { art: "aus" } }); s.ctx.__jetzt = t0 + 60 * 60000; assert.equal(s.S.schlafPruefen(s.ctx.__jetzt), false, "Einstellung aus"); }
{ const t0 = new Date(2026, 10, 20, 12, 0).getTime(), s = sandbox({ jetzt: t0, wahl: { art: "zeit", von: "22:00", bis: "07:00" } }); s.ctx.__jetzt = t0 + 30 * 60000;
  assert.equal(s.S.schlafPruefen(s.ctx.__jetzt), false, "12:30 außerhalb 22–7"); s.ctx.__jetzt = new Date(2026, 10, 20, 23, 30).getTime(); assert.equal(s.S.schlafPruefen(s.ctx.__jetzt), true, "23:30 im Bereich"); }
{ const s = sandbox({ hidden: true }); s.ctx.__jetzt += 60 * 60000; assert.equal(s.S.schlafPruefen(s.ctx.__jetzt), false, "im Hintergrund kein Bildschirmschoner"); assert.equal(s.S.ruht(), true, "ruht() im Hintergrund"); }

// ---------- Liegen-Schutz zusammengelegt (Wunsch Hansi 20.11. „Ja zusammenlegen“): ein Tipp genügt ohne PIN, mit PIN direkt die PIN-Abfrage ----------
assert.ok(/function lsPruefen\(beimZurueckkommen\) \{\n  if \(LS\.offen \|\| !KEY \|\| lsNichtSperren\(\) \|\| SCHLAF\.an\) return;/.test(haupt), "im Schlaf keine eigene Sichtschutz-Schicht");
assert.ok(haupt.includes("if (!LS.offen && !SCHLAF.an) lsAktiv();"), "Weck-Tipp setzt den Liegen-Zeitgeber nicht zurück");
assert.ok(block.includes("try { lsNachSchlaf(grund); } catch {}"), "Aufwachen entscheidet über den Sichtschutz");
{ const q = rumpf("lsNachSchlaf"); assert.ok(q, "lsNachSchlaf");
  const lauf = ({ pin = null, minuten = 20, offen = false, heikel = false, grund = "tipp", pinSchicht = false }) => {
    const LS = { letzte: 1e9 - minuten * 60000, offen, MIN_SICHT: 15, MIN_PIN: 10 }, z = { sperren: [], entsperren: 0, aktiv: 0 };
    const f = new Function("LS", "KEY", "RUF", "lsLiegenPin", "lsHeikel", "lsSperren", "lsEntsperren", "lsAktiv", "document", "Date", "grund", q + "\n");
    f(LS, "k", null, () => pin, () => heikel, (m) => { z.sperren.push(m); LS.offen = true; }, () => { z.entsperren++; LS.offen = false; }, () => { z.aktiv++; },
      { querySelector: () => (pinSchicht ? {} : null) }, { now: () => 1e9 }, grund);
    return z; };
  let z = lauf({}); assert.deepEqual([z.sperren, z.entsperren], [[], 1], "ohne PIN: ein Tipp hebt den Sichtschutz mit auf (kein „Weiter“)");
  z = lauf({ offen: true }); assert.deepEqual([z.sperren, z.entsperren], [[], 1], "ohne PIN, Sichtschutz war schon offen: weg");
  z = lauf({ pin: { h: "x" } }); assert.deepEqual([z.sperren, z.entsperren], [[true], 0], "mit PIN: direkt die PIN-Abfrage");
  z = lauf({ pin: { h: "x" }, offen: true, pinSchicht: true }); assert.deepEqual([z.sperren, z.entsperren], [[], 0], "PIN-Abfrage steht schon: bleibt (nicht doppelt)");
  z = lauf({ pin: { h: "x" }, grund: "anruf" }); assert.deepEqual([z.sperren, z.entsperren, z.aktiv], [[], 0, 0], "Anruf weckt: PIN nicht über den Anruf, Zeitgeber bleibt alt");
  z = lauf({ minuten: 2 }); assert.deepEqual([z.sperren, z.entsperren, z.aktiv], [[], 0, 1], "kurz „Jetzt schlafen“: kein Sichtschutz");
  z = lauf({ pin: { h: "x" }, minuten: 11, heikel: true }); assert.deepEqual(z.sperren, [true], "heikle Ansicht: PIN schon nach 10 Min. wie bisher");
}
// ---------- 3. Bildschirmschoner: wandert, reduzierte Bewegung, Uhr, Push-Hinweis, über allem ----------
assert.ok(block.includes("@keyframes slWandern") && block.includes("@media (prefers-reduced-motion: reduce) { #schlafSchicht .sl-wander { animation: none !important; } }") && block.includes("j.getMinutes() % 3 === 0"), "Einbrennschutz");
assert.ok(block.includes("z-index: 2147483000") && block.includes("🔔 Neues eingegangen") && block.includes("schlafAufwachen(\"anruf\")"), "Schicht oben, Push-Hinweis, Anruf weckt");
assert.ok(/async function anrufEingehend\(id\) \{\n  if \(RUF\) return;\n  schlafAufwachen\("anruf"\);/.test(haupt) && /function wkKlingeln\(art\) \{\n  schlafAufwachen\("wecker"\);/.test(haupt), "Anruf/Wecker wecken");
assert.ok(!/setInterval\(/.test(block.slice(block.indexOf("function schlafUhr"), block.indexOf("if (typeof document"))), "Uhr ohne Dauertakt-Abfrage");

// ---------- 5. Einstellung je Mitglied: App + Server-Prüfung ----------
assert.ok(html.includes('id="schlafWahl"') && html.includes('id="schlafVon"') && html.includes('id="schlafBis"') && html.includes("Push kommt weiter an"), "Einstellung in ⚙️ → Darstellung");
assert.ok(haupt.includes('await einstSpeichern("schlafmodus", wert)') && haupt.includes("schlafEinstZeigen(); /* KC-CLUB-SCHLAFMODUS */"), "einstSpeichern + einstFuellen");
const sv = server.slice(server.indexOf("  schlafmodus: (w) => {"), server.indexOf("  ruhezeit: (w) => {"));
assert.ok(sv.length > 0 && sv.length < 600, "Server-Whitelist schlafmodus");
const pruef = new Function(sv.replace(/^\s*schlafmodus: /, "return ").replace(/,\s*$/, "").replace(/: unknown|: string/g, ""))();
assert.deepEqual(pruef({}), { art: "immer", von: "22:00", bis: "07:00" }, "Standard");
assert.deepEqual(pruef({ art: "zeit", von: "23:15", bis: "06:00" }), { art: "zeit", von: "23:15", bis: "06:00" });
assert.deepEqual(pruef({ art: "boese", von: "25:00", bis: "<b>" }), { art: "immer", von: "22:00", bis: "07:00" }, "Server prüft");
assert.deepEqual(pruef({ art: "aus" }).art, "aus");

// ---------- 6. Messung verlängert ----------
assert.ok(server.includes('EGRESS_BIS = Date.parse("2026-12-05T00:00:00Z")') && server.includes("KC-CLUB-SCHLAFMODUS (20.11.2026, Wunsch Hansi): bis 05.12.2026 verlängert"), "Egress-Messung bis 05.12.");
assert.ok(haupt.includes('schlaf_ein: "💤 App eingeschlafen (Schlafmodus)"'), "Spur-Text");

// ---------- 8. Hilfe-Tipp ----------
assert.ok(haupt.includes('{ id: "schlafmodus", thema: "technik", sym: "💤"'), "Hilfe-Tipp");
console.log(`schlafmodus: ok (${takte.length} Abfrage-Takte prüfen ruht())`);
// KC-CLUB-LS-VIDEO (20.11.2026): Sichtschutz sperrt nur nicht, wenn ein Video wirklich läuft (vorher traf „video:not([paused])“ jedes <video>)
assert.ok(!haupt.includes('"#anrufSchirm:not(.versteckt), video:not([paused])"') && haupt.includes('[...document.querySelectorAll("video")].some((v) => !v.paused && !v.ended)'), "Video-Ausnahme nur bei laufendem Video");
