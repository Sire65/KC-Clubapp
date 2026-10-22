// KC-CLUB-FREMDZUGRIFF (2.579.0, 22.10.2026, Wunsch Hansi „Fremde Anmeldeversuche: wann, mit welchem Schlüssel, Vermutung wer“).
// Aufruf: node tests/fremdzugriff.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { FZ, fzGeraet, fzVermutung, fzAlarm, fzKennung } from "../supabase/functions/kc-club/fremdzugriff.js";

// Gerät in Worten
assert.equal(fzGeraet("Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36"), "Android 10 · Chrome 155");
assert.equal(fzGeraet("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1"), "iPhone iOS 18 · Safari");
assert.equal(fzGeraet("Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0 Mobile Safari/537.36"), "Android 14 · Samsung-Browser 26");
assert.equal(fzGeraet("Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:131.0) Gecko/20100101 Firefox/131.0"), "Windows-PC · Firefox 131");
assert.equal(fzGeraet("curl/8.5.0"), "Programm/Bot (curl)");
assert.equal(fzGeraet("python-requests/2.31"), "Programm/Bot (python-requests)");
assert.equal(fzGeraet(""), "unbekanntes Gerät");

// Vermutung: gesperrt > alter Link > gleiches Netz > gleiches Gerät > unbekannt
const namen = new Map([["KC-P-M0009", "Klaus Beispiel"], ["KC-P-M0008", "Dieter Beispiel"]]);
assert.deepEqual(fzVermutung({ gesperrt: { person: "KC-P-M0009" }, alt: { person: "KC-P-M0008" } }, namen).person, "KC-P-M0009");
{
  const v = fzVermutung({ alt: { person: "KC-P-M0009", am: "20.10.2026", grund: "ersetzt" }, netz: { person: "KC-P-M0008", minVorher: 3 } }, namen);
  assert.ok(v.sicher && v.person === "KC-P-M0009" && /Klaus Beispiel – alter Link \(ersetzt am 20\.10\.2026\)/.test(v.text), "alter Link schlägt Netz");
}
{
  const v = fzVermutung({ netz: { person: "KC-P-M0008", minVorher: 3 } }, namen);
  assert.ok(!v.sicher && /vermutlich Dieter Beispiel – gleiche Internetverbindung, dort vor 3 Min\. angemeldet/.test(v.text));
}
assert.ok(/vielleicht Klaus Beispiel/.test(fzVermutung({ geraet: { person: "KC-P-M0009" } }, namen).text));
assert.deepEqual(fzVermutung({}, namen), { person: null, text: "unbekannt – kein Treffer bei alten Links, Internetverbindung oder Gerät", sicher: false });

// Alarm: ab 5 in 15 Min., höchstens einmal je Stunde; Programme/Bots sofort
const T = Date.parse("2026-10-22T10:00:00Z");
assert.equal(FZ.alarmAnzahl, 5); assert.equal(FZ.alarmFensterMin, 15);
assert.ok(!fzAlarm(4, 0, T, false) && fzAlarm(5, 0, T, false), "ab 5 Versuchen");
assert.ok(!fzAlarm(9, T - 30 * 60000, T, false) && fzAlarm(9, T - 61 * 60000, T, false), "höchstens einmal je Stunde");
assert.ok(fzAlarm(1, 0, T, true), "Bot sofort");

// Kurzkennung: nie der Schlüssel, nur 12 Zeichen des Hashes
assert.equal(fzKennung("a".repeat(64)), "aaaaaaaaaaaa"); assert.equal(fzKennung(null), null); assert.equal(fzKennung("xyz"), null);

// Migration, Server, App
{
  const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
  const mig = lies("supabase/migrations/20261022_kc_club_v2579_fremdzugriff.sql"), server = lies("supabase/functions/kc-club/index.ts"), app = lies("app.js");
  for (const t of ["kc_club_fremdzugriff", "kc_club_zugang_alt"]) {
    assert.ok(new RegExp(`grant select, insert, update, delete on public\\.${t} to service_role`).test(mig) && new RegExp(`revoke all on public\\.${t} from public, anon, authenticated`).test(mig)
      && new RegExp(`alter table public\\.${t} enable row level security`).test(mig), "Rechte + RLS: " + t);
  }
  assert.ok(/after update of token_hash, aktiv on public\.kc_club_zugang/.test(mig) && /exception when others then null/.test(mig) && !/drop table|truncate|delete from/i.test(mig.replace(/--[^\n]*/g, "")), "Trigger merkt alte Links, stört nie, nichts gelöscht");
  assert.ok(/if \(token\) fremdMerken\(req, "kaputt", null\)/.test(server) && /fremdMerken\(req, "unbekannt", hash\)/.test(server) && /fremdMerken\(req, "gesperrt", hash, p\?\.person_id \|\| null\)/.test(server), "alle drei Ablehnungen werden vermerkt");
  assert.ok(/schluessel: kennung/.test(server) && !/insert\(\{[^}]*token[,:]/.test(server.slice(server.indexOf("function fremdMerken"), server.indexOf("async function anmelden("))), "nie den Schlüssel selbst speichern");
  assert.ok(/if \(\+\+FZ_STUNDE\.n > FZ\.proStunde\) return;/.test(server) && /FZ\.gleichMin \* 60000/.test(server), "Bremse gegen Fluten");
  assert.ok(/case "fremdzugriffe": \{\s*nurAdmin\(ich\);/.test(server) && /delete\(\)\.lt\("zeit", new Date\(Date\.now\(\) - FZ\.aufbewahrenTage/.test(server), "nur Admin; nach 90 Tagen gelöscht");
  assert.ok(/if \(ICH\?\.admin\) fremdZeigen\(\);/.test(app) && /h === "#fremdzugriffe"/.test(app), "App: Karte im Sicherheits-Check (Admin), Link aus dem Push");
  assert.ok(lies(".github/workflows/tests.yml").includes("node tests/fremdzugriff.test.mjs"), "läuft in der CI");
}
console.log("fremdzugriff: alle Prüfungen bestanden");
