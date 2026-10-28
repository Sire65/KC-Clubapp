// KC-CLUB-REZEPT-WEIHNACHT (2.729.0, 28.10.2026, Wunschliste #45): Weihnachtsbäckerei im Rezeptbuch – Saison, Sterne, „nachgebacken“,
// Thema nur durch den Admin, Hinweis im Info-Laufband nur mit Freigabe. Aufruf: node tests/rezept-weihnacht.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { REZEPT_THEMEN, REZEPT_STERNE_AB, rzThemaSaison, rzBewertungen, rzBewertungPruefen } from "../supabase/functions/kc-club/rezepte.js";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");

// Saison: 1. November bis 26. Dezember (beide Tage eingeschlossen), unbekanntes Thema nie
assert.ok(REZEPT_THEMEN.weihnachtsbaeckerei);
assert.ok(!rzThemaSaison("weihnachtsbaeckerei", "2026-10-31"));
assert.ok(rzThemaSaison("weihnachtsbaeckerei", "2026-11-01"));
assert.ok(rzThemaSaison("weihnachtsbaeckerei", "2026-12-26"));
assert.ok(!rzThemaSaison("weihnachtsbaeckerei", "2026-12-27"));
assert.ok(!rzThemaSaison("weihnachtsbaeckerei", "2027-01-05"));
assert.ok(!rzThemaSaison("ostern", "2026-11-15"));

// Sterne: Schnitt erst ab 3 Stimmen, eine Nachkommastelle; „nachgebacken“ zählt auch ohne Sterne; meine Bewertung
assert.equal(REZEPT_STERNE_AB, 3);
const z = [
  { rezept_id: "a", person_id: "P1", sterne: 5, nachgebacken: true },
  { rezept_id: "a", person_id: "P2", sterne: 4, nachgebacken: false },
  { rezept_id: "b", person_id: "P1", sterne: 2, nachgebacken: false },
  { rezept_id: "b", person_id: "P3", sterne: null, nachgebacken: true },
];
let bw = rzBewertungen(z, "P1");
assert.deepEqual(bw("a"), { sterne: null, stimmen: 2, nachgebacken: 1, meine: { sterne: 5, nachgebacken: true } }, "2 Stimmen → noch kein Schnitt");
assert.deepEqual(bw("b"), { sterne: null, stimmen: 1, nachgebacken: 1, meine: { sterne: 2, nachgebacken: false } });
assert.deepEqual(bw("x"), { sterne: null, stimmen: 0, nachgebacken: 0, meine: null }, "ohne Bewertung");
bw = rzBewertungen([...z, { rezept_id: "a", person_id: "P4", sterne: 4, nachgebacken: true }], "P9");
assert.deepEqual(bw("a"), { sterne: 4.3, stimmen: 3, nachgebacken: 2, meine: null }, "ab 3 Stimmen: (5+4+4)/3 = 4,3");
assert.equal(rzBewertungen([{ rezept_id: "a", person_id: "P1", sterne: 9 }], "P1")("a").stimmen, 0, "ungültige Sterne zählen nicht");

// Bewertung prüfen: 1–5 oder keine; eigenes Rezept nur „nachgebacken“, keine Sterne
assert.equal(rzBewertungPruefen(null, false), null);
assert.equal(rzBewertungPruefen(null, true), null, "nachgebacken beim eigenen Rezept geht");
assert.equal(rzBewertungPruefen(5, false), null);
assert.match(rzBewertungPruefen(0, false), /1 bis 5/);
assert.match(rzBewertungPruefen(6, false), /1 bis 5/);
assert.match(rzBewertungPruefen(3, true), /eigene Rezept/);

