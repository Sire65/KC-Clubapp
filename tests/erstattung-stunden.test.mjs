// KICC-F-112 / KC-CLUB-ERSTATTUNG-STUNDEN (Wunsch Hansi 24.11.2026): Zeit fürs Stundenkonto gleich mit der Erstattung einreichen.
// Entscheidungen: sofort gutschreiben (keine Freigabe in DP2), Schalter immer wenn ein meldbarer Einsatz da ist, Vorbelegung „Besorgungen & Fahrten“
// (DP2 wiederkehrend 'laufend'). Prüft die Server-Logik ausgeführt (Block aus index.ts, Typen von Node entfernt, Datenbank nachgebildet),
// die Einbindung in Einreichen/Ablehnen/Laden, die App-Oberfläche und die Migration. Aufruf: node tests/erstattung-stunden.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { stripTypeScriptTypes } from "node:module";
import { programmText } from "./programm.mjs";
process.removeAllListeners("warning"); process.on("warning", (w) => { if (w.name !== "ExperimentalWarning") console.warn(w); });
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const app = programmText();
const sql = fs.readFileSync(new URL("../supabase/migrations/20261124_kc_dp_erstattung_stunden.sql", import.meta.url), "utf8");
const ci = fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8");

// ---------- 1. Server-Block ausführen ----------
const block = server.slice(server.indexOf("// ---------- KICC-F-112 / KC-CLUB-ERSTATTUNG-STUNDEN"), server.indexOf("// KC-CLUB-ERSTATTUNG-BESUCHE (2.25.4): Besuche, die schon"));
assert.ok(block.length > 2000, "Block KC-CLUB-ERSTATTUNG-STUNDEN fehlt");
const SH = (() => { const m = server.match(/const SH = (\{[\s\S]*?\});\n/); return Function(`return ${m[1]}`)(); })();
// Datenbank-Nachbildung (nur was der Block braucht)
function neueDb() {
  const t = { kc_dp_hour_reports: [], kc_club_erstattung: [], kc_dp_special_events: [] }; let fehlerBeiInsert = false, n = 0;
  const q = (name) => { const f = []; let op = "select", daten = null;
    const p = { select() { return p; }, eq(k, v) { f.push((r) => r[k] === v); return p; }, in(k, v) { f.push((r) => v.includes(r[k])); return p; }, neq(k, v) { f.push((r) => r[k] !== v); return p; },
      order() { return p; }, limit() { return p; }, maybeSingle() { op = op === "select" ? "one" : op; return p; },
      insert(z) { op = "insert"; daten = z; return p; }, update(z) { op = "update"; daten = z; return p; }, delete() { op = "delete"; return p; },
      then(ok, nein) { try { ok(lauf()); } catch (e) { nein(e); } } };
    const treffer = () => t[name].filter((r) => f.every((g) => g(r)));
    const lauf = () => {
      if (op === "insert") { if (fehlerBeiInsert) return { data: null, error: { message: "x" } }; const neu = daten.map((z) => ({ id: `hr-${++n}`, version: 1, ...z })); t[name].push(...neu); return { data: neu, error: null }; }
      if (op === "update") { const r = treffer(); r.forEach((x) => Object.assign(x, daten)); return { data: r, error: null }; }
      if (op === "delete") { const r = treffer(); t[name] = t[name].filter((x) => !r.includes(x)); return { data: r, error: null }; }
      if (op === "one") return { data: treffer()[0] ?? null, error: null };
      return { data: treffer(), error: null }; };
    return p; };
  return { t, from: q, set fehler(v) { fehlerBeiInsert = v; } };
}
class Fehler extends Error { constructor(m, status = 400) { super(m); this.status = status; } }
const txt = (v, max) => String(v ?? "").trim().slice(0, max);
function lade(db, { ausnahmen = new Set(), heute = "2026-11-24" } = {}) {
  const shEinsatzPruefen = async (evId) => { const ev = db.t.kc_dp_special_events.find((e) => e.source_id === evId); if (!ev) throw new Fehler("Diesen Sondereinsatz gibt es nicht (mehr).", 404);
    if (ev.termin_status === "OFFEN") throw new Fehler("Für diesen Einsatz steht der Termin noch nicht fest.", 409); return ev; };
  const js = stripTypeScriptTypes(block);
  return Function("db", "SH", "Fehler", "txt", "ORG", "DW", "berlinTag", "jetzt", "dienstAusnahmen", "shEinsatzPruefen", "crypto",
    `${js}\nreturn { ERS_STUNDEN, ersStundenPruefen, ersStunden, ersStundenText, ersStundenVorpruefen, ersStundenAnlegen, ersStundenZuruecknehmen, ersStundenAngebot };`)(
    db, SH, Fehler, txt, "KC_WERNE", { veranstaltung: "KC-WM-2026", name: "Weihnachtsmarkt Werne 2026" }, () => heute, () => "2026-11-24T10:00:00Z",
    async () => ausnahmen, shEinsatzPruefen, { randomUUID: () => "sammel-1" });
}
const ich = { person_id: "KC-P-M0007", name: "Anna Muster", vorname: "Anna" };
{
  const db = neueDb(); const S = lade(db);
  db.t.kc_dp_special_events.push({ source_id: "SE-BF", titel: "Besorgungen & Fahrten", termin_status: "FEST", wiederkehrend: "laufend", datum_von: null, org_id: "KC_WERNE", event_id: "KC-WM-2026", status: "published" },
    { source_id: "SE-GK", titel: "Grünkohl kochen", termin_status: "FEST", wiederkehrend: null, datum_von: "2026-11-10", datum_bis: "2026-11-10", org_id: "KC_WERNE", event_id: "KC-WM-2026", status: "published" });
  // Prüfen der Eingabe: Viertelstunden, Spanne, Pause, Tätigkeit aus der Art
  const st = S.ersStundenPruefen({ von: 14, bis: 15.5, special_event_id: "SE-BF" }, "fahrt");
  assert.equal(JSON.stringify(st), JSON.stringify({ von: 14, bis: 15.5, pause: 0, special_event_id: "SE-BF", taetigkeit: "transport" }), "Fahrt → Tätigkeit Transport");
  assert.equal(S.ersStundenPruefen({ von: 9, bis: 10, special_event_id: "SE-BF" }, "einkauf").taetigkeit, "einkauf");
  assert.equal(S.ersStundenPruefen({ von: 9, bis: 10, special_event_id: "SE-BF", taetigkeit: "kochen" }, "fahrt").taetigkeit, "kochen", "Auswahl aus der Liste gilt");
  assert.equal(S.ersStundenPruefen({ von: 9, bis: 10, special_event_id: "SE-BF", taetigkeit: "Party" }, "fahrt").taetigkeit, "transport", "Freitext wird nicht übernommen");
  assert.throws(() => S.ersStundenPruefen({ von: 9.1, bis: 10, special_event_id: "SE-BF" }, "fahrt"), /gültige Von-\/Bis/);
  assert.throws(() => S.ersStundenPruefen({ von: 10, bis: 10, special_event_id: "SE-BF" }, "fahrt"), /gültige Von-\/Bis/);
  assert.throws(() => S.ersStundenPruefen({ von: 6, bis: 23, special_event_id: "SE-BF" }, "fahrt"), /Mehr als 16 Stunden/);
  assert.throws(() => S.ersStundenPruefen({ von: 9, bis: 10, special_event_id: "" }, "fahrt"), /wofür die Zeit/);
  assert.throws(() => S.ersStundenPruefen({ von: 9, bis: 10, pause: 60, special_event_id: "SE-BF" }, "fahrt"), /Pause passt nicht/);
  assert.equal(S.ersStunden({ von: 14, bis: 15.5, pause: 30 }), 1);
  assert.match(S.ersStundenText({ von: 14, bis: 15.5, titel: "Besorgungen & Fahrten" }), /⏱️ 14:00–15:30 Uhr = 1,5 Std\. aufs Stundenkonto \(„Besorgungen & Fahrten“\)/);
  assert.match(S.ersStundenText({ von: 22, bis: 24.5 }), /22:00–00:30 Uhr = 2,5 Std\./, "über Mitternacht");

  // Angebot fürs Formular: immer, wenn ein meldbarer Einsatz da ist; Vorbelegung der ständige Einsatz
  let ang = await S.ersStundenAngebot(ich);
  assert.equal(ang.moeglich, true); assert.equal(ang.standard, "SE-BF"); assert.equal(ang.einsaetze.length, 2);
  assert.equal(ang.einsaetze.find((e) => e.id === "SE-BF").laufend, true);
  assert.equal((await lade(db, { ausnahmen: new Set([ich.person_id]) }).ersStundenAngebot(ich)).moeglich, false, "Dienstplan-Ausnahme: kein Schalter");
  assert.equal((await lade(neueDb()).ersStundenAngebot(ich)).moeglich, false, "ohne Einsatz kein Schalter");

  // Einreichen: Mitglied – Wurst beim Metzger abholen, zum Weihnachtsmarkt bringen
  const pos = [{ art: "fahrt", datum: "2026-11-20", km: 32, satz: 0.38, grund: "Veranstaltung / Weihnachtsmarkt", betrag: 12.16, stunden: S.ersStundenPruefen({ von: 14, bis: 15.5, special_event_id: "SE-BF" }, "fahrt") }];
  await S.ersStundenVorpruefen(ich, pos);
  assert.equal(pos[0].stunden.titel, "Besorgungen & Fahrten", "Titel aus dem veröffentlichten Einsatz");
  db.t.kc_club_erstattung.push({ id: "A-1", positionen: [] });
  assert.equal(await S.ersStundenAnlegen(ich, "A-1", pos), 1);
  const z = db.t.kc_dp_hour_reports[0];
  assert.equal(z.status, "bestaetigt", "sofort gutgeschrieben – keine Freigabe in DP2");
  assert.equal(z.source, "erstattung"); assert.equal(z.erstattung_id, "A-1"); assert.equal(z.person_id, ich.person_id); assert.equal(z.work_date, "2026-11-20");
  assert.equal(z.start_h, 14); assert.equal(z.end_h, 15.5); assert.equal(z.taetigkeit, "transport"); assert.equal(z.fahrt_rolle, "fahrer");
  assert.ok(z.benachrichtigt_am, "kein „gutgeschrieben“-Push hinterher (Mitglied sieht es sofort)");
  assert.equal(z.verspaetet, true, "Meldefrist wie bei Sonderstunden (3 Tage)");
  assert.equal(db.t.kc_club_erstattung[0].positionen[0].stunden.report_id, z.id, "Antrag kennt die Stundenzeile");

  // Doppelschutz: dieselbe Zeit nochmal (andere Erstattung oder Twinkey) → abgelehnt; im selben Antrag doppelt → abgelehnt
  await assert.rejects(() => S.ersStundenVorpruefen(ich, [{ ...pos[0], stunden: { ...pos[0].stunden } }]), /schon eine Stundenmeldung/);
  const zwei = [{ ...pos[0], datum: "2026-11-21", stunden: { ...pos[0].stunden } }, { art: "einkauf", datum: "2026-11-21", betrag: 5, was: "Senf", stunden: { ...pos[0].stunden, von: 15, bis: 16 } }];
  await assert.rejects(() => S.ersStundenVorpruefen(ich, zwei), /dieselbe Zeit/);
  await assert.rejects(() => S.ersStundenVorpruefen(ich, [{ ...pos[0], datum: "2026-11-30", stunden: { ...pos[0].stunden } }]), /erst nach dem Einsatz/);
  await assert.rejects(() => lade(db, { ausnahmen: new Set([ich.person_id]) }).ersStundenVorpruefen(ich, [{ ...pos[0], datum: "2026-11-19", stunden: { ...pos[0].stunden } }]), /ausgenommen/);
  await S.ersStundenVorpruefen(ich, [{ ...pos[0], km: 1, betrag: 0.38 }].map((x) => ({ ...x, stunden: undefined }))); // ohne Zeit: nichts zu prüfen

  // Speichern schlägt fehl → Antrag wird entfernt (keine Mail, keine verlorene Zeit)
  const db2 = neueDb(); db2.t.kc_dp_special_events = db.t.kc_dp_special_events; db2.t.kc_club_erstattung.push({ id: "A-2" }); db2.fehler = true;
  await assert.rejects(() => lade(db2).ersStundenAnlegen(ich, "A-2", [{ ...pos[0], stunden: { ...pos[0].stunden } }]), /nicht verschickt/);
  assert.equal(db2.t.kc_club_erstattung.length, 0, "Antrag zurückgerollt");

  // Kassenwart lehnt ab → Zeit zurückgezogen (DP2 bucht aus), Stunden für die Nachricht
  assert.equal(await S.ersStundenZuruecknehmen("A-1"), 1.5);
  assert.equal(z.status, "zurueckgezogen"); assert.equal(z.version, 2); assert.match(z.ablehngrund, /abgelehnt/);
  assert.equal(await S.ersStundenZuruecknehmen("A-1"), 0, "zweimal ablehnen nimmt nichts doppelt zurück");
  // Zeile aus dem Twinkey-Weg (club_app) bleibt unberührt
  db.t.kc_dp_hour_reports.push({ id: "tw", erstattung_id: "A-3", source: "club_app", status: "bestaetigt", start_h: 1, end_h: 2 });
  assert.equal(await S.ersStundenZuruecknehmen("A-3"), 0); assert.equal(db.t.kc_dp_hour_reports.find((r) => r.id === "tw").status, "bestaetigt");
}

