// KC-CLUB-FREMDFEHLER (21.11.2026, Fund: Mitglied iPad/Safari bekam beim Einrichten 2× „Script error.“ ohne Fundstelle → Fenster + Alarm-Mail).
// Browser-/Erweiterungsfehler werden als Art „fremd“ (KC-F-022) nur mitgeschrieben: kein Fenster, Alarm erst ab > 5 am Tag (1× je Tag);
// jede Fehlermeldung bringt die letzten Schritte (ohne Chat-Kennungen) mit. Aufruf: node tests/fremdfehler.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const html = lies("index.html"), srv = lies("supabase/functions/kc-club/index.ts"), app = programmText();

// 1) Fehlerfang in index.html: Fremdfehler → Art „fremd“, echter Fehler → wie bisher „skript“
const fnText = html.match(/function istFremd\(text, datei, zeile, stapel\) \{[^\n]*\}/)?.[0];
assert.ok(fnText, "istFremd in index.html");
const istFremd = new Function(`${fnText}; return istFremd;`)();
assert.equal(istFremd("Script error.", "", 0, ""), true, "„Script error.“ ohne Fundstelle = fremd");
assert.equal(istFremd("", "", 0, undefined), true, "leer ohne Fundstelle = fremd");
assert.equal(istFremd("Script error.", "app.js", 120, ""), false, "mit Datei/Zeile = eigener Fehler");
assert.equal(istFremd("x is not defined", "", 0, ""), false, "echter Fehlertext = eigener Fehler");
assert.equal(istFremd("Script error.", "", 0, "at foo (app.js:1)"), false, "mit Stapel = eigener Fehler");
// onerror nutzt die Erkennung und schreibt sonst wie bisher „skript“
const onerr = html.slice(html.indexOf("window.onerror = function"), html.indexOf("window.addEventListener(\"unhandledrejection\""));
assert.ok(/if \(istFremd\(ft, fd, zeile, err && err\.stack\)\) \{ neu\("fremd", \{ text: ft\.trim\(\) \|\| "Script error\." \}\); return; \}/.test(onerr), "Fremdfehler → neu(\"fremd\")");
assert.ok(/neu\("skript", \{ text: String\(err && err\.message \|\| msg\), datei:/.test(onerr), "echter Fehler weiter als „skript“ mit Datei/Zeile");
// kein Fenster in der App: Absturzschutz überspringt Fremdfehler
assert.ok(/window\.KCFP\?\.istFremd\?\.\(ev\?\.error\?\.message \|\| ev\?\.message, ev\?\.filename, ev\?\.lineno, ev\?\.error\?\.stack\)\) return;/.test(app), "kein Fenster bei Fremdfehler");
assert.ok(!/neu\("fremd"[^)]*\)[^;]*fehlerFenster/.test(html + app), "Fremdfehler öffnet kein Fehlerfenster");

