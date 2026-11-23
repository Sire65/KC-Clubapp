// KC-CLUB-AUTOANTWORT (Wunschliste #101, Wunsch Hansi 23.11.2026 „alle, Schalter + Zeitraum + Kombination, 1× in 12 Std., nur Einzelchats, freier Text
// mit Vorlage“ + schneller Schalter ohne Zahnrad). Prüft Migration, Club-Server (mit nachgebildeter Datenbank: nur Einzelchat, 12-Std.-Sperre, keine
// Antwort auf eine Autoantwort, Zeitraum, Status-Kopplung, NOT-AUS, keine Inhalte im Protokoll) und App (Knopf, Balken, Fenster, Status-Frage, Kennzeichen).
// Aufruf: node tests/autoantwort.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { stripTypeScriptTypes } from "node:module";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), html = lies("index.html"), server = lies("supabase/functions/kc-club/index.ts");
const mig = lies("supabase/migrations/20261123_kc_club_autoantwort.sql").replace(/--[^\n]*/g, "");

// ---- Migration: zwei kleine Tabellen, nur Club-Server, keine Inhalte ----
for (const t of ["kc_club_autoantwort", "kc_club_autoantwort_gesendet"]) {
  assert.ok(new RegExp(`create table if not exists public\\.${t} \\(`).test(mig), t);
  assert.ok(mig.includes(`alter table public.${t} enable row level security;`), t + ": RLS");
  assert.ok(mig.includes(`revoke all on public.${t} from public, anon, authenticated;`), t + ": revoke");
  assert.ok(mig.includes(`grant select, insert, update, delete on public.${t} to service_role;`), t + ": service_role");
}
assert.ok(/primary key \(person_id, an_person_id, thread_id\)/.test(mig), "Sperre je (Empfänger → Absender, Chat)");
assert.ok(!/\b(body|inhalt|nachricht_text)\b/.test(mig) && !/^\s*text\s/m.test(mig), "kein Nachrichtentext in den Tabellen");

