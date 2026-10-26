// KC-CLUB-TEMPO-VERSAND / -HINTERGRUND / -SCHNECKE (26.10.2026, Wunsch Hansi „Bau 1 bis 4 ein“): statische Prüfung (offline, ohne Server).
// Aufruf: node tests/tempo-versand.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";

const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), server = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261026_kc_club_tempo_hintergrund.sql");
const fn = (kopf) => { const i = server.indexOf(kopf); assert.ok(i > 0, kopf); let d = 0; for (let k = server.indexOf("{", server.indexOf(")", i)); ; k++) { if (server[k] === "{") d++; if (server[k] === "}" && !--d) return server.slice(i, k + 1); } };

// 1. ❗ wichtig und @Erwähnung benachrichtigen im Hintergrund; Notfall, Express und Probe warten (die App zeigt dort das Ergebnis)
assert.ok(/const hinten = !notfall && !express && !probe;/.test(server), "Hintergrund-Versand auch für wichtig/Erwähnung");
// 2. Versanddienst in Stücken, begrenzt parallel, Kopie nur am ersten Stück, jedes Stück mit eigenem Fehlerfang
const roh = fn("async function routerSendenRoh(");
assert.ok(/const ROUTER_STUECK = 4, ROUTER_PARALLEL = 4, ROUTER_VERSATZ_MS = 300;/.test(server), "Stückgröße/Parallelität");
assert.ok(/i === 0 \? kopie : undefined/.test(roh) && /Math\.min\(ROUTER_PARALLEL, stuecke\.length\)/.test(roh), "Kopie nur einmal, höchstens ROUTER_PARALLEL gleichzeitig");
assert.ok(/\.catch\(\(e\) => \{ console\.error\("routerSenden Stück"/.test(roh) && /failed: stuecke\[i\]\.length/.test(roh), "gescheitertes Stück zählt als Fehler seiner Empfänger");
assert.ok(/vorgangKopie\(eventKey, personIds, vars, korrelation, ergebnis\)/.test(roh), "Vorgangs-Kopie einmal je Versand");
const auf = fn("async function routerAufruf(");
assert.ok(/AbortSignal\.timeout\(20000\)/.test(auf) && /if \(!r\.ok && !out\?\.sent && !out\?\.failed\) return \{ sent: 0, failed: personIds\.length/.test(auf), "Zeitlimit, Ablehnung = Fehler");
// 3. Hintergrundlast: Zugriffs-Wächter alle 5 Min., Link-Schwärzen nur letzte 3 Tage
assert.ok(/cron\.alter_job\(60, schedule => '2-59\/5 \* \* \* \*'\)/.test(mig), "Zugriffs-Wächter alle 5 Min.");
assert.ok(/created_at > now\(\) - interval '3 days'/.test(mig) && /'\?k=\[entfernt\]'/.test(mig) && /interval '2 days'/.test(mig), "Schwärzen: 3-Tage-Fenster, Regel wie bisher");
// 4. Schnecke: Server-Zeit jeder Antwort abziehen
assert.ok(/antwort\.headers\.set\("x-club-ms", String\(serverMs\)\)/.test(server) && /Access-Control-Expose-Headers", "x-club-ms"/.test(server), "Server meldet seine Zeit");
assert.ok(/Number\(j\?\.srvMs\) \|\| Number\(r\.headers\?\.get\?\.\("x-club-ms"\)\)/.test(app), "App zieht die Server-Zeit ab");
console.log("tempo-versand: alle Prüfungen bestanden");