// 2) Spur zum Fehler: Feld „schritte“ an jeder Meldung, ohne UUIDs/IDs
assert.ok(/window\.KCFP\.schritte\(\) : ""; if \(sw\) e\.schritte = kurz\(sw, 300\);/.test(html), "neu() hängt schritte an jede Meldung");
const uuidSrc = app.match(/const SPUR_UUID = (\/[^\n]+\/gi);/)?.[1];
const schrittSrc = app.match(/function spurSchrittName\(w, mit\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(uuidSrc && schrittSrc, "spurSchrittName in app.js");
const spurSchrittName = new Function(`const SPUR_UUID = ${uuidSrc}; ${schrittSrc}; return spurSchrittName;`)();
assert.equal(spurSchrittName("einstellungen"), "einstellungen");
assert.equal(spurSchrittName("fenster", "kcCodeBlatt"), "fenster kcCodeBlatt");
const uuid = "3f2a9c1e-12ab-4cde-9f00-0123456789ab";
assert.equal(spurSchrittName("chat", uuid), "chat", "Chat-UUID fällt weg");
assert.equal(spurSchrittName("chat_" + uuid), "chat_", "UUID im Schrittnamen fällt weg");
assert.equal(spurSchrittName("mitglied", "KC-P-0042"), "mitglied", "Personen-ID fällt weg");
assert.ok(/SPUR_LETZTE\.push\(spurSchrittName\(w, mit\)\); if \(SPUR_LETZTE\.length > 8\) SPUR_LETZTE\.shift\(\);/.test(app), "letzte 8 Schritte");
assert.ok(/window\.KCFP\.schritte = \(\) => SPUR_LETZTE\.join\(" › "\)/.test(app), "Schritte für das Fehlerprotokoll");
assert.ok(/👣 Schritte davor: \$\{esc\(d\.schritte\)\}/.test(app), "Schritte im Fehlerprotokoll (Admin)");
assert.ok(/if \(key === "schritte"\) \{ out\[key\] = txt\(v, 300\)\.replace\(FF_UUID, ""\)/.test(srv), "Server entfernt UUIDs aus schritte");
assert.ok(/\$\{schritteText\}\$\{fkText\}Gerät:/.test(srv), "Schritte in der Alarm-Mail");

// 3) Server: kein Alarm je Fremdfehler; Hinweis erst ab > 5 am Tag, 1× je Tag
assert.ok(!/fremd: "/.test(srv.slice(srv.indexOf("const FA_ARTEN"), srv.indexOf("const FA_ARTEN") + 400)), "„fremd“ ist keine Alarm-Art");
assert.ok(/\(a !== "skript" \|\| !fpNurBrowser\(e\)\)/.test(srv), "auch alte „skript“-Fremdfehler ohne Alarm");
assert.ok(/FP_INFO\.add\("fremd"\)/.test(srv), "Fremdfehler sind Info");
assert.ok(/await fremdAlarm\(ich, liste\.slice\(0, platz\), ua, version\)/.test(srv), "fehler_melden ruft fremdAlarm");
const faSrc = srv.match(/async function fremdAlarm\([\s\S]*?\n\}/)?.[0];
assert.ok(faSrc && /const FF_SCHWELLE = 5;/.test(srv), "fremdAlarm mit Schwelle 5");
assert.ok(/vermutlich Browser-Erweiterung\/Inhaltsblocker – Gerät\/Browser prüfen/.test(faSrc), "Hinweistext in der Mail");
const js = faSrc.replace(/\(ich: Ich, liste: any\[\], ua: string, version: string\)/, "(ich, liste, ua, version)").replace(/: any\b/g, "").replace(/ as any\[\]/g, "");
async function fall(nHeute, schon, arten = ["fremd"]) {
  const gesendet = [], prot = [];
  const q = (r) => { const o = { select: () => o, eq: () => o, gte: () => Promise.resolve(r) }; return o; };
  let i = 0;
  const db = { from: () => q(i++ % 2 === 0 ? { count: nHeute } : { count: schon }) };
  const f = new Function("db", "fpArt", "berlinTeile", "berlinZuUtc", "adminIds", "txt", "fehlerKatalog", "protokoll", "senden", "berlinTag", "FF_SCHWELLE", "FF_UUID", "APP_URL", `${js}; return fremdAlarm;`)(
    db, (x) => String(x), () => ({ y: 2026, m: 11, d: 21 }), () => new Date("2026-11-20T23:00:00Z"), async () => ["A1", "P1"], (x, n) => String(x ?? "").slice(0, n),
    async () => [{ schluessel: "fremd", fehler_id: "KC-F-022", name: "Fremdfehler aus dem Browser", ursache: "u", loesung: "l" }],
    async (...a) => prot.push(a), async (...a) => gesendet.push(a), () => "2026-11-21", 5, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "https://x");
  await f({ person_id: "P1", name: "Probe" }, arten.map((art) => ({ art, sicht: "einstellungen", schritte: "einstellungen › chat " + uuid })), "iPad Safari/605", "9.9.9");
  return { gesendet, prot };
}
assert.equal((await fall(5, 0)).gesendet.length, 0, "5 am Tag: noch kein Hinweis");
const sechs = await fall(6, 0);
assert.equal(sechs.gesendet.length, 1, "6 am Tag: ein Hinweis");
assert.deepEqual(sechs.gesendet[0][1], ["A1"], "nicht an das Mitglied selbst");
assert.ok(/KC-F-022/.test(sechs.gesendet[0][2].text) && !sechs.gesendet[0][2].text.includes(uuid), "Mail mit KC-F-022, ohne UUID");
assert.equal(sechs.gesendet[0][3], "club-fremd-alarm:P1:2026-11-21", "einmal je Tag und Mitglied");
assert.equal((await fall(9, 1)).gesendet.length, 0, "heute schon gemeldet: nichts");
assert.equal((await fall(9, 0, ["skript"])).gesendet.length, 0, "andere Arten: kein Fremd-Hinweis");

// 4) Katalog: Migration mit KC-F-022 (nur Zeile, wiederholbar), Zählung im 📖 Fehlerkatalog über die Art
const mig = lies("supabase/migrations/20261121_kc_fehler_fremd.sql");
assert.ok(/insert into public\.kc_club_fehler_katalog/.test(mig) && /'fremd', 'KC-F-022'/.test(mig) && /where not exists/.test(mig), "Migration KC-F-022");
assert.ok(!/create table|security definer/i.test(mig.replace(/--[^\n]*/g, "")), "nur Zeile einfügen");
assert.ok(!/KC-F-022/.test(lies("supabase/migrations/20261116_kc_club_fehler_katalog.sql")), "ID noch frei");
assert.ok(/const a = fpArtVon\(x\.aktion\), s = a === "haenger" && x\.details\?\.ursache \? x\.details\.ursache : a;/.test(app), "Zählung je Art (fehler_fremd → fremd)");
assert.ok(/fremd: \["🧩", "Fremdfehler aus dem Browser · KC-F-022"/.test(app), "Art im Fehlerprotokoll bekannt");
console.log("fremdfehler: ok");
