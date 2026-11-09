// KC-CLUB-ONLINE-JEDE-ANFRAGE (09.11.2026, Fund Hansi „Anne ist drin, wird aber nirgends angezeigt“). Aufruf: node tests/online-jede-anfrage.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
// App: sichtbare Anfragen tragen die Kopfzeile, Hintergrund nicht; Server lässt sie durch (CORS)
assert.ok(app.includes('body: JSON.stringify({ action, ...daten, ...(typeof document !== "undefined" && !document.hidden ? { _sichtbar: 1 } : {})'), "nur sichtbare App, im Inhalt");
assert.ok(server.includes('"Access-Control-Allow-Headers": "content-type, x-club-token, x-club-version",'), "keine neue Kopfzeile (CORS beim Einspielen)");
// Server: jede sichtbare Anfrage zählt als Lebenszeichen, gedrosselt, im Hintergrund, nicht für weg/online/nur lesend/Test
const f = server.slice(server.indexOf("function onlineBeiAnfrage("), server.indexOf("async function onlineSeitMerken("));
assert.ok(f.includes('p?._sichtbar !== 1 || a === "online" || a === "weg" || ich.nurLesen'), "Ausnahmen");
assert.ok(f.includes("t - l < ONLINE_ANFRAGE_MS") && server.includes("const ONLINE_ANFRAGE_MS = 30000"), "höchstens alle 30 s");
assert.ok(f.includes("onlineSeitMerken(ich.person_id).catch(() => null)") && f.includes("waitUntil"), "im Hintergrund, Fehler still");
assert.ok(server.includes("onlineBeiAnfrage(ich, a, p); // KC-CLUB-ONLINE-JEDE-ANFRAGE"), "nach der Anmeldung jeder Anfrage");
// Takt: nie seltener als 90 s (Server zeigt 150 s) – auch nicht im Sparmodus
const ONLINE_SEK = Number(server.match(/const ONLINE_SEK = (\d+)/)[1]), max = Number(app.match(/const ONLINE_TAKT_MAX_MS = (\d+)/)[1]), anw = Number(app.match(/const ANW_TAKT_MS = (\d+)/)[1]);
assert.ok(max < ONLINE_SEK * 1000 && anw <= max, `Takt ${max} ms < ${ONLINE_SEK} s`);
assert.ok(app.includes("Math.min(ONLINE_TAKT_MAX_MS, sparTakt("), "Sparmodus begrenzt");
// Fehler der Online-Meldung einmal je Sitzung sichtbar
assert.ok(app.includes('++ONL.fehlerFolge >= 2 && !ONL.fehlerGemeldet') && app.includes('fpNeu("api", { aktion: "online"'));
assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/online-jede-anfrage.test.mjs"), "läuft in der CI");
console.log("online-jede-anfrage: ok");
