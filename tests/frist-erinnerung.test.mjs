// 2.883.0 KC-CLUB-FRIST-ERINNERUNG (Wunsch Hansi 07.11.2026: einen Tag vorher erinnern – Einspruchsfrist Protokoll, Abstimmung, Terminumfrage; Voreinstellung über ⚙️).
// Aufruf: node tests/frist-erinnerung.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), server = lies("supabase/functions/kc-club/index.ts"), html = lies("index.html");

// --- Regeln (aus dem Server, Typen entfernt) ---
const stueck = (anf, ende) => server.slice(server.indexOf(anf), server.indexOf(ende, server.indexOf(anf)));
const ohneTypen = (s) => s.replace(/\(w: any\): FristWahl/, "(w)").replace(/\(bis: string, jetzt0 = new Date\(\)\)/, "(bis, jetzt0 = new Date())").replace(/\(tag = \(d: Date\)/, "(tag = (d)").replace(/const tag = \(d: Date\)/, "const tag = (d)")
  .replace(/\(art: "protokoll" \| "abstimmung" \| "umfrage", stdRest: number, wahl: FristWahl, schon: boolean\)/, "(art, stdRest, wahl, schon)").replace(/^type FristWahl[^\n]*\n/m, "");
const code = ohneTypen(stueck("const FRIST_STANDARD = {", "async function fristErinnerung()"));
const TZ = "Europe/Berlin", berlinTag = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const R = new Function("berlinTag", code + "; return { FRIST_STANDARD, fristWahl, fristWann, fristFaellig };")(berlinTag);
assert.deepEqual(R.fristWahl(null), { push: true, email: false, tage: 1, protokoll: true, abstimmung: true, umfrage: true }, "Standard: 1 Tag vorher, Push, alle Arten");
assert.deepEqual(R.fristWahl({ push: false, email: true, tage: 9, umfrage: false }), { push: false, email: true, tage: 1, protokoll: true, abstimmung: true, umfrage: false }, "Grenzen 1–3 Tage");
assert.equal(R.fristWahl({ tage: 3 }).tage, 3);
const jetzt0 = new Date("2026-11-07T10:00:00Z");
assert.equal(R.fristWann("2026-11-08T17:00:00Z", jetzt0), "morgen");
assert.equal(R.fristWann("2026-11-07T20:00:00Z", jetzt0), "heute");
assert.equal(R.fristWann("2026-11-09T09:00:00Z", jetzt0), "übermorgen");
assert.equal(R.fristWann("2026-11-10T09:00:00Z", jetzt0), "in 3 Tagen");
const W = R.FRIST_STANDARD;
assert.ok(R.fristFaellig("protokoll", 23, W, false) && R.fristFaellig("protokoll", 27.5, W, false), "1 Tag vorher (bis 4 Std. früher, damit es nicht in die Nacht fällt)");
assert.ok(!R.fristFaellig("protokoll", 30, W, false), "zu früh");
assert.ok(!R.fristFaellig("protokoll", 1.5, W, false), "nicht mehr in den letzten 2 Std.");
assert.ok(!R.fristFaellig("protokoll", 20, W, true), "nie doppelt");
assert.ok(!R.fristFaellig("umfrage", 20, { ...W, umfrage: false }, false), "Art abgewählt");
assert.ok(!R.fristFaellig("abstimmung", 20, { ...W, push: false, email: false }, false), "ganz aus");
assert.ok(R.fristFaellig("abstimmung", 70, { ...W, tage: 3 }, false) && !R.fristFaellig("abstimmung", 70, W, false), "3 Tage vorher");

// --- Ablauf im Server ---
const f = stueck("async function fristErinnerung() {", "// KC-CLUB-WICHTIG-UNGELESEN");
assert.ok(f.includes("if (std < FRIST_VON_STD || std >= FRIST_BIS_STD) return;") && /const FRIST_MAX_TAGE = 3, FRIST_MIN_STD = 2, FRIST_VORLAUF_STD = 4, FRIST_VON_STD = 8, FRIST_BIS_STD = 21;/.test(server), "nur 8–21 Uhr");
assert.ok(f.includes('.eq("status", "veroeffentlicht").gt("einspruch_bis", von)') && f.includes('kc_club_sitzungsprotokoll_einwaende'), "Protokolle: Einspruchsfrist, nicht wer schon Einwand geschrieben hat");
assert.ok(f.includes("!unterstuetzbar(v.art)") && f.includes('v.paket?.id ? "paket:" + v.paket.id') && f.includes("!hat.has(id) && !probe.has(id)") && f.includes("(v0.ziel_ids ?? alle)"), "Abstimmungen: je Paket einmal, nur Berechtigte ohne Stimme, nicht in der Probephase");
assert.ok(f.includes("Möchtest du noch deine Stimme abgeben?") && f.includes("(Vorschlag von ${von})"), "Text wie gewünscht");
assert.ok(f.includes("kc_club_terminumfrage_antworten") && f.includes("Möchtest du noch angeben, wann du kannst?"), "Terminumfragen");
assert.ok(f.includes('await protokoll(null, "frist_erinnert", { s: f.s, art: f.art, p: ids }); // erst merken, dann senden'), "erst merken, dann senden (nur Kennungen)");
assert.ok(f.includes('sendenGewaehlt("club_erinnerung", gruppe, wege.split("+"), vars, `club-frist:${f.s}:${wege}`)'), "eigene Wege je Person (Ruhezeit, ohne App → Mail gelten weiter)");
assert.ok(f.includes("if (!(prs?.length || vs?.length || us?.length)) return;"), "sparsam: ohne Fristen nur drei kleine Abfragen");
assert.ok(server.includes("if (stuendlich) await fristErinnerung().catch("), "stündliche Wartung");
assert.ok(server.includes("  fristen: (w) => fristWahl(w),"), "Einstellung wird geprüft gespeichert");

// --- App: ⚙️ Einstellungen → Benachrichtigungen ---
for (const id of ["fristTage", "fristProtokoll", "fristAbstimmung", "fristUmfrage", "fristPush", "fristEmail", "fristHinweis"]) assert.ok(html.includes(`id="${id}"`), id);
assert.ok(app.includes('api("einstellung_setzen", { schluessel: "fristen", wert })') && app.includes("wahlZeigen(); fristZeigen();"), "speichern und anzeigen");
assert.ok(/const FRIST_STANDARD = \{ push: true, email: false, tage: 1, protokoll: true, abstimmung: true, umfrage: true \};/.test(app), "gleicher Standard wie der Server");
console.log("frist-erinnerung: ok");