// Migration: Thema-Spalte, Bewertungstabelle mit RLS, Rechten nur für den Club-Server, gespiegelt und gesichert
const mig = lies("supabase/migrations/20261028_kc_club_v2729_rezept_thema_sterne.sql");
assert.match(mig, /add column if not exists thema text check \(thema is null or thema in \('weihnachtsbaeckerei'\)\)/);
assert.match(mig, /primary key \(rezept_id, person_id\)/, "eine Bewertung je Mitglied und Rezept");
assert.match(mig, /sterne between 1 and 5/);
assert.match(mig, /revoke all on public\.kc_club_rezept_bewertung from public, anon, authenticated/);
assert.match(mig, /kc_db_mirror_table_rules[\s\S]*'kc_club_rezept_bewertung'/);
assert.match(mig, /kc_neon_resume_tables[\s\S]*'kc_club_rezept_bewertung'/);
assert.match(mig, /Rückweg:/);

// Server: alles hinter der Freigabe „rezepte“; Thema nur durch den Admin; Laufband-Lage gemerkt statt je Start abgefragt
const srv = lies("supabase/functions/kc-club/index.ts");
const fall = (n) => srv.slice(srv.indexOf(`case "${n}": {`), srv.indexOf("case ", srv.indexOf(`case "${n}": {`) + 10));
assert.match(fall("rezept_bewerten"), /await nurWennFrei\("rezepte", ich, "Das Rezeptbuch"\)/);
assert.match(fall("rezept_bewerten"), /onConflict: "rezept_id,person_id"/);
assert.match(fall("rezept_speichern"), /if \(ich\.admin && "thema" in p\)/, "Thema setzt nur der Admin");
assert.match(fall("rezepte_liste"), /if \(error\) \(\{ data \} = await db\.from\("kc_club_rezepte"\)\.select\(felder\)/, "ohne eingespielte Migration läuft das Rezeptbuch wie bisher");
const lage = srv.slice(srv.indexOf("async function rzThemaLage"), srv.indexOf("let RZ_REDAKTION"));
assert.match(lage, /if \(!ich\.admin && \(await freigaben\(\)\)\.rezepte !== "alle"\) return null/, "Laufband-Hinweis nur mit Freigabe");
assert.match(lage, /RZ_LAGE\.bis = Date\.now\(\) \+ 600000/, "10 Min. gemerkt");
assert.match(srv, /rezeptThema: await pRzThema/);

// App: Laufband „Weihnachtsbäckerei?“ öffnet das Thema; Mitglieder sehen es nur mit Rezepten; Kacheln/Liste; Sterne; zwei Wege beim Aufruf
const app = programmText();
const il = app.slice(app.indexOf("2.729.0 KC-CLUB-REZEPT-WEIHNACHT (Wunschliste #45): in der Adventszeit"), app.indexOf("for (const lt of (INIT?.laufbandTermine"));
assert.match(il, /rt && \(rt\.anzahl > 0 \|\| ICH\?\.admin\)/);
assert.match(il, /t: "Weihnachtsbäckerei\?"/);
assert.match(il, /rzStart\('\$\{esc\(rt\.thema\)\}'\)/);
assert.match(app, /const RZ_THEMEN = \{ weihnachtsbaeckerei: \{ sym: "🎄", t: "Weihnachtsbäckerei"/);
assert.match(app, /Hast du auch ein leckeres Rezept\? Her damit!/);
assert.match(app, /function rzAnHansi\(th\)[\s\S]{0,400}await direkt\(red\.id\)/);
assert.match(app, /\.\.\.\(ICH\?\.admin && \(F\.thema \|\| F\.themaVorher\) \? \{ thema: F\.thema \|\| null \} : \{\}\)/, "Mitglieder schicken kein Thema mit, der Admin nur wenn eins gesetzt ist oder war");
assert.match(app, /api\("rezept_bewerten", \{ id, sterne, nachgebacken \}/);
assert.match(app, /rzAnsicht\(\) === "kacheln"/);
assert.match(lies("index.html"), /body\.einfach \.rz-kacheln \{ grid-template-columns: 1fr; \}/, "einfache Ansicht: Kacheln untereinander");

assert.ok(lies(".github/workflows/tests.yml").includes("node tests/rezept-weihnacht.test.mjs"), "läuft in der CI");
console.log("rezept-weihnacht: ok");
