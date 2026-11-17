// 2.970.0 KC-CLUB-CHAT-VORHANDEN (Wunschliste #97): an genau die Personen einer vorhandenen Gruppe/eines Chats schreiben → „Dort schreiben?“
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const srv = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const f = srv.slice(srv.indexOf('case "gruppenchat_finden"'), srv.indexOf("// KC-CLUB-MEINE-NACHRICHTEN-STATISTIK"));
assert.ok(/\.eq\("person_id", ich\.person_id\)/.test(f), "nur Chats, in denen ich selbst bin");
assert.ok(/l\.size === soll\.size && \[\.\.\.soll\]\.every\(\(x\) => l\.has\(x\)\)/.test(f), "genau diese Personen – nicht mehr, nicht weniger");
assert.ok(/kc_club_gruppen/.test(f) && /gruppen\[0\]\?\.thread_id/.test(f), "Gruppen zuerst");
assert.ok(!/select\("[^"]*\b(text|inhalt|body)\b/.test(f), "keine Nachrichteninhalte (KC-CHATS-PRIVAT)");
assert.ok(/"einzelchat_finden", "gruppenchat_finden"/.test(srv) && /"einzelchat_finden", "gruppenchat_finden"/.test(app), "freigegeben wie einzelchat_finden");
const k = app.slice(app.indexOf("// 2.970.0 KC-CLUB-CHAT-VORHANDEN"), app.indexOf("let vnIds = null;"));
assert.ok(/!chatId && neuEntwurf && !neuEntwurf\.mehrfach && !VN\.an/.test(k) && /wer\.length >= 2 && !\(e\.aemter \|\| \[\]\)\.length && !e\.alle && !e\.vorstand/.test(k), "nur neue Runde mit mehreren Personen, nicht bei 🔒/Ämtern/alle");
assert.ok(/await frage\(/.test(k) && /"💬 Ja, dort schreiben"/.test(k) && /"Neuen Chat aufmachen"/.test(k), "fragt – nie stillschweigend");
assert.ok(/await chatOeffnen\(r\.id\)/.test(k) && /anlagen = merkAnl/.test(k), "Nachricht + Anlagen gehen in den vorhandenen Chat");
assert.ok(app.indexOf("// 2.970.0 KC-CLUB-CHAT-VORHANDEN") > app.indexOf("if (chatId && WE.ids.length) {"), "greift auch nach ➕ weitere Empfänger");
console.log("chat-vorhanden: alle Prüfungen bestanden");
