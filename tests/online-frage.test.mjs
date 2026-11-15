// 2.953.0 KC-CLUB-ONLINE-FRAGE (Wunsch Hansi 15.11.2026): statt „bei allen einschalten“ fragt die App jedes Mitglied einmal,
// ob es „🟢 … ist jetzt online“ bekommen möchte – mit dem Hinweis, dass man die Person dann direkt kontaktieren bzw. anklopfen kann.
// Aufruf: node tests/online-frage.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const fn = app.slice(app.indexOf("function onlineFragen(r) {"), app.indexOf("async function pushUmschalten() {"));
assert.ok(fn.length > 200, "Frage vorhanden");
assert.ok(/if \(sub && r\.diesesAktiv\) return onlineFragen\(r\);/.test(app), "nur gefragt, wenn Push auf diesem Gerät läuft");
assert.ok(/if \(!ICH \|\| ICH\.admin \|\| r\?\.kommAus \|\| e\.online_push\) return;/.test(fn), "nicht Admins, nie bei Kommunikation aus, nur wer noch nicht entschieden hat");
assert.ok(/lsLesen\("kc_club_online_gefragt"\) === heute/.test(fn) && /document\.querySelector\("\.dlg-blatt"\)/.test(fn), "höchstens einmal am Tag, nicht über einer anderen Frage");
for (const t of ["🟢 Melden, wenn jemand online kommt?", "„🟢 Karla ist jetzt online“", "<b>direkt kontaktieren</b> bzw. <b>anklopfen</b>", "⚙️ → 🔔 Benachrichtigungen", "Ja, gerne", "Nein, danke", "Später"])
  assert.ok(fn.includes(t), `Text fehlt: ${t}`);
assert.ok(/if \(was === "ja"\) return onlinePushSchalter\(true\);/.test(fn) && /if \(was === "nein"\) \{ await onlinePushSchalter\(false\); return; \}/.test(fn), "Ja/Nein setzen die bestehende Einstellung");
assert.ok(/schluessel: "online_frage"/.test(fn) && /ONLINE_FRAGE_SPAETER_TAGE = 3;/.test(app), "Später → in 3 Tagen wieder");
assert.ok(/online_frage: \(w\) => \(\{ bis: /.test(server), "Server kennt die Einstellung online_frage");
// Empfängerregel unverändert: Nicht-Admins nur, wenn sie selbst „an“ gewählt haben
assert.ok(/const freiwillig = \(wahl \?\? \[\]\)\.filter\(\(x: any\) => x\.wert\?\.an === true\)/.test(server), "niemand bekommt es ungefragt");
console.log("online-frage: ok");
