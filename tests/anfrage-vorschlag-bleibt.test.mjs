// KC-CLUB-ANFRAGE-VORSCHLAG-BLEIBT (22.11.2026, Wunsch Hansi): Gegenvorschlag bleibt als Hinweis sichtbar, auch nach Ja/Nein/Vielleicht.
// Aufruf: node tests/anfrage-vorschlag-bleibt.test.mjs (offline, Quelltext + reine Funktionen, ohne echte Daten)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), srv = lies("supabase/functions/kc-club/index.ts"), css = lies("index.html");
const mig = lies("supabase/migrations/20261122_kc_club_anfrage_vorschlag_bleibt.sql");

// Migration: nur Spalten ergänzen, nichts löschen/eintragen, keine neue Tabelle
for (const sp of ["vorschlag_alt_beginn timestamptz", "vorschlag_alt_ende timestamptz", "vorschlag_alt_am timestamptz", "vorschlag_alt_status text"])
  assert.match(mig, new RegExp("alter table public\\.kc_club_terminanfrage_empfaenger add column if not exists " + sp));
const migSql = mig.replace(/^--.*$/gm, "");
assert.doesNotMatch(migSql, /\bdelete\b|\bdrop\b|\bupdate\b|\binsert\b|create table|truncate/i, "nur Spalten ergänzen, keine Inhalte");

// Server: Helfer + defensives Schreiben (ohne Spalten weiter wie bisher)
assert.match(srv, /const vorschlagAlt = \(z: any\) => z\?\.vorschlag_alt_beginn \?/);
assert.match(srv, /function vorschlagAltWerte\(z: any, status: "angenommen" \| "abgelehnt" \| null\) \{\n\s+if \(!z\?\.vorschlag_beginn\) return null;/);
assert.match(srv, /vorschlag_alt_am: z\.geantwortet_am \?\? jetzt\(\)/, "Zeitpunkt des Vorschlags (geantwortet_am beim Vorschlag)");
const helfer = srv.slice(srv.indexOf("async function empfaengerAendern("), srv.indexOf("const ANTWORT_TEXT"));
assert.match(helfer, /if \(alt\) \{ const \{ error \} = await filter\(tab\(\)\.update\(\{ \.\.\.werte, \.\.\.alt \}\)\); if \(!error\) return; \}\n\s+await filter\(tab\(\)\.update\(werte\)\);/, "Fehler (fehlende Spalte) → ohne vorschlag_alt_* speichern");

const fall = (von, bis) => srv.slice(srv.indexOf(`case "${von}"`), srv.indexOf(`case "${bis}"`));
const antw = fall("terminanfrage_antwort", "terminanfrage_gelesen");
assert.match(antw, /vorschlag_beginn: null, vorschlag_ende: null \}, \/\/ Antwort ersetzt einen Gegenvorschlag\n\s+vorschlagAltWerte\(z, null\)/, "Antwort merkt den offenen Vorschlag als früheren");
assert.doesNotMatch(antw, /kc_club_terminanfrage_empfaenger"\)\.update/, "kein direktes Löschen mehr");
const gv = fall("terminanfrage_gegenvorschlag", "terminanfrage_vorschlag_entscheiden");
assert.match(gv, /VORSCHLAG_ALT_LEER/, "neuer offener Vorschlag löst den früheren ab");
const ent = fall("terminanfrage_vorschlag_entscheiden", "erinnerung_setzen");
assert.match(ent, /vorschlagAltWerte\(z, "angenommen"\)/);
assert.match(ent, /vorschlagAltWerte\(z, "abgelehnt"\)/);
assert.match(srv, /meinVorschlagAlt: vorschlagAlt\(mein\)/);
assert.match(srv, /vorschlag: z\.vorschlag_beginn \? \{[^}]+\} : null, vorschlagAlt: vorschlagAlt\(z\) \}/, "Empfängerliste (Sichtbarkeit wie die Antworten)");
assert.match(srv, /from\("kc_club_terminanfrage_empfaenger"\)\.select\("\*"\)\.in\("anfrage_id"/, "Liste liest mit * – vor der Migration einfach leer");

// Reine Funktionen des Servers nachgebaut ausführen
const jetzt = () => "JETZT";
const vorschlagAlt = eval(srv.match(/const vorschlagAlt = (\(z: any\) => [^\n]+);/)[1].replace(": any", ""));
const vAW = eval("(" + srv.match(/function vorschlagAltWerte\([\s\S]*?\n\}/)[0].replace(/: any|: "angenommen" \| "abgelehnt" \| null/g, "") + ")");
assert.equal(vAW({ vorschlag_beginn: null }, null), null);
const w = vAW({ vorschlag_beginn: "2026-11-23T15:30:00Z", vorschlag_ende: "2026-11-23T17:00:00Z", geantwortet_am: "2026-11-15T09:00:00Z" }, null);
assert.deepEqual(w, { vorschlag_alt_beginn: "2026-11-23T15:30:00Z", vorschlag_alt_ende: "2026-11-23T17:00:00Z", vorschlag_alt_am: "2026-11-15T09:00:00Z", vorschlag_alt_status: null });
assert.equal(vorschlagAlt({}), null);
assert.deepEqual(vorschlagAlt(w), { beginn: "2026-11-23T15:30:00Z", ende: "2026-11-23T17:00:00Z", am: "2026-11-15T09:00:00Z", status: null });

// App: Hinweis beim Empfänger (für alle, die die Antworten sehen) und bei mir; Annehmen-Knöpfe nur am offenen Vorschlag
assert.match(app, /\$\{e\.vorschlagAlt && !e\.vorschlag \? `<div class="hinweis ta-valt">\$\{esc\(taVAltText\(e\.vorschlagAlt\)\)\}<\/div>` : ""\}/);
assert.match(app, /a\.meinVorschlagAlt \? `<div class="hinweis ta-valt"[^`]*taVAltText\(a\.meinVorschlagAlt, true\)/);
assert.match(app, /\$\{a\.vonMir && !ab && e\.vorschlag \? `<div class="knoepfe ta-vk">/, "Annehmen nur bei offenem Vorschlag");
assert.match(css, /\.ta-valt \{/);
const TZ = "Europe/Berlin";
const fTag = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, weekday: "short", day: "2-digit", month: "2-digit" });
const fZeit = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const fKurz = new Intl.DateTimeFormat("de-DE", { timeZone: TZ, day: "2-digit", month: "2-digit" });
const taVAltText = eval(app.match(/const taVAltText = (\(v, du\) => `[^\n]+);/)[1]);
const v = { beginn: "2026-11-23T15:30:00Z", ende: "2026-11-23T17:00:00Z", am: "2026-11-15T09:00:00Z", status: null };
assert.equal(taVAltText(v), "🔄 hatte Mo., 23.11., 16:30–18:00 vorgeschlagen (15.11.)");
assert.equal(taVAltText({ ...v, status: "abgelehnt" }, true), "🔄 Du hattest Mo., 23.11., 16:30–18:00 vorgeschlagen (15.11.) · ❌ abgelehnt");
assert.equal(taVAltText({ beginn: v.beginn, ende: null, am: null, status: "angenommen" }), "🔄 hatte Mo., 23.11., 16:30 vorgeschlagen · ✅ angenommen");
console.log("anfrage-vorschlag-bleibt: alles grün");
