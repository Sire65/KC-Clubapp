// KC-CLUB-GEMEINSCHAFTSGERICHT (Wunschliste #94, Antworten Hansi 15.11.2026: „Es gibt keinen festen Termin … jeder bekommt beim Start der App die Frage,
// welche Zutat … die Zutaten der anderen nicht sehen … oder jedem 2 Zutaten … nach Ende des Einsendezeitraums wird das Rezept erstellt in PDF … mit den
// Zutaten (in Klammern wer die Zutat gewählt hat) und den Zubereitungshinweisen“ – „Alle bekommen die Frage, alle das Rezept, ich muss die Zutaten vorher sehen“).
// Aufruf: node tests/gemeinschaftsgericht.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), server = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261115_kc_club_gemeinschaftsgericht.sql");

// 1. Datenbank: zwei Tabellen, nur der Club-Server, gespiegelt und gesichert
for (const t of ["kc_club_gericht_runde", "kc_club_gericht_zutat"]) {
  assert.ok(new RegExp(`alter table public\\.${t} enable row level security`).test(mig) && new RegExp(`revoke all on public\\.${t} from public, anon, authenticated`).test(mig), t + " geschützt");
  assert.ok(new RegExp(`grant select, insert, update, delete on public\\.${t} to service_role`).test(mig), t + " für den Server");
  assert.ok(new RegExp(`'${t}', 'Club-App', 'normal', false, true, true`).test(mig) && new RegExp(`\\('${t}'\\)`).test(mig), t + " gespiegelt und gesichert");
}
assert.ok(/je_person smallint not null default 1 check \(je_person between 1 and 2\)/.test(mig) && /unique \(runde_id, person_id, nr\)/.test(mig), "1 oder 2 Zutaten je Person, je Platz eine");

