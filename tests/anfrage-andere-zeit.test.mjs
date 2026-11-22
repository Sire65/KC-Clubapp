// KC-CLUB-ANFRAGE-ANDERE-ZEIT (22.11.2026, Wunsch Hansi): „🕐 Ja, aber zu anderer Zeit“ – Zusage mit eigener Zeit (später kommen / früher gehen).
// Aufruf: node tests/anfrage-andere-zeit.test.mjs (offline, Quelltext + reine Funktionen, nur ausgedachte Daten)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), srv = lies("supabase/functions/kc-club/index.ts"), css = lies("index.html");
const mig = lies("supabase/migrations/20261122_kc_club_anfrage_andere_zeit.sql");

// Migration: nur zwei Spalten ergänzen, nichts löschen/eintragen
assert.match(mig, /alter table public\.kc_club_terminanfrage_empfaenger add column if not exists zeit_beginn timestamptz;/);
assert.match(mig, /alter table public\.kc_club_terminanfrage_empfaenger add column if not exists zeit_ende timestamptz;/);
assert.doesNotMatch(mig.replace(/^--.*$/gm, ""), /\bdelete\b|\bdrop\b|\bupdate\b|\binsert\b|create table|truncate/i, "nur Spalten ergänzen");

// Server: Liste liefert die Zeit (über select("*") – vor der Migration einfach leer)
assert.match(srv, /const andereZeit = \(z: any\) => z\?\.zeit_beginn \? \{ beginn: z\.zeit_beginn, ende: z\.zeit_ende \?\? null \} : null;/);
assert.match(srv, /meineZeit: andereZeit\(mein\)/);
assert.match(srv, /vorschlagAlt: vorschlagAlt\(z\), zeit: andereZeit\(z\) \}/);
// Fund nebenbei: gegenvorschlag/vorbehalt/anlagen standen seit 2.942.0 im Kommentar
assert.match(srv, /\n\s+gegenvorschlag: a\.gegenvorschlag !== false, vorbehalt: a\.vorbehalt \?\? null, anlagen: anl\.get\(a\.id\) \?\? \[\],/);
assert.doesNotMatch(srv, /verschickt ist gegenvorschlag:/);

