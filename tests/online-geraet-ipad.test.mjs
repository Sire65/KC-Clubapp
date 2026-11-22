// KC-CLUB-ONLINE-GERAET-IPAD (Fund Hansi 22.11.2026: „Marianne am PC ist jetzt online“ und gleich danach „Marianne am Tablet ist jetzt online“ –
// sie war nur am iPad). Aufruf: node tests/online-geraet-ipad.test.mjs (offline, ohne Server)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const stueck = (q, von, bis) => { const a = q.indexOf(von); assert.ok(a >= 0, von); const b = q.indexOf(bis, a); assert.ok(b > a, bis); return q.slice(a, b); };

// 1) Server: Gerät aus User-Agent – „Macintosh“ ohne Hinweis ist unklar (iPad!), Windows/Linux bleibt PC; Hinweis der App gilt vor dem User-Agent
const GERAETE = new Set(["handy", "tablet", "pc"]);
const geraetAusUA = new Function("return " + stueck(server, "function geraetAusUA(", "\n}\n").replace("(ua: string): string | null", "(ua)") + "\n}")();
const geraetAus = new Function("GERAETE", "geraetAusUA", "return " + stueck(server, "const geraetAus = ", ";\n").replace("const geraetAus = ", "").replace("(ua: string, hinweis?: unknown)", "(ua, hinweis)"))(GERAETE, geraetAusUA);
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15";
assert.equal(geraetAusUA(IPAD), null, "Macintosh ohne Hinweis = unklar");
assert.equal(geraetAus(IPAD, "tablet"), "tablet", "iPad-Hinweis der App → Tablet");
assert.equal(geraetAus(IPAD, undefined), null, "alte App ohne Hinweis → unklar");
assert.equal(geraetAus(IPAD, "quatsch"), null, "unbekannter Hinweis zählt nicht");
assert.equal(geraetAusUA("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130"), "pc");
assert.equal(geraetAusUA("Mozilla/5.0 (X11; Linux x86_64) Firefox/131"), "pc");
assert.equal(geraetAusUA("Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) Chrome/130"), "pc");
assert.equal(geraetAusUA("Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) Mobile/15E148"), "handy");
assert.equal(geraetAusUA("Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)"), "tablet");
assert.equal(geraetAusUA("Mozilla/5.0 (Linux; Android 14; SM-X200) Chrome/130"), "tablet");
assert.equal(geraetAusUA("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/130 Mobile"), "handy");

// 2) Server: die „ist jetzt online“-Push nimmt den Hinweis der ersten Anfrage, sonst das zuletzt bekannte Gerät – nie geraten „am PC“
assert.ok(server.includes('GERAET_HINWEIS.set(req, String(p?._g ?? "")); // KC-CLUB-ONLINE-GERAET-IPAD') && server.indexOf("GERAET_HINWEIS.set(req,") < server.indexOf("const ich = await anmelden(req);"), "Hinweis vor der Anmeldung gemerkt");
assert.ok(server.includes('onlinePushMelden(ichAus(p, r), ua, req ? GERAET_HINWEIS.get(req) : "")'), "Push bekommt den Hinweis");
assert.ok(server.includes('GERAET_NAME[geraetAus(ua, hinweis) || (await geraetZuletzt(wer.person_id).catch(() => null)) || ""] || ""'), "unklar → zuletzt bekanntes Gerät");
assert.ok(server.includes('const g = geraetAus(req.headers.get("user-agent") || "", f.g);'), "Online-Abgleich: Hinweis vor User-Agent");
assert.ok(server.includes('"Access-Control-Allow-Headers": "content-type, x-club-token, x-club-version",'), "keine neue Kopfzeile (CORS beim Einspielen)");

// 3) App: JEDE Anfrage trägt den Geräte-Hinweis im Inhalt (auch init – dort entsteht die Push)
assert.ok(app.includes("/* KC-CLUB-ONLINE-JEDE-ANFRAGE */, _g: geraetHinweis() /* KC-CLUB-ONLINE-GERAET-IPAD */ })"), "apiRoh schickt _g");
assert.ok(/function geraetHinweis\(\) \{ if \(!GERAET_HINWEIS\) try \{ GERAET_HINWEIS = fpGeraet\(\); \} catch \{ return ""; \} return GERAET_HINWEIS; \}/.test(app), "Hinweis einmal ermittelt, Fehler still");

// 4) App: bloßer Gerätewechsel (Push „am PC“, gleich danach Online-Liste „am Tablet“) → KEINE zweite Meldung (je Person gemerkt)
const ANSAGE_PAUSE_MS = 10 * 60000, OA = { perPush: new Map(), gesagt: new Map() };
const oaKern = new Function("return " + stueck(app, "const oaKern = ", ";\n").replace("const oaKern = ", ""))();
const onlinePushGezeigt = new Function("OA", "oaKern", "return " + stueck(app, "function onlinePushGezeigt(", "\n").replace(/\s*$/, ""))(OA, oaKern);
const schonPerPush = new Function("OA", "oaKern", "ANSAGE_PAUSE_MS", "return " + stueck(app, "const schonPerPush = ", ";\n").replace("const schonPerPush = ", ""))(OA, oaKern, ANSAGE_PAUSE_MS);
assert.equal(oaKern("Marianne (am Tablet)"), "Marianne");
assert.equal(oaKern("Marianne"), "Marianne");
onlinePushGezeigt("🟢 Marianne (am PC) ist jetzt online (10:05 Uhr)");
assert.ok(schonPerPush("Marianne (am Tablet)"), "Gerätewechsel binnen 2 Min.: keine zweite Ansage");
assert.ok(schonPerPush("Marianne"), "auch ohne Geräte-Angabe");
assert.ok(!schonPerPush("Klaus (am Tablet)"), "andere Person wird weiter gemeldet");
// Ansage-Sperre selbst ist je Person (gesagt/werIstDa)
const sp = stueck(app, "function onlineAnsageSprechen(", "OA.warte = ");
assert.ok(sp.includes("OA.gesagt.get(oaKern(x))") && sp.includes("OA.gesagt.set(oaKern(x), jetzt)"), "Ansage je Person gemerkt");
assert.ok(app.includes("namen.forEach((x) => OA.gesagt.set(oaKern(x), jetzt)); // KC-CLUB-ONLINE-GERAET-IPAD"), "„Wer ist da“ je Person gemerkt");

assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/online-geraet-ipad.test.mjs"), "läuft in der CI");
console.log("online-geraet-ipad: ok");
