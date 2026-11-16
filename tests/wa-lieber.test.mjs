// KC-CLUB-WA-LIEBER (Wunsch Hansi 16.11.2026: „Wenn ich z. B. Marianne in der Club-App schreibe, soll automatisch die gleiche auch in WhatsApp …
// ich nur noch auf Senden klicke“ – „nicht für jede Nachricht … zu viele Knöpfe … einige nutzen lieber WhatsApp“ – „gleich für alle“).
// Aufruf: node tests/wa-lieber.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8"), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
// Server
assert.ok(/wa_lieber: \(w\) => \(\{ an: w\?\.an === true \}\),/.test(server), "eigene Einstellung, Standard aus");
assert.ok(/waLieber: waLieber\.has\(m\.person_id\) \}/.test(server), "Mitgliederliste sagt, wer lieber WhatsApp liest");
const fall = server.slice(server.indexOf('case "wa_lieber_setzen": {'), server.indexOf("// KC-CLUB-PULS (Wunsch Hansi 16.11.2026)"));
assert.ok(/nurAdmin\(ich\);/.test(fall) && /protokoll\(ich\.person_id, "wa_lieber_gesetzt"/.test(fall), "Admin setzt es für ein Mitglied (protokolliert)");
// App: im selben Antippen von Senden, kein neuer Knopf im Chat
assert.ok(/if \(!text && !anlagen\.length\) return;\n  waLieberJetzt\(text\);/.test(app), "direkt beim Antippen von Senden (vor jedem await)");
assert.ok(/id="setWaLieber" onchange="waLieberSetzen\(this\.checked\)"/.test(html) && /id="setWaAuto" onchange="einstellung\('waAuto', this\.checked\)"/.test(html), "zwei Schalter unter ⚙️");
assert.ok(/waLieberAdmin\('\$\{esc\(m\.person_id\)\}'\)/.test(app), "Admin-Knopf auf der Mitgliedsseite");
// Verhalten
const code = app.slice(app.indexOf("const WA_NR = {};"), app.indexOf("async function waLieberSetzen("));
const lauf = (o = {}) => {
  const log = [];
  const umg = { chatId: "c1", CHAT: { id: "c1", gruppe: null, teilnehmer: [{ person_id: "ICH" }, { person_id: "M" }] }, ICH: { person_id: "ICH", vorname: "Hansi" },
    MITGLIEDER: [{ person_id: "M", vorname: "Marianne", wege: { whatsapp: true, waLieber: true } }], VN: { an: false }, EXPRESS: false, anlagen: [], WE: { ids: [] },
    IST_ANDROID: false, IST_IOS: false, einst: () => true, ...o };
  const loc = { set href(u) { log.push(u); } };
  const f = new Function(...Object.keys(umg), "location", "window", "melde", "api", "mitgliederHolen", "waNummer", "encodeURIComponent",
    code + "; WA_NR.M = '4915204077312'; return waLieberJetzt;")(...Object.values(umg), loc, { open: (u) => log.push(u) }, () => {}, async () => ({}), async () => {}, (x) => x, encodeURIComponent);
  f("Hallo Marianne"); return log;
};
assert.ok(/^https:\/\/wa\.me\/4915204077312\?text=Hallo%20Marianne/.test(lauf()[0] || ""), "PC: WhatsApp im Chat mit Marianne, Text drin");
assert.ok(/^intent:\/\/send\?phone=4915204077312&text=Hallo/.test(lauf({ IST_ANDROID: true })[0] || ""), "Android: WhatsApp-App direkt");
assert.ok(/^whatsapp:\/\/send\?phone=4915204077312&text=/.test(lauf({ IST_IOS: true })[0] || ""), "iPhone: WhatsApp-App direkt");
assert.equal(lauf({ MITGLIEDER: [{ person_id: "M", wege: { whatsapp: true, waLieber: false } }] }).length, 0, "nur wer lieber WhatsApp liest");
assert.equal(lauf({ MITGLIEDER: [{ person_id: "M", wege: { whatsapp: false, waLieber: true } }] }).length, 0, "nur mit freigegebener Nummer");
assert.equal(lauf({ CHAT: { id: "c1", gruppe: { name: "G" }, teilnehmer: [{ person_id: "ICH" }, { person_id: "M" }] } }).length, 0, "nicht in Gruppen");
assert.equal(lauf({ einst: () => false }).length, 0, "abschaltbar");
assert.equal(lauf({ anlagen: [1] }).length, 0, "nicht mit Anlagen");
assert.equal(lauf({ VN: { an: true } }).length, 0, "nicht verschlüsselt");
console.log("✅ wa-lieber: alle Prüfungen bestanden");