// 2. Server: wer darf was
const fall = (anf, ende) => { const i = server.indexOf(anf); assert.ok(i >= 0, anf); return server.slice(i, server.indexOf(ende, i)); };
const ein = fall('case "gericht_zutat_setzen": case "gericht_antwort": {', 'case "gericht_admin":');
assert.ok(/ich\.zugang !== "mitglied" && ich\.zugang !== "aushilfe"/.test(ein), "Mitglieder und Aushilfen, keine Gäste");
assert.ok(/r\.id !== String\(p\.runde \|\| ""\)\) throw new Fehler\("Die Einsendezeit ist vorbei/.test(ein), "nur während der Einsendezeit");
assert.ok(/liste\.length > r\.je_person/.test(ein) && /GERICHT_ZUTAT_RE\.test\(z\.zutat\)/.test(ein), "Anzahl und Zeichen geprüft");
assert.ok(/freigabe: z\.eigen \? \(gleich && war\.freigabe !== "abgelehnt" \? war\.freigabe : "pruefen"\) : "frei"/.test(ein), "eigene Zutaten erst nach Hansis Blick");
const adm = fall('case "gericht_admin": case "gericht_runde_speichern"', '// ----- Sitzungsprotokolle');
assert.ok(/if \(!ich\.admin\) throw new Fehler\("Nur für den Admin\.", 403\);/.test(adm), "Übersicht mit Namen nur für den Admin");
assert.ok(/name: leute\.get\(x\.person_id\)\?\.display_name/.test(adm), "Hansi sieht alle Zutaten mit Namen");
assert.ok(!/gericht_zutat"\)\.select\([^)]*\)\.eq\("runde_id", r\.id\)\.eq\("person_id", ich\.person_id\)[\s\S]{0,40}name/.test(ein), "Mitglieder bekommen nur ihre eigenen Zutaten zurück");
const fm = fall("async function gerichtFuerMich(", "async function gerichtEmpfaenger(");
assert.ok(/\.eq\("runde_id", r\.id\)\.eq\("person_id", ich\.person_id\)/.test(fm), "init: nur die eigenen Zutaten");
assert.ok(/sendenGewaehlt\("club_nachricht", ziel, \["push", "email"\]/.test(adm) && /attachmentIds: mAnl\.map/.test(adm), "Rezept an alle per Push und E-Mail mit PDF");
assert.ok(/startsWith\(`club\/\$\{ich\.person_id\}\/`\)/.test(adm), "nur das eigene, frisch erstellte PDF");
const emp = fall("async function gerichtEmpfaenger(", "// 2 Tage vor Ende");
assert.ok(/\.eq\("zugang", "gast"\)/.test(emp) && /!gast\.has\(id\)/.test(emp), "alle außer Gästen");
assert.ok(/gericht: await pGericht/.test(server) && /const pGericht = gerichtFuerMich\(ich\)\.catch/.test(server), "kommt mit dem App-Start (ein Fehler stört den Start nie)");
const er = fall("async function gerichtErinnerung()", "// 2.947.0 KC-CLUB-ADVENT-PREISE");
assert.ok(/tagDazu\(berlinTag\(new Date\(\)\), 2\)/.test(er) && /\.is\("erinnert_am", null\)\.select\("id"\)/.test(er), "2 Tage vor Ende, genau einmal");
assert.ok(/if \(stuendlich\) await gerichtErinnerung\(\)/.test(server), "stündlich in der Wartung");
for (const a of ["gericht_zutat_setzen", "gericht_antwort"]) assert.ok(new RegExp(`"schulung_antwort", "gericht_zutat_setzen", "gericht_antwort",`).test(server) && app.includes(`"schulung_antwort", "gericht_zutat_setzen", "gericht_antwort",`), a + ": Aushilfen dürfen (Server und App gleich)");

// 3. App: Frage beim Start, eigene Wahl, Kachel, Admin, PDF
assert.ok(/setTimeout\(\(\) => \{ try \{ grPruefen\(\); \} catch \{\} \}, 6500\);/.test(app), "Frage beim Start");
const pr = app.slice(app.indexOf("function grPruefen()"), app.indexOf("function grFrage("));
assert.ok(/g\.nein/.test(pr) && /g\.spaeterBis/.test(pr) && /meine\.some\(\(z\) => z\.freigabe === "abgelehnt"\)/.test(pr), "nicht bei „Diesmal nicht“/„Später“; wieder bei abgelehnter Zutat");
assert.ok(/grAntwort\('spaeter'\)/.test(app) && /grAntwort\('nein'\)/.test(app), "Später / Diesmal nicht");
assert.ok(/KACHELN\.verein\.push\(\{ id: "gericht"/.test(app) && /"ausweis", "gericht"\] \}/.test(app), "Kachel für alle (auch Aushilfen), solange eine Runde läuft");
assert.ok(/KACHELN\.admin\.unshift\(\{ id: "ad-gericht"/.test(app) && /gericht: \{ ablegen: [^}]*\}, bauen: \(\) => grDruck\(\) \}/.test(app), "Admin-Kachel und Druck auf dem Kopfbogen");

// 4. Wer hat welche Zutat? – Zuordnung im PDF
const zo = app.slice(app.indexOf("const grNorm ="), app.indexOf("async function grDruck()"));
const R = new Function(zo + "; return { grZuordnen };")();
const ein2 = [{ zutat: "Curry", vorname: "Anne" }, { zutat: "Hähnchen", vorname: "Thomas" }, { zutat: "Walnüsse", vorname: "Marianne" }, { zutat: "Stierhoden", vorname: "Hansi" }, { zutat: "Curry", vorname: "Leon" }, { zutat: "Zimt", vorname: "Ruth", freigabe: "abgelehnt" }];
const { zeilen, rest } = R.grZuordnen([{ n: "Hähnchenbrust" }, { n: "Curry" }, { n: "Kokosmilch" }, { n: "Walnüsse" }], ein2);
assert.deepEqual(zeilen.map((x) => x.wer), [["Thomas"], ["Anne", "Leon"], [], ["Marianne"]], "(Name) hinter der Zutat, auch mehrere");
assert.deepEqual(rest.map((x) => x.zutat), ["Stierhoden"], "nicht im Rezept: „Außerdem ausgesucht“; abgelehnte nie");
assert.ok(/\$\{x\.wer\.length \? ` <b style="color:#741521">\(\$\{esc\(x\.wer\.join\(", "\)\)\}\)<\/b>` : ""\}/.test(app), "Namen in Klammern im PDF");
// 5. Hansi 15.11.: „Ja, aber noch nicht freigegeben“ – Freigabe „🍲 Gemeinschaftsgericht“, Standard nur Admin (Test)
assert.ok(/gemeinschaftsgericht: \{ t: "🍲 Gemeinschaftsgericht", u: "[^"]+", standard: "admin" \}/.test(server), "Freigabe, Standard: nur Admin");
assert.ok(/if \(!ich\.admin && \(await freigaben\(\)\)\.gemeinschaftsgericht !== "alle"\) return null;/.test(fm), "nicht freigegeben → nur der Admin wird gefragt");
assert.ok(/await nurWennFrei\("gemeinschaftsgericht", ich, "Das Gemeinschaftsgericht"\);/.test(ein), "einreichen nur, wenn freigegeben (oder Admin)");
assert.ok(/if \(\(await freigaben\(\)\)\.gemeinschaftsgericht !== "alle"\) return; \/\/ Test: keine Erinnerung an alle/.test(er), "Test: keine Erinnerung");
assert.ok(/ziel = test \? \[ich\.person_id\] : alle/.test(adm) && /return json\(\{ ok: true, an: 1, test: true/.test(adm), "Test: Versand nur an den Admin, Runde bleibt offen");
assert.ok(/nur: \(\) => frei\("gemeinschaftsgericht"\) && !!INIT\?\.gericht\?\.runde/.test(app) && /nurTest\("gemeinschaftsgericht"\) \? "🔒 nur für dich \(Test\) · "/.test(app), "Kachel nur mit Freigabe, Test-Hinweis");
console.log("✅ gemeinschaftsgericht: alle Prüfungen bestanden");
