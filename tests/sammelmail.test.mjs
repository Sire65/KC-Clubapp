// 3.30.0 KC-CLUB-SAMMELMAIL (Wunsch Hansi 25.11.2026): Chat-Benachrichtigungen per E-Mail für Mitglieder mit Häkchen gesammelt (9/12/15/18/21 Uhr oder 18 Uhr).
// Prüft: nur Chat-Nachrichten, nie ❗/Notfall/Express/Nachsenden, Push sofort, Abzweig im zentralen Versand, Versand in der Wartung (erst merken, dann senden,
// danach löschen), Einstellung + Häkchen, Migration (RLS, Rechte, kein Spiegel). Aufruf: node tests/sammelmail.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const srv = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const sql = fs.readFileSync(new URL("../supabase/migrations/20261125_kc_club_sammelmail.sql", import.meta.url), "utf8");
// sammelPasst als Funktion prüfen
const fq = srv.slice(srv.indexOf("function sammelPasst("), srv.indexOf("// Text der Einzel-Mail ohne Anrede"));
const sammelPasst = new Function(`${fq.replace(/: string|: Record<string, unknown>/g, "")}; return sammelPasst;`)();
const v = {};
assert.equal(sammelPasst("club_nachricht", v, "club-nachricht:abc"), true, "Standardweg");
assert.equal(sammelPasst("club_nachricht_mail", v, "club-nachricht:abc"), true, "nur Mail");
assert.equal(sammelPasst("club_nachricht_beide", v, "club-nachricht:abc"), true, "Push + Mail → Mail gesammelt");
assert.equal(sammelPasst("club_nachricht_mail", v, "club-nachricht:abc:ruhe"), true, "Ruhezeit-Mail auch");
assert.equal(sammelPasst("club_nachricht_mail", v, "club-nachricht:abc:erwaehnt"), true, "@Erwähnung auch");
assert.equal(sammelPasst("club_nachricht_push", v, "club-nachricht:abc"), false, "reiner Push nie");
assert.equal(sammelPasst("club_nachricht_mail", v, "club-nachricht:abc:kopie"), false, "Kopien nie");
assert.equal(sammelPasst("club_nachricht_mail", v, "club-erstattung:abc"), false, "nur Chat-Nachrichten");
assert.equal(sammelPasst("club_treffen_mail", v, "club-nachricht:abc"), false, "andere Ereignisse nie");
for (const x of [{ wichtigkeit: "notfall" }, { eilig: true }, { express: true }]) assert.equal(sammelPasst("club_nachricht", x, "club-nachricht:abc"), false, "sofort: " + JSON.stringify(x));
assert.equal(sammelPasst("club_nachricht", { wichtigkeit: "hoch" }, "club-nachricht:abc"), true, "Hansi: nur Express als Einzel-Mail – ❗ Wichtig wird gesammelt");
// Standard AN für alle (Hansi 25.11.: „für alle einschalten“), nur ausdrücklich an: false schaltet ab
assert.ok(/wert\?\.an === false \? "aus"/.test(srv) && /wer = personIds\.filter\(\(id\) => takt\.get\(id\) !== "aus"\)/.test(srv), "Standard an");
assert.ok(/sammelmail \|\| \{ an: true, takt: "3std" \}/.test(app) && /\$\("sammelAn"\)\.checked = w\.an !== false/.test(app), "App zeigt Standard an");
// sauber geordnet: Trennlinie, „n von N“, älteste zuerst
assert.ok(/const LINIE = "─{10,24}";/.test(srv) && /✉️ \$\{i \+ 1\}\/\$\{liste\.length\} · \$\{uhr\(x\.erstellt_am\)\} · \$\{x\.titel\}/.test(srv) && /die älteste zuerst/.test(srv) && /\.order\("erstellt_am"\)/.test(srv), "Trennlinie + Reihenfolge");
// Abzweig im zentralen Versand, nicht beim Nachsenden des Admins
assert.ok(/const gesammelt = opt\.trotzStumm \? null : await sammelAbzweigen\(eventKey, personIds, vars, korrelation\)\.catch\(/.test(srv), "zentral, Fehler → normal senden");
assert.ok(/if \(gesammelt\) \{ ergebnis\.gesendet \+= gesammelt\.ids\.size;/.test(srv), "zählt als zugestellt");
const ab = srv.slice(srv.indexOf("async function sammelAbzweigen("), srv.indexOf("// Wartung (alle 15 Min.): fällige Sammel-E-Mails"));
assert.ok(/if \(pushJetzt\.length === wer\.length\) return null;/.test(ab), "alle mit Push → wie bisher");
assert.ok(/routerSendenRoh\("club_nachricht_push", pushJetzt/.test(ab), "Push sofort");
assert.ok(/if \(error\) throw new Error\("sammelmail speichern/.test(ab), "nicht gespeichert → nicht abzweigen");
// Versand in der Wartung
const se = srv.slice(srv.indexOf("async function sammelmailSenden("), srv.indexOf("const ROUTER_STUECK") > 0 ? srv.length : 0);
const sf = srv.slice(srv.indexOf("async function sammelmailSenden("), srv.indexOf("async function sammelmailSenden(") + 4000);
assert.ok(/"3std": \[9, 12, 15, 18, 21\], tag: \[18\]/.test(srv), "Termine");
assert.ok(sf.indexOf('schluessel: "sammelmail_stand"') < sf.indexOf('routerSenden("club_nachricht_mail"'), "erst merken, dann senden");
assert.ok(/delete\(\)\.in\("id", liste\.map/.test(sf) && /lt\("erstellt_am", new Date\(jetztD\.getTime\(\) - 14 \* 86400000\)/.test(sf), "nach Versand löschen, spätestens 14 Tage");
assert.ok(/`club-sammel:\$\{pid\}:/.test(sf), "eigene Kennung (wird nicht erneut gesammelt)");
assert.ok(/const sammelmail = await sammelmailSenden\(\)\.catch\(/.test(srv), "Wartung");
assert.ok(se.length > 0);
// Einstellung
assert.ok(/sammelmail: \(w\) => \(\{ an: w\?\.an === true, takt: w\?\.takt === "tag" \? "tag" : "3std" \}\)/.test(srv), "Einstellung geprüft");
assert.ok(html.includes('id="sammelAn" onchange="sammelSpeichern()"') && html.includes('<option value="tag">einmal am Tag um 18 Uhr</option>'), "Häkchen + Termin");
assert.ok(/api\("einstellung_setzen", \{ schluessel: "sammelmail", wert \}\)/.test(app) && /ruheZeigen\(\); sammelZeigen\(\);/.test(app), "App speichert und zeigt");
assert.ok(/\{ id: "sammelmail", thema: "nachrichten"/.test(app), "Hilfe");
// Migration
assert.ok(/enable row level security/.test(sql) && /revoke all on public\.kc_club_sammelmail from public, anon, authenticated/.test(sql) && /grant select, insert, update, delete on public\.kc_club_sammelmail to service_role/.test(sql));
assert.ok(/'kc_club_sammelmail', 'Club-App', 'sensitive', false, false, false/.test(sql), "nicht spiegeln, nicht sichern");
{ const i = srv.indexOf("const sammelText ="), j = srv.indexOf("async function sammelAbzweigen(");
  const sammelText = new Function(srv.slice(i, j).replace(": unknown", "") + "; return sammelText;")();
  assert.equal(sammelText("Hallo,\n\nKlaus hat dir geschrieben:\n\nTest\n\n📎 Im Anhang: a.jpg\n\nAntworten in der Köcheclub-App: X\n\nViele Grüße\nKöcheclub Werne"),
    "Klaus hat dir geschrieben:\n\nTest\n\n📎 Anlage: a.jpg – in der App", "Anrede/Gruß/Antwort-Link weg, Anhang als Hinweis");
  assert.equal(sammelText("Hallo,\n\nKlaus Beispiel hat dir im Köcheclub geschrieben („Stand“):\n\nMorgen?\n\nAntworten in der Köcheclub-App: https://x#nachricht=1\n\nViele Grüße\nKöcheclub Werne"),
    "Klaus Beispiel:\nMorgen?", "kompakt: „Name:“"); }
console.log("sammelmail: ok");
