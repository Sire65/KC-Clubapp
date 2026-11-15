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
// KC-CLUB-OFFLINE-SCHNELL (Wunsch Hansi 15.11.2026 „schneller die Push, wenn jemand die App verlassen hat“): nach „weg“ 1 Minute warten, dann melden
{
  const nw = srv.slice(srv.indexOf("async function offlineNachWeg("), srv.indexOf("\n}\n", srv.indexOf("async function offlineNachWeg(")));
  assert.ok(srv.includes("const OFFLINE_WEG_MS = 60000;") && nw.includes("setTimeout(r, OFFLINE_WEG_MS)"), "1 Minute nach dem Verlassen");
  assert.ok(nw.includes("w.weg !== weg || !istWeg(w) || w.offline === w.seit) return;"), "nicht, wenn wieder da, neu weggelegt oder schon gemeldet");
  assert.ok(nw.includes('.eq("wert->>weg", weg).eq("wert->>seit", w.seit).select("person_id")') && nw.includes("if (!ok?.length) return;"), "erst vermerken (nur wenn unverändert), dann melden");
  assert.ok(nw.includes("await offlinePushMelden(pid, w.seit, weg);"), "gleiche Regeln und gleicher Schlüssel wie der 5-Minuten-Lauf (club-offline:<pid>:<seit>) – nichts doppelt");
  const wc = srv.slice(srv.indexOf('case "weg": {'), srv.indexOf('case "online": {'));
  assert.ok(/const weg = await wegMerken\(ich\.person_id\);/.test(wc) && /if \(!ich\.person_id\.startsWith\("KC-P-TEST"\)\) nebenbei\(offlineNachWeg\(ich\.person_id, weg\)\.catch\(/.test(wc), "„weg“ stößt es im Hintergrund an, nur echte Mitglieder");
  assert.ok(/const weg = jetzt\(\);[\s\S]{0,200}wert: \{ \.\.\.\(data\?\.wert \|\| \{\}\), weg \}[\s\S]{0,120}return weg;/.test(srv), "wegMerken gibt den Zeitpunkt zurück");
  // Ablauf nachspielen
  const istWeg = (w) => !!w?.weg && Date.parse(w.weg) >= (Date.parse(w.zuletzt || "") || 0);
  const lauf = async (zeile, weg) => {
    const gesendet = [], vermerkt = [];
    const db = { from: () => { const q = { _upd: null, select() { return q; }, eq() { return q; }, update(x) { q._upd = x; return q; },
      maybeSingle: async () => ({ data: zeile }), then(f) { if (q._upd) vermerkt.push(q._upd); return Promise.resolve({ data: q._upd ? [{}] : null }).then(f); } }; return q; } };
    const code = nw.replace("await new Promise((r) => setTimeout(r, OFFLINE_WEG_MS));", "").replace("(pid: string, weg: string)", "(pid, weg)");
    await new Function("db", "istWeg", "offlinePushMelden", "OFFLINE_WEG_MS", code + "\n}\nreturn offlineNachWeg;")(db, istWeg, async (...a) => gesendet.push(a), 0)("P1", weg);
    return { gesendet, vermerkt };
  };
  const W = "2026-11-15T12:00:00.000Z";
  let r = await lauf({ wert: { seit: "2026-11-15T11:40:00.000Z", zuletzt: "2026-11-15T11:59:50.000Z", weg: W } }, W);
  assert.deepEqual(r.gesendet, [["P1", "2026-11-15T11:40:00.000Z", W]], "weggelegt und nicht zurück → Meldung mit Zeit des Verlassens");
  r = await lauf({ wert: { seit: "2026-11-15T12:00:30.000Z", zuletzt: "2026-11-15T12:00:40.000Z" } }, W);
  assert.equal(r.gesendet.length, 0, "zurückgekommen (neue Sitzung) → nichts");
  r = await lauf({ wert: { seit: "2026-11-15T11:40:00.000Z", zuletzt: "2026-11-15T11:59:50.000Z", weg: W, offline: "2026-11-15T11:40:00.000Z" } }, W);
  assert.equal(r.gesendet.length, 0, "schon gemeldet → nichts");
  r = await lauf({ wert: { seit: "2026-11-15T11:40:00.000Z", zuletzt: "2026-11-15T12:00:20.000Z", weg: "2026-11-15T12:00:50.000Z" } }, W);
  assert.equal(r.gesendet.length, 0, "inzwischen neu weggelegt → der neue Lauf meldet");
}
console.log("offline-push schnell: ok");