// ---- Club-Server: Quelltext ----
assert.ok(server.includes('case "autoantwort_laden":') && server.includes('case "autoantwort_speichern": {'), "Aktionen");
const za = (q) => q.slice(q.indexOf("basis: ["), q.indexOf("aushilfe: ["));
for (const q of [server, app]) assert.ok(/"express_antwort", "autoantwort_laden", "autoantwort_speichern",/.test(za(q.includes("const ZUGANG_AKTIONEN: Record") ? q.slice(q.indexOf("const ZUGANG_AKTIONEN: Record")) : q.slice(q.indexOf("ZUGANG_AKTIONEN")))), "für alle mit Chat-Zugang (auch Gäste/Aushilfen), App und Server gleich");
const nv = server.slice(server.indexOf('case "nachricht_senden": {'), server.indexOf('case "privattermin_speichern"'));
assert.ok(/if \(!notfall && !probe && p\.ohne_autoantwort !== true && tnIds\.size === 2 && !grp\) nebenbei\(autoantwortAusloesen\(/.test(nv), "nur Zweier-Chat, nie Notfall/Probe/Systemweg, im Hintergrund");
assert.ok(/text, wege: \[\], ohne_autoantwort: true \}/.test(server), "Geburtstagsgruß löst keine Autoantwort aus");
assert.ok(/\.\.\.\(g\.wichtig \? \{ wichtig: true \} : \{\}\), ohne_autoantwort: true \}/.test(server), "geplante Nachricht löst keine Autoantwort aus");
assert.ok(!/aktionAusfuehren\("nachricht_senden"[^\n]*autoantwort/.test(server.slice(server.indexOf("async function autoantwortAusloesen"), server.indexOf("// ---------- Geburtstage"))), "die Autoantwort geht NICHT über nachricht_senden (keine Schleife)");
assert.ok(/\.\.\.\(aaIds\.has\(m\.id\) \? \{ autoantwort: true \} : \{\}\)/.test(server) && /\(tn \?\? \[\]\)\.length === 2 && mids\.length \? await db\.from\("kc_club_autoantwort"\)/.test(server), "Kennzeichen nur im Zweier-Chat geladen");
const init = server.slice(server.indexOf('case "init": {'), server.indexOf('case "mitglieder": {'));
assert.ok(/const einstellungen = Object\.fromEntries\(\(pe \?\? \[\]\)/.test(init) && !/autoantwort/.test(init), "init: Stand kommt ohne Zusatzabfrage mit den Einstellungen");

// ---- Club-Server: Verhalten mit nachgebildeter Datenbank ----
const block = server.slice(server.indexOf("const AA_SCHLUESSEL"), server.indexOf("// ---------- Geburtstage"));
const baue = new Function("db", "txt", "berlinTag", "statusMap", "notausLesen", "geradeInDerApp", "personen", "vorname", "jetzt", "stummFuer", "sendenGewaehlt", "APP_URL", "protokoll", "Fehler",
  stripTypeScriptTypes(block) + "; return { aaWert, aaAktiv, aaText, aaStand, autoantwortAusloesen, AA_VORLAGE };");
function neueDb() {
  const T = { kc_club_person_einstellung: [], kc_club_autoantwort: [], kc_club_autoantwort_gesendet: [], kc_communication_messages: [], kc_communication_threads: [], kc_communication_thread_participants: [] };
  const lesen = []; // welche Spalten aus kc_communication_messages gelesen werden (darf nie vorkommen)
  const from = (t) => {
    const q = { t, op: "select", f: [], cols: "*", wert: null, opt: {} };
    const passt = (r) => q.f.every(([art, k, v]) => art === "eq" ? r[k] === v : art === "lt" ? String(r[k]) < String(v) : art === "notnull" ? r[k] != null : true);
    const run = () => {
      const tab = T[q.t] ?? (T[q.t] = []);
      if (q.op === "select") { if (q.t === "kc_communication_messages") lesen.push(q.cols); return { data: tab.filter(passt), error: null }; }
      if (q.op === "insert") { const rows = [].concat(q.wert).map((r) => ({ created_at: new Date().toISOString(), ...r })); tab.push(...rows); return { data: rows, error: null }; }
      if (q.op === "upsert") {
        const keys = q.opt.onConflict.split(","), r = q.wert, alt = tab.find((x) => keys.every((k) => x[k] === r[k]));
        if (alt) { if (q.opt.ignoreDuplicates) return { data: [], error: null }; Object.assign(alt, r); return { data: [alt], error: null }; }
        tab.push({ ...r }); return { data: [r], error: null };
      }
      if (q.op === "update") { const rows = tab.filter(passt); rows.forEach((x) => Object.assign(x, q.wert)); return { data: rows, error: null }; }
      if (q.op === "delete") { const weg = tab.filter(passt); T[q.t] = tab.filter((x) => !weg.includes(x)); return { data: weg, error: null }; }
    };
    const b = {
      select(c) { if (q.op === "select") q.cols = c; return b; }, insert(w) { q.op = "insert"; q.wert = w; return b; }, upsert(w, o) { q.op = "upsert"; q.wert = w; q.opt = o || {}; return b; },
      update(w) { q.op = "update"; q.wert = w; return b; }, delete() { q.op = "delete"; return b; },
      eq(k, v) { q.f.push(["eq", k, v]); return b; }, lt(k, v) { q.f.push(["lt", k, v]); return b; }, match(o) { for (const [k, v] of Object.entries(o)) q.f.push(["eq", k, v]); return b; },
      not(k) { q.f.push(["notnull", k]); return b; }, in() { return b; }, limit() { return b; },
      maybeSingle() { const r = run(); return Promise.resolve({ data: r.data?.[0] ?? null, error: r.error }); },
      single() { const r = run(); return Promise.resolve({ data: r.data?.[0] ?? null, error: r.data?.length ? null : { message: "leer" } }); },
      then(ok, nein) { return Promise.resolve(run()).then(ok, nein); },
    };
    return b;
  };
  return { T, lesen, db: { from } };
}
const berlinTag = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin" }).format(d);
const heute = berlinTag(new Date()), morgen = berlinTag(new Date(Date.now() + 86400000)), gestern = berlinTag(new Date(Date.now() - 86400000));
function welt({ notaus = false, status = null, inApp = [] } = {}) {
  const w = neueDb(), prot = [], push = [];
  const txt = (v, max) => String(v ?? "").trim().slice(0, max);
  const leute = new Map([["A", { person_id: "A", display_name: "Anne Muster", given_name: "Anne" }], ["B", { person_id: "B", display_name: "Bernd Beispiel", given_name: "Bernd" }]]);
  const f = baue(w.db, txt, berlinTag, async (ids) => new Map(status ? [[ids[0], status]] : []), async () => ({ aktiv: notaus, seit: null }), async (ids) => new Set(ids.filter((x) => inApp.includes(x))),
    async (ids) => new Map(ids.map((i) => [i, leute.get(i)])), (p) => (p ? p.given_name : ""), () => new Date().toISOString(), async () => new Set(),
    async (...a) => { push.push(a); return { ok: true }; }, "https://app.example", async (pid, aktion, d) => { prot.push([pid, aktion, d]); }, Error);
  return { ...w, ...f, prot, push };
}
const anne = { person_id: "A", vorname: "Anne", name: "Anne Muster" };
const setze = (x, wert) => x.T.kc_club_person_einstellung.push({ person_id: "B", schluessel: "autoantwort", wert });

{ // reine Regeln
  const { aaAktiv, aaText, aaWert, AA_VORLAGE } = welt();
  assert.equal(aaAktiv({ an: true }, null, "2026-11-23"), "schalter", "an ohne Zeitraum");
  assert.equal(aaAktiv({ an: false }, null, "2026-11-23"), "", "aus");
  assert.equal(aaAktiv({ an: true, von: "2026-11-24", bis: "2026-11-30" }, null, "2026-11-23"), "", "vor dem Zeitraum");
  assert.equal(aaAktiv({ an: true, von: "2026-11-24", bis: "2026-11-30" }, null, "2026-11-30"), "schalter", "letzter Tag zählt");
  assert.equal(aaAktiv({ an: true, bis: "2026-11-22" }, null, "2026-11-23"), "", "nach „bis“ gilt sie als aus");
  assert.equal(aaAktiv({ nachStatus: true }, { status: "urlaub", bis: null }, "2026-11-23"), "status", "Kopplung an Status");
  assert.equal(aaAktiv({ nachStatus: true }, { status: "beschaeftigt" }, "2026-11-23"), "", "beschäftigt koppelt nicht");
  assert.equal(aaAktiv({ nachStatus: true }, { status: "krank", bis: "2026-11-22" }, "2026-11-23"), "", "abgelaufener Status");
  assert.equal(aaAktiv({ nachStatus: false }, { status: "urlaub" }, "2026-11-23"), "", "ohne Kopplung kein Status");
  assert.equal(aaWert({ an: "ja", text: "x".repeat(900), von: "kaputt" }).an, false, "nur echtes true");
  assert.equal(aaWert({ text: "x".repeat(900) }).text.length, 500, "Text höchstens 500 Zeichen");
  assert.equal(aaWert({ von: "kaputt" }).von, null, "nur Datum");
  assert.equal(aaText("", "Anne", "Bernd"), AA_VORLAGE.replace("{vorname}", "Anne").replace("{meinname}", "Bernd"), "leerer Text → Vorlage mit Namen");
  assert.ok(AA_VORLAGE.startsWith("Liebe(r) {vorname}, danke für deine Nachricht.") && AA_VORLAGE.endsWith("Liebe Grüße {meinname}"), "Vorlage wie gewünscht");
  assert.equal(aaText("Hallo {vorname}, {vorname}! – {meinname}", "Anne", "Bernd"), "Hallo Anne, Anne! – Bernd", "alle Platzhalter ersetzt");
}
{ // Einzelchat, Kennzeichen, Push, Protokoll ohne Inhalt, keine Inhalte gelesen
  const x = welt(); setze(x, { an: true, text: "Bin weg, {vorname}. {meinname}" });
  const mid = await x.autoantwortAusloesen(anne, "T1", ["A", "B"], false);
  assert.ok(mid, "Autoantwort gesendet");
  const m = x.T.kc_communication_messages[0];
  assert.equal(m.sender_person_id, "B", "im Namen des Empfängers"); assert.equal(m.thread_id, "T1", "im selben Chat"); assert.equal(m.body, "Bin weg, Anne. Bernd");
  assert.deepEqual(x.T.kc_club_autoantwort.map((r) => [r.message_id, r.person_id, r.an_person_id]), [[mid, "B", "A"]], "Kennzeichen mit gleicher Kennung");
  assert.equal(x.push.length, 1, "Absender bekommt einen Push"); assert.deepEqual(x.push[0][2], ["push"], "nur Push, keine E-Mail");
  assert.deepEqual(x.prot, [["B", "autoantwort_gesendet", { thread: "T1" }]], "Protokoll nur mit Chat-Kennung");
  assert.ok(!JSON.stringify(x.prot).includes("Bin weg"), "kein Text im Protokoll");
  assert.deepEqual(x.lesen, [], "keine Nachrichten gelesen");
  // 12-Std.-Sperre
  assert.equal(await x.autoantwortAusloesen(anne, "T1", ["A", "B"], false), null, "zweite Nachricht in 12 Std. → nichts");
  assert.equal(x.T.kc_communication_messages.length, 1);
  x.T.kc_club_autoantwort_gesendet[0].am = new Date(Date.now() - 13 * 3600000).toISOString();
  assert.ok(await x.autoantwortAusloesen(anne, "T1", ["A", "B"], false), "nach 12 Std. wieder");
  assert.equal(x.T.kc_communication_messages.length, 2);
  // anderer Chat zählt getrennt
  assert.ok(await x.autoantwortAusloesen(anne, "T2", ["A", "B"], false), "anderer Chat: eigene Sperre");
}
{ // gleichzeitig: nur eine gewinnt
  const x = welt(); setze(x, { an: true });
  const r = await Promise.all([x.autoantwortAusloesen(anne, "T1", ["A", "B"], false), x.autoantwortAusloesen(anne, "T1", ["A", "B"], false)]);
  assert.equal(r.filter(Boolean).length, 1, "zwei Nachrichten gleichzeitig → eine Autoantwort");
}
{ // nur Einzelchat
  const x = welt(); setze(x, { an: true });
  assert.equal(await x.autoantwortAusloesen(anne, "T1", ["A", "B", "C"], false), null, "drei Teilnehmer → nichts");
  assert.equal(await x.autoantwortAusloesen(anne, "T1", ["A", "B"], true), null, "Gruppe mit zwei → nichts");
  assert.equal(await x.autoantwortAusloesen(anne, "T1", ["A"], false), null, "nur ich → nichts");
  assert.equal(x.T.kc_communication_messages.length, 0);
}
{ // aus / Zeitraum / Status / NOT-AUS / nur offline
  const aus = welt(); setze(aus, { an: false }); assert.equal(await aus.autoantwortAusloesen(anne, "T1", ["A", "B"], false), null, "aus");
  const vorbei = welt(); setze(vorbei, { an: true, bis: gestern }); assert.equal(await vorbei.autoantwortAusloesen(anne, "T1", ["A", "B"], false), null, "Zeitraum vorbei");
  const spaeter = welt(); setze(spaeter, { an: true, von: morgen }); assert.equal(await spaeter.autoantwortAusloesen(anne, "T1", ["A", "B"], false), null, "Zeitraum noch nicht");
  const drin = welt(); setze(drin, { an: true, von: heute, bis: morgen }); assert.ok(await drin.autoantwortAusloesen(anne, "T1", ["A", "B"], false), "im Zeitraum");
  const urlaub = welt({ status: { status: "urlaub", bis: null } }); setze(urlaub, { an: false, nachStatus: true }); assert.ok(await urlaub.autoantwortAusloesen(anne, "T1", ["A", "B"], false), "Status Urlaub");
  const da = welt({ status: { status: "verfuegbar" } }); setze(da, { an: false, nachStatus: true }); assert.equal(await da.autoantwortAusloesen(anne, "T1", ["A", "B"], false), null, "verfügbar → nichts");
  const na = welt({ notaus: true }); setze(na, { an: true }); assert.equal(await na.autoantwortAusloesen(anne, "T1", ["A", "B"], false), null, "NOT-AUS → nichts");
  assert.equal(na.T.kc_club_autoantwort_gesendet.length, 0, "NOT-AUS verbraucht die Sperre nicht");
  const on = welt({ inApp: ["B"] }); setze(on, { an: true, nurOffline: true }); assert.equal(await on.autoantwortAusloesen(anne, "T1", ["A", "B"], false), null, "nur offline: Empfänger ist in der App");
  const ap = welt({ inApp: ["A"] }); setze(ap, { an: true }); await ap.autoantwortAusloesen(anne, "T1", ["A", "B"], false);
  assert.equal(ap.push.length, 0, "Absender in der App → kein Push (kommt live)");
}
{ // keine Antwort auf eine Autoantwort: beide haben sie an – B antwortet automatisch, A's Autoantwort wird dadurch nicht ausgelöst
  const x = welt(); setze(x, { an: true }); x.T.kc_club_person_einstellung.push({ person_id: "A", schluessel: "autoantwort", wert: { an: true } });
  await x.autoantwortAusloesen(anne, "T1", ["A", "B"], false);
  assert.equal(x.T.kc_communication_messages.length, 1, "genau eine Nachricht – die Autoantwort ruft nichts weiter auf");
  const fnText = block.slice(block.indexOf("async function autoantwortAusloesen"));
  assert.ok(!/autoantwortAusloesen\(/.test(fnText.slice(30)) && !/aktionAusfuehren/.test(fnText), "kein Selbstaufruf, kein nachricht_senden");
}

// ---- App ----
assert.ok(/<h2>💬 Nachrichten<\/h2><button type="button" class="knopf klein aa-knopf" id="naAaKnopf"/.test(html), "🤖 in der Kopfzeile von Nachrichten");
assert.ok(html.includes('<div id="naAutoantwort" class="versteckt"></div>'), "Platz für den Balken");
assert.ok(/onclick="aaFenster\(\)">🤖 Autoantwort …<\/button>/.test(html), "Eintrag im Status-Fenster");
assert.ok(html.includes('id="setAaStand"'), "⚙️ Einstellungen");
assert.ok(/\.aa-knopf\.aa-an \{/.test(html) && /\.aa-marke \{/.test(html) && /\.aa-balken \{/.test(html), "Aussehen");
for (const f of ["function aaZeigen()", "function aaKnopfVerbinden(k)", "async function aaSchalten(an)", "function aaFenster()", "async function aaNachStatus(status)", "async function aaSpeichern(w, meldung)"]) assert.ok(app.includes(f), f);
assert.ok(/api\("autoantwort_speichern", \{ wert: w \}\)/.test(app), "speichert über den Club-Server");
assert.ok(/try \{ aaZeigen\(\); \} catch \{\} \/\/ KC-CLUB-AUTOANTWORT/.test(app), "Knopf/Balken mit dem NOT-AUS-Stand aktualisiert");
assert.ok(/aaNachStatus\(gewaehlt\)/.test(app) && /🤖 Autoantwort auch einschalten\?/.test(app), "Status-Frage");
assert.ok(/m\.autoantwort \? '<div class="aa-marke"[^']*>🤖 Autoantwort<\/div>'/.test(app), "Kennzeichen an der Sprechblase");
assert.ok(/AA_LANG_MS = 550/.test(app) && /addEventListener\("contextmenu"/.test(app.slice(app.indexOf("function aaKnopfVerbinden"))), "lange drücken → Fenster");
// gleiche Regel wie der Server
const appRegel = app.slice(app.indexOf("function aaGrund("), app.indexOf("const aaAbgelaufen"));
assert.ok(/w\.an && \(!w\.von \|\| w\.von <= heute\) && \(!w\.bis \|\| heute <= w\.bis\)/.test(appRegel) && /AA_STATUS\.includes\(s\.status\) && \(!s\.bis \|\| s\.bis >= heute\)/.test(appRegel), "App rechnet wie der Server");
assert.ok(lies("teile/hilfe.js").includes('{ id: "autoantwort", sym: "🤖"'), "Hilfe-Tipp");
// KC-CLUB-AUTOANTWORT-PULS (Wunsch Hansi 23.11.2026): an = rot und pulsierend, aus = grau; weniger Bewegung = rot ohne Animation
{
  const an = html.match(/#v-nachrichten \.kopf2 > \.aa-knopf\.aa-an \{[^}]*\}/)?.[0] || "";
  assert.ok(/border-color: #d32f2f/.test(an) && /outline: 2px solid #d32f2f/.test(an) && !/1e88e5/.test(an), "an = rot (nicht mehr blau)");
  assert.ok(/animation: aa-puls 1\.6s ease-in-out infinite/.test(an), "an = pulsiert sanft (1,6 s)");
  const kf = html.match(/@keyframes aa-puls \{[^\n]*/)?.[0] || "";
  assert.ok(/transform: scale\(1\.1\)/.test(kf) && /box-shadow/.test(kf) && !/(width|height|padding|margin)\s*:/.test(kf), "nur Größe/Leuchten – keine Layoutverschiebung");
  assert.ok(/@media \(prefers-reduced-motion: reduce\) \{ #v-nachrichten \.kopf2 > \.aa-knopf\.aa-an \{ animation: none; transform: none; \} \}/.test(html), "weniger Bewegung: rot ohne Animation");
  assert.ok(/#v-nachrichten \.kopf2 > \.aa-knopf \{[^}]*filter: grayscale\(1\); opacity: \.65;/.test(html), "aus = grau wie bisher");
  assert.ok(/k\.classList\.toggle\("aa-an", !!g\)/.test(app), "Klasse aa-an folgt dem Stand");
}
console.log("autoantwort: ok");
