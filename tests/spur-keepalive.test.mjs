// KC-CLUB-SPUR-KEEPALIVE (26.10.2026, Fund Hansi „Klaus hat laut Wegen nur die App geöffnet“): statische Prüfung (offline).
// Aufruf: node tests/spur-keepalive.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs"; // 2.727.0 KC-CLUB-TEILE: app.js + teile/*.js
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), server = lies("supabase/functions/kc-club/index.ts");
const f = app.slice(app.indexOf("async function spurSenden("), app.indexOf("function spurBaldSenden("));
assert.ok(/if \(schliessen === true && KEY && !NOT\.an\)/.test(f) && /keepalive: true/.test(f) && /signal: zeitSignal\(10000\)/.test(f), "beim Schließen mit keepalive und Zeitgrenze");
assert.ok(/if \(!r\.ok\) throw new Error\("spur"\);/.test(f) && /SPUR = SPUR\.slice\(teil\.length\); spurSchreiben\(\);/.test(f), "nur bei Erfolg vom Gerät löschen");
assert.ok(/if \(document\.hidden\) spurSenden\(true\);/.test(app) && /window\.addEventListener\("pagehide", \(\) => spurSenden\(true\)\);/.test(app), "beim Verlassen/Schließen");
assert.ok(/const k = `\$\{x\.p\}\|\$\{x\.t\}\|\$\{x\.w\}\|\$\{x\.mit \?\? ""\}`; if \(this\.has\(k\)\) return false;/.test(server), "Server zeigt doppelt gesendete Schritte nur einmal");
console.log("spur-keepalive: alle Prüfungen bestanden");
