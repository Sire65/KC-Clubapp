// KICC-F-113 / KC-CLUB-STUNDENKONTO (Wunsch Hansi 24.11.2026): „⏱️ Mein Stundenkonto“ unter Meins – Filter Tag/Monat/Jahr/Anlass, Liste mit ID,
// Datum, Zeit, Stunden, Anlass/Tätigkeit, km, Summen, Diagramme, PDF auf dem Kopfbogen. Entscheidungen: vorläufig zählt nicht in die Summe, km ab
// „eingereicht“, Soll als Vergleich, Vorstand und Planer dürfen andere Konten sehen (protokolliert). Führt die Server-Sammlung (Datenbank nachgebildet)
// und die Rechenteile der App aus. Aufruf: node tests/stundenkonto.test.mjs (offline)
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
import { stripTypeScriptTypes } from "node:module";
import { programmText } from "./programm.mjs";
process.removeAllListeners("warning"); process.on("warning", (w) => { if (w.name !== "ExperimentalWarning") console.warn(w); });
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const teil = fs.readFileSync(new URL("../teile/stundenkonto.js", import.meta.url), "utf8");
const app = programmText();
const ci = fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8");

// ---------- 1. Server: Sammlung ausführen ----------
const block = server.slice(server.indexOf("// ---------- KICC-F-113 / KC-CLUB-STUNDENKONTO"), server.indexOf("async function sonderstundenLaden(pid: string) {"));
assert.ok(block.length > 1500, "Block KC-CLUB-STUNDENKONTO fehlt");
const T = {
  kc_dp_hour_reports: [
    { id: "aaaa1111-0000", org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", special_event_title: "Grünkohl kochen", work_date: "2026-11-10", start_h: 7, end_h: 15.5, break_minutes: 30, taetigkeit: "kochen", status: "bestaetigt", source: "club_app", updated_at: "2026-11-12T10:00:00Z" },
    { id: "bbbb2222-0000", org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", special_event_title: "Besorgungen & Fahrten", work_date: "2026-11-20", start_h: 14, end_h: 15.5, break_minutes: 0, taetigkeit: "transport", status: "bestaetigt", source: "erstattung", erstattung_id: "A1", updated_at: "2026-11-20T16:00:00Z" },
    { id: "cccc3333-0000", org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", special_event_title: "Getränke", work_date: "2026-11-21", start_h: 9, end_h: 10, break_minutes: 0, taetigkeit: "getraenke", status: "gemeldet", source: "club_app", updated_at: "2026-11-21T11:00:00Z" },
    { id: "dddd4444-0000", org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", special_event_title: "X", work_date: "2026-11-21", start_h: 9, end_h: 10, status: "abgelehnt", source: "club_app" },
    { id: "eeee5555-0000", org_id: "KC_WERNE", person_id: "P2", event_id: "KC-WM-2026", special_event_title: "fremd", work_date: "2026-11-21", start_h: 9, end_h: 10, status: "bestaetigt", source: "club_app" }],
  kc_dp_timeclock_actuals: [
    { id: "ffff6666-0000", org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", work_date: "2026-11-23", start_time: "11:00:00", end_time: "17:30:00", break_minutes: 30, status: "complete", updated_at: "2026-11-23T18:00:00Z" },
    { id: "gggg7777-0000", org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", work_date: "2026-11-24", start_time: "11:00:00", end_time: null, break_minutes: 0, status: "missing_end" },
    { id: "hhhh8888-0000", org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", work_date: "2026-11-22", start_time: "11:00:00", end_time: "12:00:00", break_minutes: 0, status: "voided" }],
  kc_dp_plan_published: [
    { org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", status: "published", work_date: "2026-11-23", start_time: "11:00", end_time: "18:00", break_minutes: 0 },
    { org_id: "KC_WERNE", person_id: "P1", event_id: "KC-WM-2026", status: "published", work_date: "2026-11-23", start_time: "19:00", end_time: "20:00", break_minutes: 0 }],
  kc_club_erstattung: [
    { id: "A1", person_id: "P1", status: "eingereicht", erstellt_am: "2026-11-20T17:00:00Z", positionen: [{ art: "fahrt", datum: "2026-11-20", km: 32, grund: "Weihnachtsmarkt", stunden: { report_id: "bbbb2222-0000" } }] },
    { id: "A2xyz9", person_id: "P1", status: "erstattet", erstellt_am: "2026-09-16T10:00:00Z", positionen: [{ art: "einkauf", datum: "2026-09-15", betrag: 5 }, { art: "fahrt", datum: "2026-09-15", km: 64, grund: "Kochen in Dortmund" }] },
    { id: "A3", person_id: "P1", status: "abgelehnt", erstellt_am: "2026-09-16T10:00:00Z", positionen: [{ art: "fahrt", datum: "2026-09-10", km: 99, grund: "abgelehnt" }] }],
};
const db = { from: (name) => { const f = []; const p = { select: () => p, eq: (k, v) => (f.push((r) => r[k] === v), p), neq: (k, v) => (f.push((r) => r[k] !== v), p),
  in: (k, v) => (f.push((r) => v.includes(r[k])), p), gte: (k, v) => (f.push((r) => String(r[k]) >= v), p), limit: () => p, order: () => p,
  then: (ok) => ok({ data: (T[name] || []).filter((r) => f.every((g) => g(r))), error: null }) }; return p; } };
const txt = (v, max) => String(v ?? "").trim().slice(0, max);
const S = Function("db", "ORG", "DW", "berlinTag", "txt", "dtPlaner", `${stripTypeScriptTypes(block)}\nreturn { stundenkontoLaden, skDarfAndere };`)(
  db, "KC_WERNE", { veranstaltung: "KC-WM-2026", name: "Weihnachtsmarkt Werne 2026" }, (d) => new Date(d.getTime() - 0).toISOString().slice(0, 10) < "2026-11-24" ? "2024-09-01" : "2026-11-24", txt, (ich) => ich.admin || (ich.aemter || []).some((a) => /dienstplan|planer/i.test(a)));
const k = await S.stundenkontoLaden("P1");
const z = (id) => k.zeilen.find((x) => x.id === id);
assert.deepEqual(k.zeilen.map((x) => x.id).sort(), ["D-FFFF66", "D-GGGG77", "E-BBBB22", "K-A2XYZ9-2", "S-AAAA11", "S-CCCC33"].sort(), "abgelehnte, fremde, ungültige und abgelehnte Anträge fehlen");
assert.equal(z("S-AAAA11").min, 510, "Sonderstunden: Pause zählt wie in DP2/„Mein Dienst“ (bezahlt)"); assert.equal(z("S-AAAA11").status, "bestaetigt");
assert.equal(z("S-AAAA11").von, "07:00"); assert.equal(z("S-AAAA11").bis, "15:30"); assert.equal(z("S-AAAA11").veranstaltung, "Weihnachtsmarkt Werne 2026");
assert.equal(z("S-CCCC33").status, "vorlaeufig", "gemeldet = vorläufig"); assert.match(z("S-CCCC33").hinweis, /Planer/);
assert.equal(z("E-BBBB22").km, 32, "km hängen an der Zeit aus der Erstattung"); assert.equal(z("E-BBBB22").kmErstattet, false, "eingereicht, noch nicht erstattet");
assert.equal(z("K-A2XYZ9-2").km, 64); assert.equal(z("K-A2XYZ9-2").kmErstattet, true); assert.equal(z("K-A2XYZ9-2").min, 0, "Fahrt ohne Zeit: eigene km-Zeile");
assert.equal(z("D-FFFF66").min, 360, "Kasse: 11:00–17:30 minus 30 Min. Pause"); assert.equal(z("D-FFFF66").status, "vorlaeufig", "Phase 1: Stand-Dienste vorläufig");
assert.equal(z("D-GGGG77").min, 0, "unvollständige Stechuhr zählt nicht"); assert.match(z("D-GGGG77").hinweis, /unvollständig/);
assert.deepEqual(k.soll, [{ datum: "2026-11-23", min: 480, veranstaltung: "Weihnachtsmarkt Werne 2026" }], "Soll je Tag addiert");
assert.equal(k.stand, "2026-11-23T18:00:00Z"); assert.equal(k.zeilen[0].datum, "2026-11-24", "neueste zuerst");
assert.equal(S.skDarfAndere({ vorstand: true, admin: false, aemter: [] }), true); assert.equal(S.skDarfAndere({ vorstand: false, admin: false, aemter: ["Dienstplaner"] }), true);
assert.equal(S.skDarfAndere({ vorstand: false, admin: false, aemter: ["Kassenwart"] }), false, "Mitglied ohne Leitung/Planung: nur das eigene Konto");

// ---------- 2. Server: Aktion ----------
const fall = server.slice(server.indexOf('case "stundenkonto": {'), server.indexOf('case "mein_dienst": {'));
assert.match(fall, /if \(!darf\) throw new Fehler\("Andere Stundenkonten dürfen nur Clubleitung und Planer ansehen\.", 403\);/);
assert.match(fall, /await protokoll\(ich\.person_id, "stundenkonto_angesehen", \{ person: pid \}\);/, "Blick in ein fremdes Konto wird protokolliert (ohne Inhalte)");
assert.match(fall, /mitglieder: darf \? /, "Mitgliederauswahl nur für Berechtigte");

// ---------- 3. App: Rechnen und Filtern ----------
const ctx = { console, ICH: { person_id: "P1" }, heuteIso: () => "2026-11-24", esc: (s) => String(s), ERS_TAET: { kochen: "Kochen", transport: "Transport / Fahrt" }, DRUCKARTEN: {} };
vm.createContext(ctx); vm.runInContext(teil + "\nthis.SKS = SKS; this.skSummen = skSummen; this.skPasst = skPasst; this.skSoll = skSoll; this.skDiagramm = skDiagramm; this.skAnlassText = skAnlassText; this.skZeitraum = skZeitraum;", ctx);
Object.assign(ctx.SKS, { d: k, zr: "jahr", jahr: "2026", monat: "2026-11", tag: "2026-11-24" });
const sichtbar = () => k.zeilen.filter((x) => ctx.skPasst(x));
let s = ctx.skSummen(sichtbar());
assert.equal(s.min, 510 + 90, "Summe nur bestätigte (Entscheidung 1)"); assert.equal(s.minVorl, 360 + 60, "vorläufig getrennt");
assert.equal(s.km, 96, "km ab eingereicht (Entscheidung 2)"); assert.equal(s.kmErst, 64);
assert.equal(ctx.skSoll().reduce((n, x) => n + x.min, 0), 480, "Soll zum Vergleich (Entscheidung 3)");
ctx.SKS.zr = "monat"; ctx.SKS.monat = "2026-09"; assert.deepEqual(sichtbar().map((x) => x.id), ["K-A2XYZ9-2"], "Monat");
ctx.SKS.zr = "tag"; ctx.SKS.tag = "2026-11-20"; assert.deepEqual(sichtbar().map((x) => x.id), ["E-BBBB22"], "Tag");
ctx.SKS.zr = "alles"; ctx.SKS.anlass = "a:Grünkohl kochen"; assert.deepEqual(sichtbar().map((x) => x.id), ["S-AAAA11"], "Anlass");
assert.equal(ctx.skSoll().length, 0, "kein Soll bei einem Sondereinsatz");
ctx.SKS.anlass = "v:Weihnachtsmarkt Werne 2026"; ctx.SKS.art = "stand"; assert.deepEqual(sichtbar().map((x) => x.id).sort(), ["D-FFFF66", "D-GGGG77"], "Veranstaltung + Art");
ctx.SKS.anlass = ""; ctx.SKS.art = ""; ctx.SKS.status = "bestaetigt"; assert.ok(sichtbar().every((x) => x.status === "bestaetigt"));
ctx.SKS.status = "beide";
for (const d of ["saeulen", "balken", "linie", "kreis"]) assert.match(ctx.skDiagramm(d, sichtbar(), ctx.skSummen(sichtbar()), true), /<svg/, `Diagramm ${d}`);
assert.equal(ctx.skAnlassText({ anlass: "Grünkohl kochen", taetigkeit: "kochen" }), "Grünkohl kochen · Kochen");
assert.equal(ctx.skAnlassText({ anlass: "Kochen", taetigkeit: "kochen" }), "Kochen", "nicht doppelt");

// ---------- 4. Einbindung ----------
assert.match(app, /\{ id: "stundenkonto", sym: "⏱️", t: "Mein Stundenkonto", u: "Stunden · km · Diagramme · PDF", aktion: "skStart\(\)" \}/, "Kachel unter Meins");
assert.ok(app.indexOf('{ id: "stundenkonto", sym: "⏱️"') > app.indexOf("  mein: ["), "Kachel steht unter Meins");
assert.match(app, /\n  stundenkonto: \{ einstieg: \["skStart"\], sri: "sha384-/, "Programmteil wird nachgeladen");
assert.match(teil, /DRUCKARTEN\.stundenkonto = \{/); assert.match(teil, /druckStarten\("stundenkonto"\)/, "Druck über das Druck-System (Kopfbogen KC-CLUB-CD)");
assert.match(teil, /Summe bestätigt/); assert.match(teil, /vorläufig \(nicht in der Summe\)/);
assert.ok(!/https?:\/\//.test(teil), "kein fremder Dienst (Diagramme selbst gezeichnet)");
assert.match(app, /\{ id: "stundenkonto", thema: "termine", sym: "⏱️"/, "Hilfe-Eintrag");
assert.match(ci, /node tests\/stundenkonto\.test\.mjs/, "Test läuft in den GitHub-Tests");
console.log("stundenkonto: alle Prüfungen bestanden");