// ---------- 2. Einbindung im Server ----------
const senden = server.slice(server.indexOf('case "erstattung_senden": {'), server.indexOf('case "erstattung_senden": {') + 9000);
assert.ok(senden.indexOf("await ersStundenVorpruefen(ich, pos)") < senden.indexOf('db.from("kc_club_erstattung").insert('), "Zeit wird vor dem Speichern geprüft");
assert.ok(senden.indexOf("await ersStundenAnlegen(ich, a.id, pos)") < senden.indexOf('routerSenden("club_nachricht_mail"'), "Zeit wird vor dem Mailversand eingetragen");
assert.match(senden, /stunden: Math\.round\(pos\.filter\(\(x\) => x\.stunden\)/, "Antwort nennt die gebuchten Stunden");
assert.match(server, /if \(x\?\.stunden && typeof x\.stunden === "object"\) \{\s*if \(!ERS_STUNDEN\.arten\.includes\(letzte\.art\)\)/, "Zeit nur bei Fahrt/Einkauf");
const erl = server.slice(server.indexOf('case "erstattung_erledigen": {'), server.indexOf('case "erstattung_erledigen": {') + 3000);
assert.match(erl, /const zurueck = status === "abgelehnt" \? await ersStundenZuruecknehmen\(ok\.id\) : 0;/, "Ablehnen nimmt die Zeit zurück");
assert.match(erl, /wieder aus deinem Stundenkonto genommen/, "Mitglied erfährt es");
assert.match(server, /stunden: await ersStundenAngebot\(ich\), taetigkeiten: SH\.taetigkeiten/, "Formular bekommt das Angebot");
assert.match(server, /zeit_stand: zeitStand\(a\.id\)/, "„Meine Anträge“ zeigt den Stand der Zeit");
assert.match(server, /const ev = await shEinsatzPruefen\(evId, datum\);/, "Twinkey-Meldung nutzt dieselbe Einsatzprüfung");
assert.match(server, /ev\.termin_status === "FEST" && ev\.wiederkehrend !== "laufend"/, "ständiger Einsatz ohne Datumsgrenze");
assert.match(server, /status: "gemeldet", verspaetet, source: "club_app"/, "Twinkey-Weg unverändert: gemeldet, Planer bestätigt");

// ---------- 3. App ----------
assert.match(app, /function ersZeitFeld\(art\) \{\s*const st = ERS\.stunden \|\| \{\}; if \(!st\.moeglich \|\| !\["fahrt", "einkauf"\]\.includes\(art\)\) return "";/, "Schalter nur bei Fahrt/Einkauf und wenn möglich");
assert.match(app, /⏱️ Zeit fürs Stundenkonto mitmelden\?/); assert.match(app, /data-z="nein" class="an"/, "Vorgabe: Nein");
assert.match(app, /<select id="ersVon"/); assert.match(app, /<select id="ersBis"/); assert.match(app, /<select id="ersZeitEinsatz">/); assert.match(app, /<select id="ersTaet">/);
assert.ok(!/<input[^>]*id="ers(Von|Bis|Taet|ZeitEinsatz)"/.test(app), "nur Auswahl, kein Freitext");
assert.match(app, /\+ ersZeitFeld\(art\) \+ ersSonderFeld\(\)/);
assert.match(app, /h > 2 && h > p\.km \/ 10 \+ 2/, "Rückfrage bei viel Zeit für wenig Strecke (keine Sperre)");
assert.match(app, /kommen sofort auf dein Stundenkonto/); assert.match(app, /stehen schon in deinem Stundenkonto/);
assert.match(app, /function ersZeitStandText\(z\)/); assert.match(app, /\$\{ersZeitStandText\(a\.zeit_stand\)\}/);
assert.match(app, /\{ id: "erstattung_zeit", thema: "club", sym: "⏱️", t: "Zeit gleich mit der Erstattung melden"/, "Hilfe-Eintrag");
assert.match(app, /Die mitgemeldete Zeit wird dann auch wieder aus dem Stundenkonto genommen/, "Hinweis beim Ablehnen im Büro-Eingang");
// Uhrzeit-Anzeige wie im Server
const ersUhr = Function(`return ${app.match(/const ersUhr = (\(h\) => [^\n]+);/)[1]}`)();
assert.equal(ersUhr(9), "09:00"); assert.equal(ersUhr(15.5), "15:30"); assert.equal(ersUhr(24.5), "00:30 (+1)");

// ---------- 4. Migration ----------
assert.match(sql, /check \(source in \('club_app', 'dp2', 'erstattung'\)\)/);
assert.match(sql, /add column if not exists erstattung_id uuid/);
assert.match(sql, /wiederkehrend in \('markttage', 'laufend'\)/);
for (const f of ["kc_dp_hour_reports_auto", "kc_dp_hour_report_auto_ack", "kc_dp_hour_report_storno"]) {
  assert.match(sql, new RegExp(`revoke all on function public\\.${f}\\([^)]*\\) from public, anon;`), `${f}: kein anon`);
  assert.match(sql, new RegExp(`\\('${f}', '`), `${f}: im Prüfregister`);
}
assert.ok((sql.match(/m\.role in \('admin','planner','duty_manager'\)/g) || []).length === 3, "alle drei Funktionen nur für Planungsrollen");
assert.match(sql, /where id = p_id and status = 'bestaetigt'\s*returning version into v_version;/, "Rücknahme nur bestätigter Zeilen");
assert.match(sql, /Für eine Rücknahme ist ein Grund erforderlich/);
assert.match(ci, /node tests\/erstattung-stunden\.test\.mjs/, "Test läuft in den GitHub-Tests");
console.log("erstattung-stunden: alle Prüfungen bestanden");
