// KC-CLUB-MAIL-ZUSAGE (Wunsch Hansi 23.11.2026): Zusage/Absage zu einem Treffen per E-Mail-Link (antwort.html) – ohne App, ohne Anmeldung.
// Prüft: Link nur als Fingerabdruck gespeichert, Öffnen setzt nichts, abgelaufen/abgesagt → Fehler, Link-Erzeugung nur Admin, Seite ohne fremde Skripte.
// Aufruf: node tests/mail-zusage.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
const lies = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const server = lies("supabase/functions/kc-club/index.ts"), html = lies("app.js"), seite = lies("antwort.html");
const mig = lies("supabase/migrations/20261123_kc_club_mail_zusage.sql");
const zwischen = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i + 1); assert.ok(i >= 0 && j > i, `Abschnitt fehlt: ${a}`); return s.slice(i, j); };

// 1) Migration: Tabelle mit Fingerabdruck, Rechte nur für den Club-Server, gespiegelt und gesichert
assert.ok(/create table if not exists public\.kc_club_antwort_links \(/.test(mig), "Tabelle fehlt");
assert.ok(/token_hash text not null unique check \(token_hash ~ '\^\[0-9a-f\]\{64\}\$'\)/.test(mig), "token_hash: nur SHA-256 hex");
assert.ok(!/\btoken text\b|\bklartext\b\s+text|\blink text\b/i.test(mig.replace(/--[^\n]*/g, "")), "kein Klartext-Feld");
assert.ok(/treffen_id uuid not null references public\.kc_club_treffen\(id\) on delete cascade/.test(mig) && /person_id text not null references public\.kc_core_people\(person_id\)/.test(mig), "Bezüge");
assert.ok(/gueltig_bis timestamptz not null/.test(mig) && /antwort text check \(antwort in \('ja', 'nein', 'vielleicht'\)\)/.test(mig), "gültig bis / Antwort");
assert.ok(/alter table public\.kc_club_antwort_links enable row level security;/.test(mig), "RLS");
assert.ok(/revoke all on public\.kc_club_antwort_links from public, anon, authenticated;/.test(mig), "keine Rechte für anon/authenticated");
assert.ok(/grant select, insert, update, delete on public\.kc_club_antwort_links to service_role;/.test(mig), "Club-Server-Rechte");
assert.ok(/insert into public\.kc_db_mirror_table_rules[\s\S]*'kc_club_antwort_links'/.test(mig) && /insert into public\.kc_neon_resume_tables \(table_name\) values \('kc_club_antwort_links'\)/.test(mig), "Spiegel/Sicherung");

// 2) Öffentliche Aktionen VOR der Anmeldung; Link-Prüfung über den Fingerabdruck, Bremse, Gültigkeit
const vorAnm = server.slice(0, server.indexOf("const ich = await anmelden(req);"));
assert.ok(vorAnm.includes('if (a === "mail_antwort_laden") {') && vorAnm.includes('if (a === "mail_antwort_setzen") {'), "öffentliche Aktionen vor der Anmeldung");
const pr = zwischen(server, "async function maLinkPruefen(", "// ---------- Hauptprogramm ----------");
assert.ok(/if \(!maTokenOk\(t\)\) throw new Fehler/.test(pr) && pr.indexOf("maTokenOk(t)") < pr.indexOf("db.from("), "Format zuerst prüfen (keine Datenbank für Unsinn)");
assert.ok(/const netz = await maBremse\(req\);/.test(pr) && pr.indexOf("maBremse(req)") < pr.indexOf('from("kc_club_antwort_links")'), "Bremse vor der Suche");
assert.ok(/\.eq\("token_hash", await sha256\(t\)\)/.test(pr), "Suche nur über den Fingerabdruck");
assert.ok(/protokoll\(null, "mail_antwort_fehlversuch", \{ netz \}\)/.test(pr), "Fehlversuch wird gezählt");
assert.ok(/tr\.status !== "geplant" \? "Dieses Treffen wurde abgesagt\."/.test(pr), "abgesagt → nicht gültig");
assert.ok(/Date\.now\(\) > Math\.min\(Date\.parse\(l\.gueltig_bis\), ende\) \? "Dieser Link ist abgelaufen/.test(pr) && /MA_NACH_BEGINN_MS = 2 \* 3600000/.test(server), "abgelaufen (gültig bis / Beginn + 2 Std.) → nicht gültig");
const br = zwischen(server, "async function maBremse(", "async function maLinkPruefen(");
assert.ok(/fehlNetz \?\? 0\) >= MA_FEHL_NETZ \|\| \(fehlGesamt \?\? 0\) >= MA_FEHL_GESAMT\) throw new Fehler\([^)]*429\)/.test(br), "Bremse je Netz und insgesamt");
assert.ok(/crypto\.getRandomValues\(new Uint8Array\(32\)\)/.test(server) && /const maTokenOk = \(t: string\) => \/\^\[A-Za-z0-9_-\]\{43\}\$\/\.test\(t\);/.test(server), "32 Zufallsbyte base64url");

