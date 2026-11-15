// 2.947.0 KC-CLUB-ADVENT-PREISE (Wunschliste #89, Antworten Hansi 15.11.2026): 6.12. Mini-Schoko-Nikolaus, 20.12. ein Kinderriegel – jede/r, die/der das
// Türchen öffnet, bekommt ihn. „🎁 Ja, den nehme ich“ → Hansis Liste „Wer bekommt was“ (ansehen + drucken, Austeilen beim Weihnachtsessen im Januar).
// Aufruf: node tests/advent-preise.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const js = programmText(), srv = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261115_kc_club_advent_preise.sql");

// App und Server kennen dieselben Preis-Tage
const block = js.slice(js.indexOf("const AK_NASCH = ["), js.indexOf("const AK_REIHE"));
const { AK_TUERCHEN, AK_PREISE } = new Function(block + "; return { AK_TUERCHEN, AK_PREISE };")();
const srvPreise = Function("return " + srv.match(/const ADVENT_PREISE: Record<number, string> = (\{[^}]*\});/)[1])();
const appPreise = Object.fromEntries(AK_TUERCHEN.map((T, i) => [i + 1, T]).filter(([, T]) => T.art === "riegel").map(([n, T]) => [n, AK_PREISE[T.preis].name]));
assert.deepEqual(appPreise, srvPreise, "Preis-Tage in App und Server gleich");
assert.deepEqual(srvPreise, { 6: "Mini-Schoko-Nikolaus", 20: "Kinderriegel" }, "6.12. Schoko-Nikolaus, 20.12. Kinderriegel");

// Server: nur Mitglieder, nur ab dem Tag im Dezember, doppelt melden geht nicht, Liste nur für den Admin
const fall = srv.slice(srv.indexOf('case "advent_preis_melden"'), srv.indexOf('case "rezept_bewerten"'));
assert.ok(/ich\.zugang !== "mitglied"/.test(fall), "nur Mitglieder");
assert.ok(/if \(!ich\.admin\) throw new Fehler\("Nur für den Admin\.", 403\)/.test(fall), "Liste nur Admin");
assert.ok(/heute\.slice\(5, 7\) !== "12" \|\| Number\(heute\.slice\(8, 10\)\) < tag/.test(fall), "erst ab dem Tag im Dezember");
assert.ok(/onConflict: "person_id,jahr,tag", ignoreDuplicates: true/.test(fall), "nur einmal je Person und Tag");
assert.ok(/eq\("person_id", ich\.person_id\)/.test(fall), "eigene Meldungen nur für mich");

// Datenbank: RLS, keine Client-Rechte, Spiegel + Sicherung
assert.ok(/primary key \(person_id, jahr, tag\)/.test(mig) && /enable row level security/.test(mig) && /revoke all on public\.kc_club_advent_preise from public, anon, authenticated/.test(mig), "Tabelle geschützt");
assert.ok(/kc_db_mirror_table_rules[\s\S]*'kc_club_advent_preise'[\s\S]*true, true/.test(mig) && /kc_neon_resume_tables/.test(mig), "gespiegelt und gesichert");

// App: Knopf, Liste nur für den Admin, Druck über den Druck-Baustein mit Club-Kopf (Regel 19)
assert.ok(/🎁 Ja, den nehme ich/.test(js) && /api\("advent_preis_melden", \{ tag: n \}/.test(js), "Knopf meldet den Preis");
assert.ok(/\$\{ICH\?\.admin \? `<button type="button" class="knopf ak-fach" onclick="akPreisListe\(\)">📋 Wer bekommt was<\/button>` : ""\}/.test(js), "Liste nur für den Admin sichtbar");
assert.ok(/advent_preise: \{ bauen: \(\) => AK_GEMELDET\.druck && \{ titel:/.test(js) && /druckStarten\("advent_preise"\)/.test(js), "Druck mit Club-Kopf und -Fuß");
assert.ok(/akPreisBlatt: "📋 Adventskalender – wer bekommt was"/.test(js), "Fenstername");
console.log("advent-preise: alle Prüfungen bestanden");