// Speichern defensiv: erst mit zeit_*, sonst ohne – bei echter „anderer Zeit“ klare Meldung statt stiller Zusage
const hz = srv.slice(srv.indexOf("async function empfaengerMitZeit("), srv.indexOf("const ANTWORT_TEXT"));
assert.match(hz, /if \(pflicht\) throw new Fehler\(ZEIT_FEHLT, 503\)/);
assert.match(hz, /await empfaengerAendern\(werte, alt, filter\); return false;/);
const fall = (von, bis) => srv.slice(srv.indexOf(`case "${von}"`), srv.indexOf(`case "${bis}"`));
const antw = fall("terminanfrage_antwort", "terminanfrage_gelesen");
assert.match(antw, /const mitZeit = antwort === "ja" && !!p\.zeit_beginn;/);
assert.match(antw, /const zeit = mitZeit \? andereZeitPruefen\(a, p\.zeit_beginn, p\.zeit_ende\) : ZEIT_LEER;/, "jede andere Antwort löscht zeit_*");
assert.match(antw, /\(q\) => q\.eq\("anfrage_id", a\.id\)\.eq\("person_id", ich\.person_id\), zeit, mitZeit\)/);
assert.match(antw, /if \(mitZeit && a\.spiel_id\) throw/);
assert.match(antw, /kommt \$\{zText\}/, "Benachrichtigung nennt die Zeit");
assert.match(fall("terminanfrage_gegenvorschlag", "terminanfrage_vorschlag_entscheiden"), /await empfaengerMitZeit\(\{ antwort: null/, "Gegenvorschlag löscht andere Zeit");
assert.match(fall("terminanfrage_vorschlag_entscheiden", "erinnerung_setzen"), /await empfaengerMitZeit\(\{ antwort: null, notiz: null[^\n]+\n\s+\(q\) => q\.eq\("anfrage_id", a\.id\)\.neq\("person_id", z\.person_id\)\)/, "neue Zeit → alle neu fragen, andere Zeit weg");
// Erinnerungen lesen * (zeit_beginn fehlt vor der Migration) und nennen die eigene Zeit
assert.ok((srv.match(/from\("kc_club_terminanfrage_empfaenger"\)\.select\("\*"\)\.eq\("anfrage_id", x\.id\); \/\/ \* – zeit_beginn/g) || []).length === 2, "Kurz- und Vortag-Erinnerung");
assert.match(srv, /const ab = new Date\(ez\?\.antwort === "ja" && ez\?\.zeit_beginn \? ez\.zeit_beginn : x\.beginn\)\.getTime\(\);/, "eigene Erinnerung zur eigenen Zeit");
assert.match(srv, /\.\.\.andereZeitIcs\(x\)\);/, "Kalender-Abo mit eigener Zeit");

// Reine Funktionen des Servers nachgebaut ausführen
const TZ = "Europe/Berlin";
const fZeit = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const berlinTag = (d) => new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
class Fehler extends Error {}
const ts = (t) => t.replace(/: \{ beginn: string; ende\?: string \| null \} \| null/g, "").replace(/: (any|unknown)/g, "");
const andereZeit = eval(srv.match(/const andereZeit = (\(z: any\) => [^\n]+);/)[1].replace(": any", ""));
const andereZeitText = eval("(" + ts(srv.match(/function andereZeitText\([\s\S]*?\n\}/)[0]) + ")");
const pruefen = eval("(" + ts(srv.match(/function andereZeitPruefen\([\s\S]*?\n\}/)[0]) + ")");
const A = { beginn: "2026-11-23T13:30:00Z", ende: "2026-11-23T17:00:00Z" }; // Mo. 23.11. 14:30–18:00 (ausgedacht)
assert.deepEqual(pruefen(A, "2026-11-23T15:30:00Z", "2026-11-23T17:00:00Z"), { zeit_beginn: "2026-11-23T15:30:00.000Z", zeit_ende: "2026-11-23T17:00:00.000Z" });
assert.deepEqual(pruefen(A, "2026-11-23T16:00:00Z", null), { zeit_beginn: "2026-11-23T16:00:00.000Z", zeit_ende: null });
assert.throws(() => pruefen(A, "2026-11-23T17:00:00Z", "2026-11-23T16:00:00Z"), /nach „Von“/);
assert.throws(() => pruefen(A, "2026-11-24T15:00:00Z", null), /Tag des Termins/);
assert.throws(() => pruefen(A, "", null), /ab wann/);
assert.equal(andereZeitText(andereZeit({ zeit_beginn: "2026-11-23T15:30:00Z", zeit_ende: "2026-11-23T17:00:00Z" })), "16:30–18:00 Uhr");
assert.equal(andereZeitText(andereZeit({ zeit_beginn: "2026-11-23T16:00:00Z" })), "ab 17:00 Uhr");
assert.equal(andereZeit({ antwort: "ja" }), null);

// App: Knopf, Blatt, Anzeige in Anfrage und Terminplan; Gegenvorschlag klar getrennt beschriftet
assert.match(app, /onclick="taAndereZeit\('\$\{a\.id\}'\)">🕐 Ja, aber zu anderer Zeit<\/button>/);
assert.match(app, /api\("terminanfrage_antwort", \{ id, antwort: "ja", notiz: [^}]+zeit_beginn: beginn\.toISOString\(\), zeit_ende: ende \? ende\.toISOString\(\) : null \}\)/);
assert.match(app, /if \(e\.antwort === "ja"\) return \{ k: "ja", sym: "✅", t: e\.zeit \? "bestätigt · 🕐 " \+ taZeitText\(e\.zeit\) : "bestätigt" \};/, "zählt als Zusage");
assert.match(app, /t: "schlägt anderen Termin vor: " \+ taVWann\(e\.vorschlag\)/);
assert.match(app, /"Anderen Vorschlag machen" : "Anderen Termin vorschlagen"/);
assert.match(app, /x\.x\.meineZeit \? " · 🕐 du kommst "/, "Terminplan: meine Zeit");
assert.match(app, /<small class="ta-az">\$\{esc\(taAndereZeitZeile\(x\.x\)\)\}<\/small>/, "Terminplan: Zeile „🕐 andere Zeit“");
assert.match(app, /const gleich = \(w\) => a\.meine === w && !\(w === "ja" && a\.meineZeit\);/, "„Ja“ bei anderer Zeit = normal zusagen");
assert.match(css, /\.ta-az \{/);
const taZeitText = eval(app.match(/const taZeitText = (\(z\) => [^\n]+);/)[1]);
const taAndereZeitListe = eval(app.match(/const taAndereZeitListe = (\(a\) => [^\n]+);/)[1]);
const taAndereZeitZeile = eval(app.match(/const taAndereZeitZeile = (\(a\) => \{[\s\S]*?\};)\n/)[1].replace(/;$/, ""));
const anf = { empfaenger: [
  { name: "Fritz Beispiel", vorname: "Fritz", antwort: "ja", zeit: { beginn: "2026-11-23T15:30:00Z", ende: "2026-11-23T17:00:00Z" } },
  { name: "Carla Probe", vorname: "Carla", antwort: "ja", zeit: { beginn: "2026-11-23T16:00:00Z", ende: null } },
  { name: "Otto Test", vorname: "Otto", antwort: "ja", zeit: null },
  { name: "Nina Muster", vorname: "Nina", antwort: "nein", zeit: null } ] };
assert.equal(taZeitText(anf.empfaenger[0].zeit), "16:30–18:00 Uhr");
assert.equal(taAndereZeitZeile(anf), "🕐 andere Zeit: Fritz 16:30–18:00, Carla ab 17:00");
assert.equal(taAndereZeitListe(anf).length, 2);
assert.equal(taAndereZeitZeile({ empfaenger: [] }), "");
console.log("anfrage-andere-zeit: alles grün");
