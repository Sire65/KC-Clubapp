// KC-CLUB-ZULETZT-WEG (17.11.2026, Fund Hansi „warum wird bei Wilfried online angezeigt“): „zuletzt da“ zeigt nicht „🟢 online“, wenn das Mitglied
// die App weggelegt hat („weg“) – wie onlineJetzt (KC-CLUB-ONLINE-ECHT). Aufruf: node tests/zuletzt-weg.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const srv = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const f = srv.slice(srv.indexOf("async function zuletztDaMap("), srv.indexOf("\n}\n", srv.indexOf("async function zuletztDaMap(")));
assert.ok(f.includes("const online = Date.now() - t < ONLINE_SEK * 1000 && !istWeg(osRoh)"), "weg zählt nicht als online");
assert.ok(f.includes("const os = online ? osRoh : null;"), "„online seit“ nur, wenn wirklich online");
// istWeg nachspielen
const istWeg = new Function(srv.slice(srv.indexOf("const istWeg = "), srv.indexOf("\n", srv.indexOf("const istWeg = "))).replace(": any", "") + "\nreturn istWeg;")();
assert.equal(istWeg({ zuletzt: "2026-11-17T08:08:25.592Z", weg: "2026-11-17T08:08:38.178Z" }), true, "Wilfried 9:08:25 → weg 9:08:38: nicht online");
assert.equal(istWeg({ zuletzt: "2026-11-17T08:09:00Z", weg: "2026-11-17T08:08:38Z" }), false, "danach wieder sichtbar: online");
assert.equal(istWeg({ zuletzt: "2026-11-17T08:09:00Z" }), false, "ohne weg: wie bisher");
console.log("✅ zuletzt-weg: alle Prüfungen bestanden");
