// KC-CLUB-NUTZUNG-PERSON (Wunsch Hansi 07./08.11.2026): Nutzungsstatistik je Person – „📊 Meine Nutzung“ (Meins) und „📊 Nutzung je Mitglied“ (Technik, Admin).
// Aufruf: node tests/nutzung-person.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), teil = lies("teile/nutzperson.js"), server = lies("supabase/functions/kc-club/index.ts"), html = lies("index.html"), sw = lies("sw.js");
const mig = lies("supabase/migrations/20261108_kc_club_nutzung_person.sql");

// --- Datenbank: eigene Tabelle, nur Zahlen, Rechte nur für den Club-Server, Verdichtung nach 1 Jahr ---
assert.ok(/create table if not exists public\.kc_club_nutzung_person \(/.test(mig) && /primary key \(person_id, tag, monat\)/.test(mig), "eine Zeile je Person und Tag (bzw. Monat)");
assert.ok(/enable row level security/.test(mig) && /revoke all on public\.kc_club_nutzung_person from public, anon, authenticated;/.test(mig) && /grant select, insert, update, delete on public\.kc_club_nutzung_person to service_role;/.test(mig), "Rechte (KC-SUPABASE-GRANTS)");
for (const f of ["kc_club_nutzung_person_dazu(text, date, integer, integer, jsonb, jsonb, text)", "kc_club_nutzung_person_verdichten()", "kc_club_nutzung_bericht(date, date, text[], boolean)"])
  assert.ok(mig.includes(`revoke all on function public.${f} from public, anon, authenticated;`) && mig.includes(`grant execute on function public.${f} to service_role;`), "Funktion nur für den Club-Server: " + f);
assert.ok(/insert into public\.kc_db_mirror_table_rules/.test(mig) && /insert into public\.kc_neon_resume_tables/.test(mig), "gespiegelt und gesichert");
const bericht = mig.slice(mig.indexOf("create or replace function public.kc_club_nutzung_bericht"));
assert.ok(!/\bbody\b|\btext\b(?!\[\])/.test(bericht.replace(/p_personen text\[\]|'fehler\\_%'|::text/g, "")), "Bericht liest nie Nachrichtentext (KC-CHATS-PRIVAT)");
assert.ok(/m\.sender_person_id = any\(p_personen\)/.test(bericht) && /mime_type like 'audio\/%'/.test(bericht), "Nachrichten nur gezählt (Absender, Zeit, Gruppe, Anlage-Art)");
assert.ok(/substr\(pr\.aktion, 8\) <> all \(array\['alte_version'/.test(bericht), "nur echte Fehler (ohne Info-Meldungen)");
assert.ok(/tag < current_date - 365/.test(mig), "nach 1 Jahr nur noch Monate");

// --- Server ---
const mA = server.indexOf('case "nutzung_melden": {'), melden = server.slice(mA, server.indexOf("// KC-CLUB-NUTZUNG-PERSONEN (2.6.0)", mA));
assert.ok(melden.includes('await nutzungPersonMerken(ich, req, paare, sp, p.zeit).catch('), "Zeiten und Bereiche je Person mit der vorhandenen Meldung (kein neuer Aufruf)");
const merk = server.slice(server.indexOf("async function nutzungPersonMerken("), server.indexOf("function npZeitraum("));
assert.ok(merk.includes('if (ich.zugang !== "mitglied" || ich.nurLesen || ich.vertreter || ich.person_id.startsWith("KC-P-TEST")) return;'), "nur Mitglieder, keine Vertretung/Testkonten");
assert.ok(merk.includes("Math.min(86400") && merk.includes(".slice(0, 4)") && merk.includes('!b.startsWith("hs_")'), "Grenzen");
const np = server.slice(server.indexOf('case "nutzung_person": {'), server.indexOf('case "nutzung_melden": {'));
assert.ok(np.includes('if (ich.zugang !== "mitglied") throw') && np.includes("if (p.alle === true) {\n          nurAdmin(ich);") && np.includes("if (pid !== ich.person_id) nurAdmin(ich);"), "eigene Zahlen für jeden, fremde und alle nur für den Admin");
assert.ok(/const NP_TAGE_MAX = 366;/.test(server) && server.includes("vorVon: tagDazu(von, -tage), vorBis: tagDazu(von, -1)"), "Zeitraum bis 1 Jahr, Vergleich mit dem Zeitraum davor");
assert.ok(server.includes('if (stuendlich && berlinStunde(new Date()) === 3) { const { error } = await db.rpc("kc_club_nutzung_person_verdichten");'), "nächtliche Verdichtung");
// Geräteart aus der Browser-Kennung
const g = /const npGeraet = \(ua: string\) => ([^\n]+);/.exec(server); assert.ok(g);
const npGeraet = new Function("ua", "return " + g[1].replace(/;$/, ""));
assert.equal(npGeraet("Mozilla/5.0 (Linux; Android 14; Pixel 8) Mobile Safari"), "handy");
assert.equal(npGeraet("Mozilla/5.0 (Linux; Android 13; SM-X200) Safari"), "tablet");
assert.equal(npGeraet("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)"), "handy");
assert.equal(npGeraet("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"), "pc");

// --- App: Zeitmessung ---
const mess = app.slice(app.indexOf("const NP_SICHT_MAX"), app.indexOf("setInterval(nzSenden, sparTakt(NZ_TAKT_MS));"));
assert.ok(/const NP_SICHT_MAX = 6 \* 3600, NP_WEG_MAX = 12 \* 3600, NP_SPEICHER = "kc_club_np_zeit";/.test(mess), "Grenzen je Stück");
assert.ok(app.indexOf("if (document.hidden) { if (NP.sichtAb) npBuchen(0, NP.sichtAb, j, NP_SICHT_MAX);") < app.indexOf('document.addEventListener("visibilitychange", () => { if (document.hidden) nzSenden(); });'), "Zeit wird vor der Meldung beim Weglegen gebucht");
assert.ok(mess.includes("const zeit = Object.keys(zeitAlle).length && (weg || mitAnderem) ? zeitAlle : null;"), "im Takt nur mitschicken, wenn ohnehin etwas geht (kein zusätzlicher Aufruf)");
assert.ok(mess.includes("if (zeit) { const zz = npZeitLesen(); for (const [t, w] of Object.entries(zeit)) npZeitDazu("), "bei Fehlschlag nichts verloren");
const dazu = new Function(/function npZeitDazu\(z, tag, s, h\) \{([^\n]+)\}/.exec(mess)[0] + "; return npZeitDazu;")();
const z = {}; dazu(z, "2026-11-01", 1, 0); dazu(z, "2026-11-02", 2, 0); dazu(z, "2026-11-03", 3, 0); dazu(z, "2026-11-04", 4, 0); dazu(z, "2026-11-05", 5, 6); dazu(z, "2026-11-05", 1, 1);
assert.deepEqual(Object.keys(z), ["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05"], "höchstens 4 Tage");
assert.deepEqual(z["2026-11-05"], [6, 7], "aufaddiert");

// --- App: Ansicht ---
assert.ok(/nutzperson: \{ einstieg: \["npStart", "npAlle"\], sri: "sha384-/.test(app) && /nutzperson: "[A-Za-z0-9_-]{16}"/.test(sw), "Teil mit Fingerabdruck und im Offline-Speicher");
assert.ok(/\{ id: "meine_nutzung", sym: "📊", t: "Meine Nutzung",[^\n]*aktion: "npStart\(\)"/.test(app), "Kachel unter Meins");
assert.ok(/\{ id: "nutzung_person", sym: "📊", t: "Nutzung je Mitglied",[^\n]*aktion: "npAlle\(\)", nur: \(\) => !!ICH\?\.admin \}/.test(app), "Kachel unter Technik nur für den Admin");
assert.ok(/id: "meine_nutzung", thema: "privat"/.test(app) && /npBlatt: "📊 Nutzungsstatistik"/.test(app), "Hilfe und Fenstername");
assert.ok(teil.includes('const NP_HINWEIS = "Für die Statistik werden bestimmte Sachen aufgezeichnet:') && teil.includes('(fremd ? "" : `<p class="hinweis np-hinweis">ℹ️ ${esc(NP_HINWEIS)}</p>`)'), "Hinweis in „Meine Nutzung“ (Wunsch Hansi)");
for (const f of ["npBlickHtml", "npZeitHtml", "npNachrichtenHtml", "npTermineHtml", "npBereicheHtml", "npRasterHtml", "npTechnikHtml", "npAlleZeichnen"]) assert.ok(teil.includes(`function ${f}(`), f);
for (const k of ["np-filter", "np-anteil", "np-ring", "np-person"]) assert.ok(html.includes(`.${k} `), "Gestaltung " + k);
// Rechenhilfen der Ansicht
const gruppen = teil.slice(teil.indexOf("function npGruppen("), teil.indexOf("function npZeitHtml("));
const hilf = new Function("heuteIso", teil.slice(teil.indexOf("const NPS ="), teil.indexOf("function npFilterHtml(")) + gruppen + "; NPS.wahl = '7'; return { npDauer, npGruppen, npZeitraum, NPS, npPfeil };");
const H = hilf(() => "2026-11-08");
assert.equal(H.npDauer(45), "45 Sek."); assert.equal(H.npDauer(600), "10 Min."); assert.equal(H.npDauer(3 * 3600 + 5 * 60), "3 Std. 5 Min.");
assert.deepEqual(H.npZeitraum(), ["2026-11-02", "2026-11-08"]);
H.NPS.wahl = "jahr"; assert.deepEqual(H.npZeitraum(), ["2026-01-01", "2026-11-08"]);
H.NPS.wahl = "eigen"; H.NPS.von = "2026-11-05"; H.NPS.bis = "2026-11-01"; assert.deepEqual(H.npZeitraum(), ["2026-11-01", "2026-11-05"], "vertauschte Tage");
const tage = Array.from({ length: 70 }, (_, i) => ({ t: new Date(Date.UTC(2026, 8, 1 + i)).toISOString().slice(0, 10), s: 60, h: 0, m: 1, st: 1 }));
const w = H.npGruppen(tage); assert.ok(w.length <= 11 && w.reduce((a, x) => a + x.m, 0) === 70, "ab 63 Tagen Wochen");
assert.equal(H.npGruppen(tage.slice(0, 7)).length, 7, "sonst Tage");
assert.equal(H.npPfeil(10, 0), "", "ohne Vergleich kein Pfeil");
console.log("nutzung-person: ok");
