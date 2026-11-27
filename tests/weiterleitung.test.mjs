// KC-CLUB-WEITERLEITUNG (3.53.0, Wunsch Hansi 27.11.2026 „Autoweiterleitung an eine andere E-Mail-Adresse oder einen anderen Chat – alle sollen es haben“).
// Prüft Regeln (wlWert/wlAktiv nachgerechnet), Club-Server (Code-Bestätigung, Schleifenschutz, keine Adresse im Protokoll, Hinweis an den Absender)
// und App (Einstellung, Chat-Hinweis, Aktionen für alle). Aufruf: node tests/weiterleitung.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { stripTypeScriptTypes } from "node:module";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), html = lies("index.html"), server = lies("supabase/functions/kc-club/index.ts");

// ---- Regeln nachrechnen ----
const stueck = (start, ende) => server.slice(server.indexOf(start), server.indexOf(ende, server.indexOf(start)));
const code = stripTypeScriptTypes(
  stueck("const txt = (v: unknown, max: number)", "\n") + "\n" +
  stueck("const aaTag = ", "\n") + "\n" +
  stueck("const WL_SCHLUESSEL = ", "async function wlStand("));
const { wlWert, wlAktiv, wlMailOk } = new Function(code + "\nreturn { wlWert, wlAktiv, wlMailOk };")();
assert.equal(wlMailOk("a@b.de"), true); assert.equal(wlMailOk("kein-at.de"), false); assert.equal(wlMailOk("a@b.de, c@d.de"), false, "nur eine Adresse");
const h = "2026-11-27";
assert.equal(wlAktiv({ an: true, ziel: "email", email: "a@b.de", bestaetigt: false }, h), false, "E-Mail erst nach Code");
assert.equal(wlAktiv({ an: true, ziel: "email", email: "a@b.de", bestaetigt: true }, h), true);
assert.equal(wlAktiv({ an: false, ziel: "email", email: "a@b.de", bestaetigt: true }, h), false);
assert.equal(wlAktiv({ an: true, ziel: "chat", person: "KC-P-010" }, h), true);
assert.equal(wlAktiv({ an: true, ziel: "chat", person: "" }, h), false);
assert.equal(wlAktiv({ an: true, ziel: "chat", person: "X", von: "2026-11-28" }, h), false, "startet später");
assert.equal(wlAktiv({ an: true, ziel: "chat", person: "X", bis: "2026-11-26" }, h), false, "abgelaufen");
assert.equal(wlAktiv({ an: true, ziel: "chat", person: "X", von: h, bis: h }, h), true, "Tage einschließlich");
assert.equal(wlWert({ ziel: "chat", email: "a@b.de", person: "X" }).email, "", "Chat-Ziel speichert keine Adresse");
assert.equal(wlWert({ ziel: "email", email: "A@B.DE", person: "X" }).person, "", "E-Mail-Ziel speichert keine Person");
assert.equal(wlWert({ ziel: "email", email: "A@B.DE" }).email, "a@b.de");

