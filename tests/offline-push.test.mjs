// KC-CLUB-OFFLINE-PUSH (Wunsch Hansi 04.11.2026). Aufruf: node tests/offline-push.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const srv = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const lauf = srv.slice(srv.indexOf("async function offlinePushLauf()"), srv.indexOf("async function offlinePushMelden("));
const meld = srv.slice(srv.indexOf("async function offlinePushMelden("), srv.indexOf("async function offlinePushMelden(") + 1400);
assert.ok(lauf.includes('.eq("schluessel", "online_seit").gte("wert->>zuletzt", von).lte("wert->>zuletzt", bis).limit(40)'), "eine Abfrage je Lauf");
assert.ok(lauf.includes("x.wert.offline !== x.wert.seit") && lauf.includes('.eq("wert->>zuletzt", x.wert.zuletzt)'), "je Sitzung nur einmal, nicht wenn sich inzwischen etwas getan hat");
assert.ok(srv.includes("const OFFLINE_WARTE_MS = 3 * 60000, OFFLINE_TAKT_MIN = 5;") && lauf.includes("ONLINE_SEK * 1000 - OFFLINE_WARTE_MS"), "kurzes Weglegen löst nichts aus");
assert.ok(meld.includes("onlineZeigenMap([pid])") && meld.includes("inkognitoSet([pid])") && meld.includes("await onlinePushEmpfaenger(pid)"), "gleiche Regeln wie online");
assert.ok(meld.includes('routerSenden("club_online"') && meld.includes("🔴 ${name} ist offline"), "Push wie online, nur Push");
assert.ok(srv.includes("const offline = new Date().getUTCMinutes() % OFFLINE_TAKT_MIN === 0 ? await offlinePushLauf().catch("), "Server: jede 5. Minute (passt zum Zeitplan)");
const mig = fs.readFileSync(new URL("../supabase/migrations/20261104_kc_club_offline_push_zeitplan.sql", import.meta.url), "utf8");
assert.ok(mig.includes("extract(minute from now())::int % 5 = 0") && mig.includes("interval '330 seconds'") && mig.includes("kc_club_wecker") && mig.includes("kc_club_geplant"), "Zeitplan: jede 5. Minute, nur bei Bedarf, alles Bisherige bleibt");
console.log("offline-push: ok");
