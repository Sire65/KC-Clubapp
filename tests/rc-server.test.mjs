// KC-CLUB-RC-PRUEFUNG (20.10.2026): statische Prüfung der Server-Korrekturen aus der Release-Candidate-Prüfung (offline, ohne Server).
// Aufruf: node tests/rc-server.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";

const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const club = lies("supabase/functions/kc-club/index.ts"), termine = lies("supabase/functions/kc-termine/index.ts"), eltern = lies("supabase/functions/kc-eltern/index.ts");
// Text eines case-Zweigs (bis zum nächsten case)
const fall = (src, name) => { const a = src.indexOf(`case "${name}"`); assert.ok(a >= 0, `case ${name} fehlt`); const b = src.indexOf("\n      case \"", a + 10); return src.slice(a, b < 0 ? undefined : b); };
const fn = (src, name) => { const a = src.indexOf(`function ${name}(`); assert.ok(a >= 0, `Funktion ${name} fehlt`); const b = src.indexOf("\n}\n", a); return src.slice(a, b); };

// 1. Schreibfehler werden gemeldet (Freigaben, Notfall, Zusagen, Links)
assert.match(club, /function schreibOk<[^>]*>\(r: R, was = "Speichern"\): R \{ if \(r\?\.error\) throw new Fehler\(/, "schreibOk-Helfer fehlt");
for (const [name, n] of [["kontakt_freigabe", 1], ["geburtstag_freigabe", 1], ["runder_geburtstag_freigabe", 1], ["dienst_freigabe", 1], ["notfall_setzen", 2],
  ["treffen_antwort", 1], ["status_setzen", 1], ["kalender_abo", 1], ["eltern_entfernen", 1]])
  assert.ok((fall(club, name).match(/schreibOk\(await db\.from/g) || []).length >= n, `${name}: Schreiben ohne schreibOk`);
assert.match(fall(club, "treffen_antwort"), /if \(antwort === "keine"\) await db\.from\("kc_club_teilnahme"\)\.delete\(\)[^\n]*\.then\(\(r\) => schreibOk\(r, "Zurücknehmen"\)\)/, "treffen_antwort zurücknehmen: schreibOk fehlt");
assert.match(fall(club, "eltern_anlegen"), /schreibOk\(await db\.from\("kc_club_eltern"\)\.update\(\{ token_hash: hash/, "eltern_link_neu: schreibOk fehlt");
assert.match(fall(club, "aenderung_senden"), /if \(art\.id === "notfall"\) schreibOk\(await db\.from\("kc_club_notfall"\)/, "aenderung_senden Notfall: schreibOk fehlt");

// 2. Gesperrte Personen: weder Notbetrieb-Nachtrag noch geplante Nachrichten
assert.match(fn(club, "notEingangLauf"), /const gesperrt = ich\.admin \? null : await sperreFuer\(zg\.person_id\);\s*if \(gesperrt\) \{ await ablehnen\(/, "notEingangLauf: Sperre fehlt");
assert.match(fn(club, "geplantFaelligLauf"), /if \(!ich\.admin && await sperreFuer\(ich\.person_id\)\) throw new Fehler\(/, "geplantFaelligLauf: Sperre fehlt");

// 3. Zeitgrenzen
assert.match(fn(club, "notSigniert"), /fetch\([^;]*signal: AbortSignal\.timeout\(15000\)/, "notSigniert: Zeitgrenze fehlt");
assert.match(fn(club, "notpaketLauf"), /const r = await fetch\(ziel \+ pfad, \{ method: "POST", signal: AbortSignal\.timeout\(15000\)/, "notpaketLauf senden: Zeitgrenze fehlt");
assert.match(club, /kicc-program-heartbeat`, \{ method: "POST", signal: AbortSignal\.timeout\(10000\)/, "KICC-Heartbeat: Zeitgrenze fehlt");
assert.match(club, /new AwsClient\(\{[^}]*retries: 2 \}\)/, "AwsClient: retries fehlt");
assert.match(termine, /kc-communication-router`, \{\s*method: "POST", signal: AbortSignal\.timeout\(20000\)/, "kc-termine Router: Zeitgrenze fehlt");
assert.match(eltern, /sendNotification\([^)]*timeout: 10000 \}\)/, "kc-eltern web-push: Zeitgrenze fehlt");

// 4. Eingaben prüfen und begrenzen
assert.match(fall(club, "kalender"), /throw new Fehler\("Ungültiges Datum\."\)/, "kalender: Datumsprüfung fehlt");
assert.match(fall(club, "gruppe_aendern"), /Array\.isArray\(p\.weg\) \? p\.weg : \[\]\)\.slice\(0, 300\)/, "gruppe_aendern: weg nicht begrenzt");
assert.match(fall(club, "leihen_anfrage"), /p\.positionen\.slice\(0, 200\)/, "leihen_anfrage: Liste nicht begrenzt");
assert.match(fall(club, "dw_erinnern"), /p\.personen\.slice\(0, 200\)/, "dw_erinnern: personen nicht begrenzt");
assert.match(fall(club, "leihen_gegenstand"), /daten\.sort = Math\.max\(0, Math\.min\(32000, Math\.round\(Number\(p\.sort\)\)\)\)/, "leihen_gegenstand: sort nicht begrenzt");
assert.match(fall(club, "wl_status"), /neu\.reihenfolge = Math\.max\(-1e12, Math\.min\(1e12, Number\(p\.reihenfolge\)\)\)/, "wl_status: reihenfolge nicht begrenzt");
// Datumsprüfung wie im Server: 31.02. ist ungültig, 28.02. gültig
{ const tagEcht = (s) => { const t = Date.parse(s); return !isNaN(t) && new Date(t).toISOString().slice(0, 10) === s; };
  assert.equal(tagEcht("2026-02-31"), false); assert.equal(tagEcht("2026-13-01"), false); assert.equal(tagEcht("2026-02-28"), true); }

// 5. Deutsche Zeit statt UTC
assert.ok(!/T23:59:59Z/.test(fn(club, "protokollNaechsterVorschlag")), "protokollNaechsterVorschlag: noch UTC-Tagesende");
assert.match(fn(club, "protokollNaechsterVorschlag"), /berlinZuUtc\([^;]*23, 59\)/, "protokollNaechsterVorschlag: berlinZuUtc fehlt");
assert.ok(!/privatListe\(ich, new Date\(`\$\{heute\}T00:00:00Z`\)/.test(club), "countdowns: noch UTC-Mitternacht");
assert.match(fall(club, "countdowns"), /privatListe\(ich, berlinZuUtc\(/, "countdowns: berlinZuUtc fehlt");

// 6. Hintergrundarbeit mit waitUntil
assert.match(club, /function nebenbei\(p: Promise<unknown>\) \{ try \{ \(globalThis as any\)\.EdgeRuntime\?\.waitUntil\?\.\(p\); \} catch \{\} return p; \}/, "nebenbei-Helfer fehlt");
assert.match(club, /nebenbei\(einmalDateiWeg\(e\)\.catch/, "einmalDateiWeg ohne waitUntil");
assert.match(club, /nebenbei\(einmalAufraeumen\(e\)\.catch/, "einmalAufraeumen ohne waitUntil");
assert.ok(!/^\s*einmal(DateiWeg|Aufraeumen)\(e\)\.catch/m.test(club), "noch ein loses einmal…().catch");

// 7. Ich-Objekte mit zugang
assert.match(club, /vorname: "System",[^\n]*buero: null, zugang: "mitglied", nurLesen: true \}/, "System-Ich ohne zugang");
assert.match(fn(club, "kalenderIcs"), /buero: null, zugang: "mitglied" \} as Ich/, "Kalender-Ich ohne zugang");

// 8. kc-termine: Schlüssel in gleichbleibender Zeit vergleichen
assert.ok(!/\(await sha256\(key\)\) !== ks\.key_sha256/.test(termine), "kc-termine: Kalender-Schlüssel mit !==");
assert.ok(!/pruef === h/.test(termine) && !/z\.key_sha256 === h/.test(termine), "kc-termine: Schlüssel mit ===");
assert.match(termine, /gleichZeit\(await sha256\(key\), String\(ks\.key_sha256\)\)/);
assert.match(termine, /gleichZeit\(h, String\(pruef\)\)/);

// 9. tote Aktionen entfernt (aenderung_erledigt bleibt: tests/app-vertrag.test.mjs prüft seine Ablage „Erledigt“)
assert.ok(!/case "notbetrieb_info"/.test(club), "notbetrieb_info noch da");

// 10. Hochladen erst nach ALLEN Tests
for (const w of ["server-hochladen.yml", "eltern-hochladen.yml", "spiegel-arbeiter-hochladen.yml", "termine-hochladen.yml"]) {
  const y = lies(".github/workflows/" + w);
  assert.ok(y.includes('- run: for t in tests/*.test.mjs; do node "$t" || exit 1; done'), `${w}: läuft nicht mit allen Tests`);
  assert.ok(y.indexOf("tests/*.test.mjs") < y.indexOf("supabase/setup-cli"), `${w}: Tests nicht vor dem Hochladen`);
}

console.log("rc-server: alle Prüfungen grün");
