// KC-CLUB-ANFRAGE-GEGENVORSCHLAG (09.11.2026, Wunsch Hansi „Baue ein bei Terminanfrage ob Gegenvorschlag erlaubt ist“).
// Aufruf: node tests/anfrage-gegenvorschlag.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), srv = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261109_kc_club_terminanfrage_gegenvorschlag.sql");

// Migration: nur eine Spalte, Standard „erlaubt“ (bestehende Anfragen bleiben wie bisher)
assert.match(mig, /add column if not exists gegenvorschlag boolean not null default true/);
assert.doesNotMatch(mig, /\bdelete\b|drop |create table|update /i, "nur Spalte ergänzen");
assert.ok(fs.existsSync(new URL("../tools/db-test/112_terminanfrage_gegenvorschlag_test.sql", import.meta.url)), "Probelauf-Test vorhanden");

// Server: Senden übernimmt die Wahl (Spiel-Termine immer erlaubt), Gegenvorschlag wird abgelehnt, Liste liefert das Feld
const senden = srv.slice(srv.indexOf('case "terminanfrage_senden"'), srv.indexOf('case "terminanfragen_liste"'));
assert.match(senden, /const gegenvorschlag = spielId \? true : p\.gegenvorschlag !== false;/);
assert.match(senden, /if \(!gegenvorschlag\) werte\.gegenvorschlag = false;/, "Spalte nur mitschicken, wenn abgeschaltet");
assert.match(senden, /keine Gegenvorschläge möglich/, "E-Mail nennt die feste Zeit");
const gv = srv.slice(srv.indexOf('case "terminanfrage_gegenvorschlag"'), srv.indexOf('case "terminanfrage_vorschlag_entscheiden"'));
const sperre = gv.indexOf("a.gegenvorschlag === false"), schreiben = gv.indexOf('update({ antwort: null');
assert.ok(sperre > 0 && sperre < schreiben, "Sperre vor dem Speichern");
assert.match(srv, /gegenvorschlag: a\.gegenvorschlag !== false, vorbehalt:/);

// App: Häkchen (Standard an), wird mitgeschickt; Knopf nur bei erlaubtem Gegenvorschlag
assert.match(app, /<input type="checkbox" id="taGegenvorschlag" checked>/);
assert.match(app, /gegenvorschlag: \$\("taGegenvorschlag"\) \? \$\("taGegenvorschlag"\)\.checked : true/);
assert.match(app, /a\.spiel \? "" : a\.gegenvorschlag === false \? `[^`]*🔒 Gegenvorschläge sind bei dieser Anfrage nicht möglich/);
assert.match(app, /function taGegenvorschlag\(id\) \{\n[^\n]*\n\s+if \(a\.gegenvorschlag === false\) return melde/);
assert.match(app, /„🔄 Gegenvorschlag erlauben“<\/b> fest/, "Hilfe erklärt das Häkchen");
console.log("anfrage-gegenvorschlag: alles grün");
