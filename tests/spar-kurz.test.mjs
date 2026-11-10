// 2.907.0 KC-CLUB-SPAR-KURZ (Egress-Auswertung 10.11.2026, Hansi: „Ja alles sparsamer machen – trotzdem sicher und schnell, keine Geschwindigkeitseinbußen“).
// Mitgliederliste des KC Managers gekürzt (≈ 109 KB → 3 KB), Communicator-Ampel zählt in der Datenbank (≈ 70 KB → 0,1 KB). Aufruf: node tests/spar-kurz.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const server = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261110_kc_club_spar_kurz.sql");
const ohneKommentar = mig.replace(/--[^\n]*/g, "");

// 1. Migration: nur lesend, nur der Server, keine SECURITY DEFINER
assert.ok(/create or replace function public\.kc_club_manager_mitglieder_kurz\(p_org text\)/.test(mig) && /create or replace function public\.kc_club_comm_paket_kurz\(/.test(mig), "beide Funktionen");
assert.equal((ohneKommentar.match(/language sql stable/g) || []).length, 2, "beide nur lesend (stable)");
assert.ok(!/\b(insert|update|delete|security definer)\b/i.test(ohneKommentar), "nichts schreiben, kein security definer");
assert.equal((mig.match(/from public, anon, authenticated;/g) || []).length, 2, "kein Aufruf von außen");
assert.equal((mig.match(/to service_role;/g) || []).length, 2, "nur der Club-Server");
for (const f of ["id", "firstName", "lastName", "preferredName", "phone", "joinedAt", "exitDate"]) assert.ok(mig.includes(`'${f}', m.e->'${f}'`), "Feld " + f);
assert.ok(!/claims|skills/.test(ohneKommentar), "die großen Felder bleiben in der Datenbank");
assert.ok(/order by m\.i/.test(mig), "gleiche Reihenfolge wie im KC Manager");
assert.ok(/order by created_at desc limit 500/.test(mig), "gleiche 500 Aufträge wie bisher");

// 2. Server: überall die kurze Liste, mit Rückfall auf das volle Lesen
assert.equal((server.match(/managerMitglieder\(\)/g) || []).length, 6, "5 Lesestellen + Definition");
assert.equal((server.match(/eq\("section_key", AKTIONEN_QUELLE\.mitglieder\)/g) || []).length, 1, "volles Lesen nur noch als Rückfall");
const mm = server.slice(server.indexOf("async function managerMitglieder()"), server.indexOf("async function aktionenLesen("));
assert.ok(/catch \{ \/\* Rückfall unten \*\/ \}/.test(mm) && /return await db\.from\(AKTIONEN_QUELLE\.tabelle\)\.select\("payload"\)/.test(mm), "Rückfall");
assert.ok(/"kc_club_manager_mitglieder_kurz", "kc_club_comm_paket_kurz"\]\);/.test(server), "nur lesend → Puffer bleibt (Notfall-Paket)");
const pk = server.slice(server.indexOf("async function commLesenPaket("), server.indexOf("function commZahlenNorm("));
assert.ok(pk.indexOf('rpc("kc_club_comm_paket_kurz"') < pk.indexOf('rpc("kc_club_comm_paket"'), "erst kurz, dann bisheriges Paket");
assert.ok(/if \(!pk\) return commLesenEinzeln\(seit7, seit24\);/.test(server), "dann einzeln");

// 3. Gleiches Ergebnis: Zahlen aus der Liste (bisher) = Zahlen aus der Datenbank (neu)
const stueck = (anf, ende) => server.slice(server.indexOf(anf), server.indexOf(ende, server.indexOf(anf)));
const typlos = (t) => t.replace(/\((\w+): any\)/g, "($1)").replace(/\(z: any\)/g, "(z)").replace(/: Record<string, number>/g, "").replace(/\(liste: any\[\], seit24: string\)/, "(liste, seit24)");
const kopf = stueck("const COMM_OK =", "const COMM_EMPFAENGER_FEHLER") , emp = stueck("const COMM_EMPFAENGER_FEHLER", "\n");
const R = new Function(typlos(kopf + emp + "\n" + stueck("function commZahlenNorm(", "function commLesenEinzeln(")) + "; return { commZahlen, commZahlenNorm, COMM_OK, COMM_FEHLER };")();
const jetzt = Date.parse("2026-11-10T12:00:00Z"), iso = (h) => new Date(jetzt - h * 3600000).toISOString().replace("Z", "+00:00");
const liste = [
  { status: "displayed", created_at: iso(1), sent_at: iso(0.9), error_code: null },
  { status: "failed", created_at: iso(2), sent_at: null, error_code: "PUSH_NO_ACTIVE_SUBSCRIPTION" },
  { status: "queued", created_at: iso(3), sent_at: null, error_code: null },
  { status: "failed", created_at: iso(30), sent_at: null, error_code: "SMTP_DOWN" },
  { status: "sent", created_at: iso(40), sent_at: iso(39), error_code: null },
];
const seit24 = new Date(jetzt - 86400000).toISOString();
const a = R.commZahlen(liste, seit24);
assert.deepEqual(a.status, { displayed: 1, failed: 2, queued: 1, sent: 1 });
assert.deepEqual(a.f24, [{ status: "failed", error_code: "PUSH_NO_ACTIVE_SUBSCRIPTION" }], "nur die letzten 24 Std.");
assert.equal(a.letzte, iso(0.9), "zuletzt gesendet = neuester erfolgreicher");
// so liefert es die Datenbank (Schlüssel in anderer Reihenfolge) → gleich nach dem Ordnen
const b = R.commZahlenNorm({ status: { sent: 1, queued: "1", failed: 2, displayed: 1 }, f24: [{ status: "failed", error_code: "PUSH_NO_ACTIVE_SUBSCRIPTION" }], letzte: iso(0.9) });
assert.deepEqual(b, a, "Datenbank-Zahlen = bisherige Rechnung");
assert.deepEqual(R.commZahlen([], seit24), { status: {}, f24: [], letzte: null });

// 4. Ampel rechnet weiter dasselbe (Zähler aus den Zahlen)
const cs = stueck("async function communicatorStatus", "const kanal = ");
assert.ok(/const zahl = \(arr: string\[\]\) => arr\.reduce\(\(n, s\) => n \+ \(Number\(z\.status\?\.\[s\]\) \|\| 0\), 0\);/.test(cs), "Anzahl je Statusgruppe");
assert.ok(/fehler24: f24\.filter\(\(x: any\) => commSystemFehler\(x\)\)\.length/.test(cs) && /ohneWeg24: f24\.filter\(\(x: any\) => !commSystemFehler\(x\)\)\.length/.test(cs), "System- und Empfängerfehler getrennt");
// 5. Notfall-Paket: keine „Runde → feste Gruppe“-Prüfung (lud die Teilnehmer aller Chats je Chat); in der App unverändert
assert.ok(/if \(!gr && \(tn \?\? \[\]\)\.length >= 3 && !ich\.nurLesen\) \{/.test(server), "Runden-Prüfung nicht im Notfall-Paket");
assert.ok(/const ich: Ich = \{ \.\.\.ichAus\(p0, ro \?\? null\), nurLesen: true \};/.test(server), "Notfall-Paket baut mit nurLesen");
console.log("✅ spar-kurz: alle Prüfungen bestanden");
