// KC-CLUB-DB-VIEL-ZU-TUN (2.806.0, Wunsch #62 Hansi): freundlicher Hinweis, wenn die Datenbank planmäßig schwer arbeitet.
// Aufruf: node tests/db-viel-zu-tun.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");
// Server: eine Registry, dieselbe geht beim Start an die App (keine zweite Liste in der App)
const reg = server.slice(server.indexOf("const SCHWER_ZEITEN = ["), server.indexOf("];", server.indexOf("const SCHWER_ZEITEN = [")) + 2);
const SCHWER_ZEITEN = new Function(reg.replace("const SCHWER_ZEITEN =", "return"))();
assert.deepEqual(SCHWER_ZEITEN.map((z) => z.art), ["notpaket", "spiegel", "sicherung", "aufraeumen"], "alle planmäßigen schweren Arbeiten");
assert.ok(/[{,] schwerZeiten: SCHWER_ZEITEN,/.test(server.slice(server.indexOf("return json({ meinGeburtstag"), server.indexOf("return json({ meinGeburtstag") + 400)), "init liefert die Registry mit");
assert.ok(/const dbWeg = \(\) => \{ const l = schwerLage\(\); return json\(\{ error: l \? schwerText\(l\) :/.test(server), "Server-Fehler nennt den Grund");
assert.ok(!/SCHWER_ZEITEN|schwerZeiten\s*=\s*\[/.test(app.replace(/INIT\?\.schwerZeiten/g, "")), "App hat keine eigene Zeitliste");
// App-Rechnung echt ausführen
const a = app.indexOf("function schwerLage(z = INIT?.schwerZeiten"), b = app.indexOf("const schwerOder", a);
const code = app.slice(a, app.indexOf("\n", b));
const { schwerLage, schwerOder } = new Function("INIT", code + "\nreturn { schwerLage, schwerOder };")({ schwerZeiten: SCHWER_ZEITEN });
const t = (hh, mm, ss = 0) => new Date(Date.UTC(2026, 10, 2, hh, mm, ss));
assert.deepEqual(schwerLage(SCHWER_ZEITEN, t(12, 24, 30)), { was: "das Notfall-Paket gebaut", rest: 2 });
assert.equal(schwerLage(SCHWER_ZEITEN, t(12, 26)), null, "nach dem Paket wieder normal");
assert.equal(schwerLage(SCHWER_ZEITEN, t(16, 20)).rest, 10, "Spiegelung bis :30");
assert.equal(schwerLage(SCHWER_ZEITEN, t(1, 59, 30)).rest, 1, "nie 0 Minuten");
assert.equal(schwerLage(SCHWER_ZEITEN, t(3, 30)).was, "nachts aufgeräumt");
assert.equal(schwerLage(SCHWER_ZEITEN, t(12, 0)), null, "sonst kein Hinweis");
assert.equal(schwerLage(null, t(12, 24)), null, "ohne Daten vom Server: nichts raten");
assert.match(schwerOder("X"), /^(X|Zurzeit hat die Datenbank viel zu tun: Es wird gerade .+\. Das dauert ca\. noch \d+ Minuten?\. Versuche dein Anliegen bitte später noch einmal\. Danke für dein Verständnis\.)$/);
// Nur bei Leitungs-/Serverfehlern, nie statt echter Fehlermeldungen
assert.equal((app.match(/schwerOder\("/g) || []).length, 2, "Keine Verbindung + kurz nicht erreichbar");
assert.ok(/new Error\(schwerOder\(API_LESEN\.test\(action\)/.test(app), "Zeitüberschreitung");
assert.ok(/new Error\(j\?\.error \|\| \(leitungKaputt \? schwerOder\(/.test(app), "Server-Text hat Vorrang");
console.log("db-viel-zu-tun: alle Prüfungen bestanden");
