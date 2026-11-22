// KC-NOTAUS (21.11.2026, Wunsch Hansi „roter Notfall-Knopf wie an Maschinen – sofort Nachrichten und E-Mails stoppen“): Migration, Club-Server, Eltern-Push,
// App (Pilzknopf 1,5 s halten, Balken, gesperrtes Schreibfeld, Entriegeln mit drei Wegen). Quelltext-Prüfungen + reine Funktionen, offline.
// Aufruf: node tests/notaus.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), html = lies("index.html"), server = lies("supabase/functions/kc-club/index.ts"), eltern = lies("supabase/functions/kc-eltern/index.ts");
const termine = lies("supabase/functions/kc-termine/index.ts");
const mig = lies("supabase/migrations/20261121_kc_notaus.sql").replace(/--[^\n]*/g, "");
const fn = (name) => { const i = mig.indexOf(`function public.${name}(`); assert.ok(i > 0, name); return mig.slice(i, mig.indexOf("$$;", i)); };

// ---- Migration ----
for (const s of ["notaus_seit timestamptz", "notaus_von text", "notaus_quelle text"])
  assert.ok(mig.includes(`alter table public.kc_communication_settings add column if not exists ${s}`), "Spalte " + s);
assert.ok(!/create table/i.test(mig), "keine neue Tabelle");
assert.ok(!/\bmetadata\b/.test(mig), "die JSON-Spalte heißt audit_meta (metadata gibt es nicht)");
const aus = fn("kc_notaus_ausloesen"), ent = fn("kc_notaus_entriegeln"), st = fn("kc_notaus_stand");
for (const [n, f] of [["ausloesen", aus], ["entriegeln", ent], ["stand", st]]) {
  assert.ok(/security definer\s+set search_path = public/.test(f), n + ": security definer + search_path");
  assert.ok(new RegExp(`revoke all on function public\\.kc_notaus_${n}\\([^)]*\\) from public, anon, authenticated;`).test(mig), n + ": revoke");
  assert.ok(new RegExp(`grant execute on function public\\.kc_notaus_${n}\\([^)]*\\) to service_role;`).test(mig), n + ": nur service_role");
}
// Probe: nur zählen, kein UPDATE vor dem return
const probeTeil = aus.slice(aus.indexOf("if coalesce(p_probe, false) then"), aus.indexOf("end if;"));
assert.ok(probeTeil.includes("return jsonb_build_object") && !/\bupdate\b/i.test(probeTeil), "Probe ändert nichts");
assert.ok(/set dispatch_enabled = false,\s*notaus_seit = coalesce\(notaus_seit, now\(\)\)/.test(aus), "Schalter aus, Zeit bleibt bei erneutem Auslösen");
assert.ok(/where status in \('queued', 'retry_scheduled', 'pending', 'routed'\)/.test(aus) && !/'processing'/.test(aus), "nur wartende Aufträge – processing nie");
assert.ok(/set status = 'angehalten',\s*audit_meta = coalesce\(audit_meta, '\{\}'::jsonb\) \|\| jsonb_build_object\('notaus_vorher', status, 'notaus_am', now\(\)/.test(aus), "alter Status gemerkt");
assert.equal((aus.match(/update public\.kc_communication_requests/g) || []).length, 1, "ein UPDATE für die Aufträge (schnell)");
assert.ok(/p_aktion not in \('senden', 'verwerfen', 'behalten'\)/.test(ent), "nur drei Wege");
assert.ok(/set dispatch_enabled = true, notaus_seit = null, notaus_von = null, notaus_quelle = null/.test(ent), "entriegeln setzt zurück");
assert.ok(/set status = 'queued', scheduled_for = now\(\), locked_at = null, next_attempt_at = null/.test(ent), "senden → Warteschlange jetzt");
assert.ok(/set status = 'verworfen'/.test(ent) && /'notaus_verworfen_am', now\(\)/.test(ent), "verwerfen");
assert.ok(!/\b(variables|recipient_refs|body|subject)\b/.test(st), "Stand ohne Inhalte/Empfänger");
assert.ok(/'nach_kanal'/.test(st) && /'angehalten'/.test(st), "Stand: Anzahl + je Kanal");
assert.ok(fs.existsSync(new URL("../tools/db-test/117_notaus_test.sql", import.meta.url)) && lies("tools/db-test/117_erwartet.txt").includes("processing_bleibt=t"), "DB-Test");

// ---- Club-Server ----
for (const a of ["notaus_ausloesen", "notaus_entriegeln", "notaus_stand"]) {
  const i = server.indexOf(`case "${a}": {`); assert.ok(i > 0, a);
  assert.ok(server.slice(i, i + 200).includes("nurAdmin(ich);"), a + " nur Admin");
}
assert.ok(server.includes('db.rpc("kc_notaus_ausloesen", { p_von: ich.person_id, p_quelle: "club", p_probe: probe })'), "ruft die RPC");
assert.ok(server.includes('case "notaus_info": return json(await notausLesen());'), "Kurzstand für alle aus dem Merker");
const sperrt = new Function(server.match(/const NOTAUS_SPERRT = (new Set\(\[[^\]]*\]\));/)[0].replace("const NOTAUS_SPERRT =", "return"))();
for (const a of ["nachricht_senden", "geplant_jetzt", "geplant_abrufen", "startnachricht_senden", "anruf_antwort"]) assert.ok(sperrt.has(a), "gesperrt: " + a);
assert.ok(/siZaehlen\(a, ich\);[^\n]*\n\s*if \(NOTAUS_SPERRT\.has\(a\)\) await notausSperre\(\);/.test(server), "Sperre vor jeder Aktion – auch für den Admin");
assert.ok(server.includes('throw new Fehler(NOTAUS_TEXT, 423, { notaus: true, seit: n.seit })'), "423 mit Kennung");
assert.ok(/const NOTAUS_MERK_MS = 5000;/.test(server), "DB-sparsam gemerkt");
assert.ok((server.match(/notausVergessen\(\);/g) || []).length >= 3, "eigenes Auslösen/Entriegeln verwirft den Merker");
assert.ok(/\.\.\.\(notaus\.aktiv \? \{ notaus \} : \{\}\)/.test(server), "init: nur wenn aktiv");
assert.ok(/if \(notausAngehalten\(r\.status, out\)\) \{ notausVergessen\(\); return \{ sent: 0, failed: 0,/.test(server), "Router-Antwort angehalten ≠ Fehler");
assert.ok(/async function geplantFaelligLauf\(\) \{\n[^\n]*\n\s*if \(\(await notausLesen\(\)\)\.aktiv\)/.test(server), "geplante Nachrichten warten");
const angehalten = new Function(server.match(/function notausAngehalten\(status: number, out: any\): boolean \{[\s\S]*?\n\}/)[0].replace(": number", "").replace(": any): boolean", ")") + "; return notausAngehalten;")();
assert.equal(angehalten(423, {}), true); assert.equal(angehalten(202, { ok: true, angehalten: true }), true); assert.equal(angehalten(500, { code: "DISPATCH_DISABLED" }), true);
assert.equal(angehalten(200, { ok: true, sent: 1 }), false); assert.equal(angehalten(502, { error: "x" }), false);
// Protokoll ohne Inhalte
for (const m of server.matchAll(/protokoll\(ich\.person_id, [^;]*notaus[^;]*;/g)) assert.ok(!/text|body|empf/i.test(m[0]), "Protokoll ohne Inhalt: " + m[0]);
// Eltern-Push und Termine
assert.ok(/async function senden\([^)]*\) \{\n\s*if \(await notausAktiv\(\)\) return \{ gesendet: 0, fehler: 0, angehalten: true/.test(eltern), "Eltern-Push hält an");
assert.ok(termine.includes('out?.code === "DISPATCH_DISABLED"'), "Termine: angehalten statt Fehler");

// ---- App ----
assert.ok(html.includes('<div id="naNotaus" class="versteckt"') && html.includes('<div id="chatNotaus" class="versteckt"'), "Platz im Nachrichten-Modul und im Chat");
assert.ok(/\.notaus-knopf \{[^}]*conic-gradient\(#111 calc\(var\(--fuell\) \* 1turn\), #ffd400 0\)/.test(html), "gelber Ring füllt sich");
assert.ok(/radial-gradient\(circle at 35% 30%, #ff6b6b, #d00000/.test(html), "roter Pilz");
assert.ok(/const NOTAUS_HALTEN_MS = 1500/.test(app), "1,5 s halten");
assert.ok(/const admin = !!ICH\?\.admin;/.test(app) && /const knopf = admin && !NOTAUS\.aktiv \?/.test(app), "Knopf nur für Admin");
assert.ok(app.includes("melde(`⛔ NOT-AUS ausgelöst – ${Number(r?.angehalten) || 0} angehalten`)"), "Meldung nach dem Auslösen");
assert.ok(/⛔ NOT-AUS seit \$\{esc\(notausUhr\(NOTAUS\.seit\)\)\} – Nachrichten sind angehalten/.test(app), "Balken für alle");
for (const t of ["📤 Alle jetzt senden", "🗑️ Alle verwerfen", "⏸️ Angehalten lassen (später)"]) assert.ok(app.includes(t), t);
assert.ok(/if \(r\.status === 423 && j\?\.notaus\)/.test(app) && /if \(e\?\.notaus\) return melde\(t\);/.test(app), "423 → freundliche Meldung");
assert.ok(/k\.disabled = laedt \|\| !!globalThis\.NOTAUS\?\.aktiv;/.test(app) && /t\.disabled = NOTAUS\.aktiv;/.test(app), "Schreibfeld/➤ gesperrt");
assert.ok(/id: "notaus", thema: "nachrichten"/.test(app), "Hilfe-Tipp");
const uhr = new Function(app.match(/const notausUhr = [^\n]*/)[0].replace("const notausUhr =", "return"))();
assert.equal(uhr("2026-11-21T13:03:00Z"), "14:03", "Winterzeit Berlin");

// ---- KC-NOTAUS-OBEN (22.11.2026, Wunsch Hansi „eine ganze Zeile verschwendet“): Knopf oben in der Kopfzeile links neben 🚨 SOS, keine eigene Zeile ----
const kopf = html.match(/<section id="v-nachrichten"[\s\S]*?<div class="kopf2">([\s\S]*?)<\/div>/)[1];
assert.ok(/<h2>💬 Nachrichten<\/h2><span id="naNotausPlatz" class="notaus-platz"><\/span>(<!--[^>]*-->)?<button class="knopf klein alarm-knopf" id="naSosKnopf"/.test(kopf), "Platz in der Kopfzeile direkt links neben SOS");
assert.ok(!/notaus-zeile|notaus-hinweis/.test(app + html), "keine eigene NOT-AUS-Zeile mehr (auch kein CSS dafür)");
assert.ok(/const pl = \$\("naNotausPlatz"\);/.test(app) && /pl\.innerHTML = knopf;/.test(app) && /na\.innerHTML = balken;/.test(app), "Knopf in die Kopfzeile, #naNotaus nur noch Balken");
assert.ok(/const knopf = admin && !NOTAUS\.aktiv \? `<button type="button" class="notaus-knopf klein" id="notausKnopf"/.test(app), "kleiner Knopf, nur Admin, nicht bei aktivem NOT-AUS");
assert.ok(/\.notaus-knopf\.klein \{ width: 40px; height: 40px;/.test(html), "etwa SOS-Höhe");
assert.ok(/\.notaus-platz:empty \{ display: none; \}/.test(html) && /#naNotausPlatz:empty \+ #naSosKnopf \{ margin-left: auto; \}/.test(html), "ohne Knopf steht SOS wie bisher rechts");
assert.ok(/const ab = \(e\) => \{ const kurz = !!NOTAUS\.halt; notausHaltEnde\(k, true\); if \(kurz && \(e\?\.type === "pointerup" \|\| e\?\.type === "keyup"\)\) notausTipp\(k\); \};/.test(app), "kurz antippen → Hinweis (nicht bei Abbruch)");
assert.ok(/function notausTipp\(k\) \{/.test(app) && app.includes("1,5 s halten = alle Nachrichten stoppen") && /id="notausProbeKnopf"/.test(app) && /\.onclick = \(\) => \{ t\.remove\(\); notausProbe\(\); \};/.test(app), "Blase mit Hinweis und Probe-NOT-AUS");
assert.ok(/if \(f >= 1\) \{ notausHaltEnde\(k, false\); notausAusloesen\(\); \}/.test(app), "Auslösen nach 1,5 s halten unverändert");

// ---- KC-NOTAUS-PULS: Titel pulsiert rot, solange aktiv (für alle), wie das Inkognito-Pulsieren ----
assert.ok(app.includes('document.querySelector("#v-nachrichten .kopf2 > h2")?.classList.toggle("notaus-puls", NOTAUS.aktiv);'), "Titel-Puls an/aus mit dem NOT-AUS");
assert.ok(/#v-nachrichten \.kopf2 > h2\.notaus-puls \{ animation: notausTitelPuls 1\.2s ease-in-out infinite; \}/.test(html) && /@keyframes notausTitelPuls \{[^\n]*#ff1744/.test(html), "rot pulsierend im Inkognito-Takt");
assert.ok(/@media \(prefers-reduced-motion: reduce\) \{ #v-nachrichten \.kopf2 > h2\.notaus-puls \{ animation-duration: 2\.4s; \} \}/.test(html), "weniger Bewegung wie beim Inkognito");

assert.ok(lies(".github/workflows/tests.yml").includes("node tests/notaus.test.mjs"), "läuft in der CI");
console.log("notaus: ok");
