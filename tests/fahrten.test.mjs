// KICC-F-114 / KC-CLUB-FAHRTKOSTEN-SAMMEL (Hansi 25./26.11.2026): Fahrtprofil (Vorgabe „keine Fahrtkosten“) und Sammel-Abrechnung je Veranstaltung.
// Führt Vorschlag und Vorbereitung des Servers mit nachgebildeter Datenbank aus: nur geprüfte Dienste, je Tag eine Fahrt, Mitfahrer 0 km, schon abgerechnete
// Tage nie doppelt, erst nach der Veranstaltung, Änderungen nur innerhalb des Vorschlags; dazu die Plausibilität der App und die Einbindung.
// Aufruf: node tests/fahrten.test.mjs (offline)
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { stripTypeScriptTypes } from "node:module";
import { programmText } from "./programm.mjs";
process.removeAllListeners("warning"); process.on("warning", (w) => { if (w.name !== "ExperimentalWarning") console.warn(w); });
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const teil = fs.readFileSync(new URL("../teile/fahrten.js", import.meta.url), "utf8");
const sql = fs.readFileSync(new URL("../supabase/migrations/20261126_kc_club_fahrtprofil.sql", import.meta.url), "utf8");
const ci = fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8");
const app = programmText();

// ---------- 1. Server ausführen ----------
const block = server.slice(server.indexOf("// ---------- KICC-F-113 / KC-CLUB-STUNDENKONTO"), server.indexOf("async function sonderstundenLaden(pid: string) {"));
assert.ok(block.includes("// ---------- KICC-F-114 / KC-CLUB-FAHRTKOSTEN-SAMMEL"), "Block KC-CLUB-FAHRTKOSTEN-SAMMEL fehlt");
const T = {
  kc_club_fahrtprofil: [{ person_id: "P1", art: "auto", km: 24, geaendert_am: "2026-11-20T10:00:00Z" }, { person_id: "P2", art: "keine", km: null }],
  kc_dp_days_published: [{ org_id: "KC_WERNE", event_id: "KC-WM-2026", status: "published", work_date: "2026-12-04" }, { org_id: "KC_WERNE", event_id: "KC-WM-2026", status: "published", work_date: "2026-12-20" }],
  kc_dp_konto_published: [
    { org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", status: "published", entry_key: "A-SE-1", work_date: "2026-11-10", start_h: 7, end_h: 15.5, minutes: 510, art: "sonder", anlass: "Grünkohl kochen", special_event_id: "SE-GK" },
    { org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", status: "published", entry_key: "A-SE-2", work_date: "2026-11-20", start_h: 14, end_h: 15.5, minutes: 90, art: "erstattung", anlass: "Besorgungen & Fahrten", special_event_id: "SE-BF" },
    { org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", status: "published", entry_key: "A-1", work_date: "2026-12-04", start_h: 11, end_h: 17.5, minutes: 390, art: "stand", anlass: "Dienst am Stand" },
    { org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", status: "published", entry_key: "A-2", work_date: "2026-12-04", start_h: 19, end_h: 22, minutes: 180, art: "stand", anlass: "Dienst am Stand" },
    { org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", status: "published", entry_key: "A-3", work_date: "2026-12-05", start_h: 15, end_h: 23, minutes: 480, art: "stand", anlass: "Dienst am Stand" },
    { org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", status: "published", entry_key: "A-SE-3", work_date: "2026-12-08", start_h: 9, end_h: 12, minutes: 180, art: "sonder", anlass: "Getränke mischen", special_event_id: "SE-GM" },
    { org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", status: "published", entry_key: "A-4", work_date: "2026-12-11", start_h: 11, end_h: 20, minutes: 540, art: "stand", anlass: "Dienst am Stand" },
    { org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", status: "removed", entry_key: "A-weg", work_date: "2026-12-12", minutes: 60, art: "stand" },
    { org_id: "KC_WERNE", person_id: "P2", event_id: "KC-WM-2026", status: "published", entry_key: "B-1", work_date: "2026-12-04", start_h: 11, end_h: 17, minutes: 360, art: "stand", anlass: "Dienst am Stand" }],
  kc_dp_timeclock_actuals: [
    { id: "tc111111", org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", work_date: "2026-12-19", start_time: "11:00:00", end_time: "18:00:00", break_minutes: 0, status: "complete" },
    { id: "tc222222", org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", work_date: "2026-12-04", start_time: "11:00:00", end_time: "17:30:00", break_minutes: 0, status: "complete" }],
  kc_club_erstattung: [{ id: "E1", person_id: "P1", status: "eingereicht", sammel: null, summe: 7.2, erstellt_am: "2026-12-12T10:00:00Z", positionen: [{ art: "fahrt", datum: "2026-12-11", km: 24 }] }],
  kc_dp_carpools: [{ org_id: "KC_WERNE", event_id: "KC-WM-2026", status: "published", special_event_id: "SE-GM", fahrer_id: "P9", mitfahrer: ["P1"] }],
};
const db = { from: (name) => { const f = []; let one = false, ord = null; const p = { select: () => p, eq: (k, v) => (f.push((r) => r[k] === v), p), neq: (k, v) => (f.push((r) => r[k] !== v), p),
  in: (k, v) => (f.push((r) => v.includes(r[k])), p), gte: (k, v) => (f.push((r) => String(r[k]) >= v), p), limit: () => p, order: (k, o) => ((ord = [k, o?.ascending !== false]), p), maybeSingle: () => (one = true, p),
  then: (ok) => { const rows = (T[name] || []).filter((r) => f.every((g) => g(r)));
    if (ord) rows.sort((a, b) => (String(a[ord[0]]) < String(b[ord[0]]) ? -1 : String(a[ord[0]]) > String(b[ord[0]]) ? 1 : 0) * (ord[1] ? 1 : -1));
    ok(one ? { data: rows[0] ?? null, error: null } : { data: rows, error: null }); } }; return p; } };
class Fehler extends Error { constructor(m, status = 400) { super(m); this.status = status; } }
let HEUTE = "2026-12-22";
const S = Function("db", "ORG", "DW", "berlinTag", "berlinStunde", "txt", "dtPlaner", "Fehler", "kmSaetze", "satzFuer", "senden", "APP_URL", "jetzt",
  `${stripTypeScriptTypes(block)}\nreturn { fsVorschlag, fsSammelVorbereiten, FS_SAMMEL, FS, fsProfil };`)(
  db, "KC_WERNE", { veranstaltung: "KC-WM-2026", name: "Weihnachtsmarkt Werne 2026" }, () => HEUTE, () => 10, (v, max) => String(v ?? "").trim().slice(0, max), () => false, Fehler,
  async () => [{ satz: 0.3, ab: "2000-01-01" }], (saetze, datum) => saetze.filter((x) => x.ab <= datum).at(-1)?.satz ?? 0.3, async () => null, "https://x", () => "2026-12-22T10:00:00Z");

let v = await S.fsVorschlag("P1", "");
const z = (k) => v.zeilen.find((x) => x.key === k);
assert.equal(v.veranstaltung.id, "KC-WM-2026"); assert.equal(v.veranstaltung.ende, "2026-12-20"); assert.equal(v.abrechenbar, true, "nach dem letzten Tag abrechenbar");
assert.equal(JSON.stringify(v.zeilen.map((x) => x.datum)), JSON.stringify([...v.zeilen.map((x) => x.datum)].sort()), "chronologisch");
assert.equal(z("A-SE-1").zaehlt, true); assert.equal(z("A-SE-1").km, 24, "Sondereinsatz: km aus dem Fahrtprofil");
assert.match(z("A-SE-2").grund, /schon mit der Erstattung/, "Zeit aus der Erstattung hat ihre km schon");
assert.equal(z("A-1").zaehlt, true); assert.match(z("A-2").grund, /gleicher Tag/, "je Tag nur eine Fahrt");
assert.match(z("A-SE-3").grund, /Mitfahrer/, "Mitfahrer: der Fahrer rechnet ab"); assert.equal(z("A-SE-3").km, 0);
assert.match(z("A-4").grund, /schon abgerechnet \(Antrag vom 12\.12\.2026\)/, "nie doppelt mit einer Einzel-Erstattung");
assert.ok(!v.zeilen.some((x) => x.key === "A-weg"), "entfernte DP2-Zeile fehlt");
assert.ok(!v.zeilen.some((x) => x.key === "K-TC2222"), "Kasse-Tag mit DP2-Zeile nicht doppelt");
assert.equal(z("K-TC1111").geprueft, false); assert.match(z("K-TC1111").grund, /noch nicht vom Planer geprüft/, "nur geprüfte Dienste zählen");
assert.equal(z("A-1").satz, 0.3, "km-Satz am Tag der Fahrt");
assert.equal(v.zeilen.filter((x) => x.zaehlt).length, 3);

// Fahrtprofil „keine“ (Vorgabe) → nichts abzurechnen
let v2 = await S.fsVorschlag("P2", ""); assert.equal(v2.profil.art, "keine"); assert.equal(v2.abrechenbar, false); assert.ok(v2.zeilen.every((x) => !x.zaehlt && x.km === 0));
assert.match(v2.hinweis, /keine Fahrtkosten/);
let v3 = await S.fsVorschlag("P3", ""); assert.equal(v3.profil.art, "keine", "ohne Eintrag: keine Fahrtkosten");
// vor dem Ende nicht abrechenbar
HEUTE = "2026-12-15"; v = await S.fsVorschlag("P1", ""); assert.equal(v.abrechenbar, false); assert.match(v.hinweis, /ab 21\.12\.2026/); HEUTE = "2026-12-22";

// Vorbereiten: Positionen nur aus dem Vorschlag, km je Zeile änderbar, abwählbar; fremde Schlüssel wirkungslos
const p = { veranstaltung: "KC-WM-2026", zeilen: { "A-3": { km: 30 }, "A-1": { aus: true }, "A-4": { km: 99 }, "FREMD": { km: 999 } }, auszahlung: "bar" };
await S.fsSammelVorbereiten({ person_id: "P1" }, p);
assert.equal(p.positionen.length, 2, "A-1 abgewählt, A-4 (schon abgerechnet) und fremde Schlüssel wirkungslos");
assert.deepEqual(p.positionen.map((x) => [x.datum, x.km, x.grund]), [["2026-11-10", 24, "Sondereinsatz: Grünkohl kochen"], ["2026-12-05", 30, "Budendienst Weihnachtsmarkt Werne 2026"]]);
assert.equal(p.positionen[0].special_event_id, "SE-GK"); assert.equal(p.auszahlung, "bar"); assert.equal(p.vorschuss, 0); assert.match(p.bemerkung, /Sammel-Abrechnung Weihnachtsmarkt Werne 2026: 2 Fahrten/);
assert.deepEqual(S.FS_SAMMEL.get(p), { event: "KC-WM-2026", name: "Weihnachtsmarkt Werne 2026" }, "Kennzeichen nur vom Server");
await assert.rejects(() => S.fsSammelVorbereiten({ person_id: "P1" }, { veranstaltung: "KC-WM-2026", zeilen: { "A-3": { km: 501 } } }), /zwischen 0 und 500/);
await assert.rejects(() => S.fsSammelVorbereiten({ person_id: "P1" }, { zeilen: { "A-SE-1": { aus: true }, "A-1": { aus: true }, "A-3": { aus: true } } }), /keine Fahrt ausgewählt/);
await assert.rejects(() => S.fsSammelVorbereiten({ person_id: "P2" }, {}), /keine Fahrtkosten/);
T.kc_club_erstattung.push({ id: "E2", person_id: "P1", status: "eingereicht", sammel: "KC-WM-2026", summe: 16.2, erstellt_am: "2026-12-22T10:00:00Z", positionen: p.positionen });
v = await S.fsVorschlag("P1", ""); assert.ok(v.sammel); assert.equal(v.abrechenbar, false);
await assert.rejects(() => S.fsSammelVorbereiten({ person_id: "P1" }, { veranstaltung: "KC-WM-2026" }), /schon eingereicht/, "nur eine Sammel-Abrechnung je Veranstaltung");
const ohne = { positionen: [] }; assert.equal(S.FS_SAMMEL.has(ohne), false, "ein normaler Antrag kann sich nicht selbst als Sammel-Abrechnung ausgeben");

// ---------- 2. Einbindung Server ----------
assert.match(server, /case "fahrt_sammel_einreichen": \{\s*await fsSammelVorbereiten\(ich, p\);\s*\} \/\/ fällt bewusst durch in erstattung_senden\s*\/\/ falls through\s*case "erstattung_senden": \{/, "Sammel läuft durch den normalen Erstattungsweg");
assert.match(server, /sammelKz = FS_SAMMEL\.get\(p\) \|\| null, pos = erstattungPruefen\(p\.positionen, ich, saetze, sammelKz \? FS\.maxPos : 20\)/);
assert.match(server, /\.\.\.\(sammelKz \? \{ sammel: sammelKz\.event \} : \{\}\)/);
assert.match(server, /case "fahrtprofil_liste": \{\s*nurLeitung\(ich\);/); assert.match(server, /case "erstattung_sammel_liste": \{\s*nurLeitung\(ich\);/);
assert.match(server, /await fsErinnern\(\)\.catch/, "Erinnerung nach der Veranstaltung in der Wartung");
assert.match(sql, /create unique index if not exists kc_club_erstattung_sammel_einmal on public\.kc_club_erstattung \(person_id, sammel\) where sammel is not null and status <> 'abgelehnt'/);
assert.match(sql, /check \(art in \('keine', 'auto'\)\)/); assert.match(sql, /km > 0 and km <= 500/);

// ---------- 3. App: Plausibilität und Summen ----------
const ctx = { console, esc: (s) => String(s), $: () => null, Number, Math, String, Object, JSON, Set };
vm.createContext(ctx); vm.runInContext(teil + "\nthis.FSS = FSS; this.fsSummen = fsSummen; this.fsZeileStand = fsZeileStand; this.fsKmLesen = fsKmLesen;", ctx);
v = await (async () => { T.kc_club_erstattung.pop(); return S.fsVorschlag("P1", ""); })();
Object.assign(ctx.FSS, { v, profil: v.profil, aend: {} });
let s = ctx.fsSummen(); assert.equal(s.fahrten, 3); assert.equal(s.km, 72); assert.equal(Math.round(s.euro * 100), 2160); assert.equal(s.fehler, false);
assert.equal(ctx.fsKmLesen("12,5"), 12.5); assert.ok(Number.isNaN(ctx.fsKmLesen("abc")));
ctx.FSS.aend = { "A-3": { km: 400 } }; assert.match(ctx.fsZeileStand(v.zeilen.find((x) => x.key === "A-3")).warn, /über 300 km/);
ctx.FSS.aend = { "A-3": { km: 600 } }; assert.equal(ctx.fsSummen().fehler, true, "über 500 km sperrt das Einreichen");
ctx.FSS.aend = { "A-3": { km: 40 } }; assert.match(ctx.fsZeileStand(v.zeilen.find((x) => x.key === "A-3")).warn, /weicht vom Fahrtprofil ab/);
ctx.FSS.aend = { "A-1": { aus: true } }; s = ctx.fsSummen(); assert.equal(s.fahrten, 2); assert.equal(s.km, 48);

// ---------- 4. Einbindung App ----------
assert.match(app, /\{ id: "fahrten", sym: "🚗", t: "Fahrten & Abrechnung", u: "Fahrtprofil · km nach der Veranstaltung abrechnen", aktion: "fsStart\(\)" \}/, "Kachel unter Meins");
assert.ok(app.indexOf('{ id: "fahrten", sym: "🚗"') > app.indexOf("  mein: ["));
assert.match(app, /\n  fahrten: \{ einstieg: \["fsStart", "fsLeitung"\], sri: "sha384-/);
assert.match(app, /onclick="fsLeitung\(\)">🚗 Sammel-Freigabe<\/button>/, "Clubleitung: Knopf auf der Erstattungsseite");
assert.match(app, /else if \(h === "#fahrten"\) fsStart\(\);/, "Link aus der Erinnerung");
assert.match(app, /\{ id: "fahrten", thema: "club", sym: "🚗", t: "Fahrtkosten einfach abrechnen"/, "Hilfe-Eintrag");
assert.match(teil, /api\("erstattung_erledigen", \{ id: a\.id, status: "erstattet", ausgezahlt: a\.auszahlung === "bar" \? "bar" : "ueberweisung" \}\)/, "Freigabe über die vorhandene Aktion");
assert.ok(!/https?:\/\//.test(teil), "kein fremder Dienst");
assert.match(ci, /node tests\/fahrten\.test\.mjs/, "Test läuft in den GitHub-Tests");
console.log("fahrten: alle Prüfungen bestanden");