// Öffnen (laden) schreibt nichts – keine Antwort, kein upsert/update/insert/delete
const laden = zwischen(server, 'if (a === "mail_antwort_laden") {', 'if (a === "mail_antwort_setzen") {');
assert.ok(!/\.(upsert|update|insert|delete)\(/.test(laden) && !/protokoll\(/.test(laden), "Öffnen setzt nichts");
assert.ok(!/teilnahme"\)\.select\("[^"]*person_id/.test(laden) && /eq\("person_id", l\.person_id\)/.test(laden), "nur die eigene Antwort, keine anderen Teilnehmer");
assert.ok(/return json\(\{ ok: true, vorname: vorname\(pe\) \|\| "", titel: tr\.titel, beginn: tr\.beginn, ort: tr\.ort \?\? null, aktuelleAntwort: tn\?\.antwort \?\? null, gueltig,/.test(laden) && !/email/.test(laden), "nur das Nötigste, keine E-Mail");

// Setzen: nur gültig, nur ja/nein/vielleicht, gleiche Nebenwirkungen wie treffen_antwort, Protokoll ohne Inhalte
const setzen = zwischen(server, 'if (a === "mail_antwort_setzen") {', "const tAnm = Date.now();");
assert.ok(/if \(!MA_ANTWORTEN\.includes\(antwort\)\) throw new Fehler/.test(setzen) && /const MA_ANTWORTEN = \["ja", "nein", "vielleicht"\];/.test(server), "nur ja/nein/vielleicht");
assert.ok(/if \(!gueltig\) throw new Fehler\(grund, 409\);/.test(setzen) && setzen.indexOf("if (!gueltig)") < setzen.indexOf(".upsert("), "abgelaufen/abgesagt → Fehler vor dem Schreiben");
assert.ok(/from\("kc_club_teilnahme"\)\.upsert\(\{ treffen_id: tr\.id, person_id: l\.person_id, antwort, notiz, geaendert_am: jetzt\(\) \}\)/.test(setzen), "Antwort nur für die Person des Links");
assert.ok(/txt\(p\.notiz, 300\) \|\| alt\?\.notiz \|\| "per E-Mail-Link"/.test(setzen), "Vermerk „per E-Mail-Link“");
assert.ok(/kc_club_mitfahrt_suche"\)\.delete\(\)/.test(setzen) && /sitzungAntwortAbgleich\(tr\.id, l\.person_id, antwort\)/.test(setzen), "Mitfahrt-Suche und Sitzungs-Abgleich wie treffen_antwort");
assert.ok(/protokoll\(l\.person_id, "treffen_antwort", \{ treffen: tr\.id, antwort, weg: "mail_link" \}\)/.test(setzen), "Protokoll ohne Inhalte, weg mail_link");

// 3) Link-Erzeugung nur Admin, nur Fingerabdruck gespeichert, Links nie ins Protokoll
const ml = zwischen(server, 'case "mail_antwort_link": {', "// ----- KC-CLUB-TERMINANFRAGE (0.92.0) -----");
assert.ok(/^case "mail_antwort_link": \{\n\s+nurAdmin\(ich\);/.test(ml), "nur Admin – als Erstes");
assert.ok(/token_hash: await sha256\(x\.token\), person_id: x\.person_id, treffen_id: t\.id, erstellt_von: ich\.person_id, gueltig_bis: bis\.toISOString\(\)/.test(ml), "nur der Fingerabdruck wird gespeichert");
assert.ok(!/token: x\.token|token_hash: x\.token/.test(ml.slice(ml.indexOf(".insert("), ml.indexOf('"Link erzeugen"'))), "kein Klartext in der Tabelle");
assert.ok(/protokoll\(ich\.person_id, "mail_antwort_link", \{ treffen: t\.id, personen: ziel, senden, versand \}\)/.test(ml), "Protokoll ohne Links");
assert.ok(/new Date\(Date\.parse\(t\.beginn\) \+ MA_NACH_BEGINN_MS\)/.test(ml) && /t\.status !== "geplant"/.test(ml), "gültig bis Beginn + 2 Std., nur offene Treffen");
assert.ok(/maLink\(x\.token, "k"\)/.test(ml) && /db\.rpc\("kc_club_zugangslinks_schwaerzen"\)/.test(ml), "Mail-Link wird im Mail-Speicher geschwärzt (KC-CLUB-LINKSCHUTZ)");
assert.ok(/\$\{l\}&a=ja/.test(ml) && /\$\{l\}&a=nein/.test(ml), "Mail mit zwei Links");
assert.ok(/const nurAdmin = \(ich: Ich\) => \{ if \(!ich\.admin\) throw new Fehler\("Das darf nur der Admin\.", 403\); \};/.test(server), "nurAdmin prüft admin");
assert.ok(!/"mail_antwort_(link|laden|setzen)"/.test(zwischen(server, "const ZUGANG_AKTIONEN", "const ZUGANG_ERLAUBT")), "nicht für Gäste/Aushilfen freigegeben");

// 4) App: Knopf nur für den Admin
assert.ok(/\$\{ICH\?\.admin && offen && !va \? `<button class="knopf klein" onclick="zusageLinkMailen\('\$\{t\.id\}'\)">✉️ Zusage-Link mailen<\/button>` : ""\}/.test(html), "Knopf nur Admin");
assert.ok(/api\("mail_antwort_link", \{ treffen_id: id, person_ids: ids, senden: true \}\)/.test(html), "App ruft die Admin-Aktion");

// 5) Seite antwort.html: keine fremden Skripte, CSP-Fingerabdruck passt, Öffnen lädt nur, Antwort erst per Knopf
assert.ok(!/<script[^>]+src=/i.test(seite) && !/<link[^>]+stylesheet/i.test(seite), "keine fremden Skripte/Stile");
const skript = seite.match(/<script>([\s\S]*?)<\/script>/)[1];
const hash = createHash("sha256").update(skript).digest("base64");
assert.ok(seite.includes(`script-src 'sha256-${hash}'`), `CSP-Fingerabdruck passt nicht zum Skript (neu: sha256-${hash})`);
assert.ok(/default-src 'none'/.test(seite) && /connect-src https:\/\/ptblnpiroqftcvlsrhac\.supabase\.co;/.test(seite) && /<meta name="referrer" content="no-referrer">/.test(seite), "CSP und kein Referrer");
assert.ok(!/localStorage|sessionStorage|document\.cookie|indexedDB/.test(skript), "Link wird nirgends gespeichert");
const ld = zwischen(skript, "async function laden()", "laden();");
assert.ok(/api\("mail_antwort_laden"\)/.test(ld) && !/mail_antwort_setzen|setzen\(/.test(ld), "Öffnen lädt nur");
assert.ok((skript.match(/api\("mail_antwort_setzen"/g) || []).length === 2 && /b\.addEventListener\("click", \(\) => setzen\(b\.dataset\.a\)\)/.test(skript), "Antwort nur per Knopf");
assert.ok(!/VORWAHL\)\s*setzen|setzen\(VORWAHL\)/.test(skript), "Vorwahl (?a=) setzt nichts");
assert.ok(/Q\.get\("t"\) \|\| Q\.get\("k"\)/.test(skript), "Link aus ?t= oder ?k=");
assert.ok(/"antwort\.html"/.test(lies("tools/cloudflare/paket-bauen.mjs")), "Seite in der Positivliste des Cloudflare-Pakets");
const sw = lies("sw.js");
assert.ok(!sw.match(/const DATEIEN = \[[^\]]*\]/)[0].includes("antwort"), "nicht im Offline-Speicher");
console.log("mail-zusage: ok");