// ---- Club-Server ----
for (const a of ["weiterleitung_laden", "weiterleitung_code", "weiterleitung_speichern"]) assert.ok(server.includes(`case "${a}":`), a);
const za = (q) => q.slice(q.indexOf("basis: ["), q.indexOf("aushilfe: ["));
for (const q of [server, app]) assert.ok(/"weiterleitung_laden", "weiterleitung_code", "weiterleitung_speichern",/.test(za(q.slice(q.indexOf("ZUGANG_AKTIONEN")))), "für alle, App und Server gleich");
const sp = stueck('case "weiterleitung_speichern": {', 'return json({ ok: true, ...(await wlStand');
assert.ok(/w\.bestaetigt = !!w\.email && alt\.bestaetigt && alt\.email === w\.email/.test(sp), "neue Adresse ist nie von selbst bestätigt");
assert.ok(/if \(w\.an && !w\.bestaetigt\) throw/.test(sp), "ohne Code keine E-Mail-Weiterleitung");
assert.ok(/WL_CODE_VERSUCHE/.test(sp) && /versuche: Number\(cw\.versuche \|\| 0\) \+ 1/.test(sp), "falsche Codes werden gezählt");
assert.ok(/w\.person === ich\.person_id\) throw/.test(sp), "nicht an sich selbst");
assert.ok(/protokoll\(ich\.person_id, "weiterleitung_gespeichert", \{ an: w\.an, art: w\.ziel, gruppen: w\.gruppen, zeitraum: [^}]*\}\)/.test(sp), "Protokoll ohne Adresse");
const cd = stueck('case "weiterleitung_code": {', 'case "weiterleitung_speichern"');
assert.ok(/protokollPlatz\(ich\.person_id, "weiterleitung_code", WL_CODE_MAX_STD\)/.test(cd), "höchstens 3 Codes je Stunde");
assert.ok(/hash: await sha256\(/.test(cd) && !/wert: \{[^}]*\bcode\b[,}]/.test(cd), "Code nur als Prüfsumme gespeichert");
assert.ok(/delete einstellungen\[WL_CODE_SCHLUESSEL\]/.test(server), "Code-Merker nie im Start-Paket");
const nv = stueck('case "nachricht_senden": {', 'case "privattermin_speichern"');
assert.ok(/if \(!probe && p\.aus_weiterleitung !== true && tnIds\.size >= 2\) nebenbei\(weiterleitungAusloesen\(/.test(nv), "keine Schleife, nie SOS-Probe, im Hintergrund");
const wa = stueck("async function weiterleitungAusloesen(", "async function wlHinweisFuer(");
assert.ok(/aus_weiterleitung: true/.test(wa) && /ohne_autoantwort: true/.test(wa), "Chat-Kopie löst weder Weiterleitung noch Autoantwort aus");
assert.ok(/tnSet\.has\(w\.person\)\) continue/.test(wa), "Ziel schon im Chat → keine doppelte Kopie");
assert.ok(/info\.slHinweis \|\| ohneFarbe\(info\.text\)/.test(wa) && /info\.einmal \?/.test(wa), "verschlüsselt/selbstlöschend/Einmal-Foto nur als Hinweis");
assert.ok(/\(!gruppe \|\| x\.wert\?\.gruppen === true\)/.test(wa), "Gruppen nur, wenn gewählt");
assert.ok(/notausLesen\(\)\)\.aktiv\) return 0/.test(wa), "NOT-AUS");
assert.ok(!/protokoll\([^)]*email[^)]*w\.email/.test(wa) && /\{ art: "email", ok, thread: threadId \}/.test(wa), "Protokoll ohne Adresse und Text");
assert.ok(/eventKey: "club_nachricht_mail", recipients: \[\{ email \}\]/.test(server), "Mail an freie Adresse über den Versanddienst (nur E-Mail)");
assert.ok(/weiterleitung = ich\.nurLesen \? \[\] : await wlHinweisFuer\(/.test(server) && /geplantVorab, weiterleitung,/.test(server), "Hinweis an den Absender im Chat");

// ---- App ----
assert.ok(html.includes('id="setWlStand"') && html.includes('onclick="wlFenster()"'), "Einstellung unter Benachrichtigungen");
assert.ok(html.includes('id="chatWlHinweis"'), "Hinweis im Chat");
assert.ok(/function wlFenster\(\)/.test(app) && /api\("weiterleitung_code", \{ email \}\)/.test(app) && /api\("weiterleitung_speichern"/.test(app), "Fenster mit Code");
assert.ok(/wlChatHinweis\(u\); \/\/ 3\.53\.0/.test(app), "Chat-Kopf zeigt den Hinweis");
assert.ok(/leitet Nachrichten gerade weiter/.test(app), "Text für den Absender");
console.log("weiterleitung: alles ok");
