// 3.49.0 KC-CLUB-DP2-EIN-STAND (Hansi 27.11.2026: „Auf jeden Fall dürfen nicht zwei verschiedene Stände existieren“):
// Druckansicht, Morgengruß und Änderungs-Nachrichten nehmen die Dienstzeiten aus DP2; neue DP2-Stände melden sich von selbst.
// Aufruf: node tests/dp2-ein-stand.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const server = lies("supabase/functions/kc-club/index.ts"), app = lies("app.js");
const teil = (a, b) => server.slice(server.indexOf(a), server.indexOf(b));
// Umrechnung im Sandkasten
const code = teil("const dp2Std =", "async function dp2Plan(").replace(/: unknown|: any\[\]|: any|: Map<string, string>|: string|: number\[\]|<string, Map<string, \{ s: number\[\]; z: string \}>>|<string, \{ s: number\[\]; z: string \}>/g, "");
const { dpPlanAusDp2 } = new Function(code + "; return { dpPlanAusDp2 };")();
const basis = { von: 8, tage: [{ d: "2026-12-05", art: "Markttag", bedarf: [0, 0, 2, 2], ber: [{ n: "Bert B", p: "KC-P-B", s: [9, 10] }],
  leute: [{ n: "Anne A", p: "KC-P-A", s: [8, 10], w: "pppp", z: "vorne+hinten" }, { n: "Carl C", p: "KC-P-C", s: [9, 10], w: "--pp" }] }] };
const zeilen = [{ person_id: "KC-P-A", work_date: "2026-12-05", start_time: "09:00:00", end_time: "10:00:00", area: "Vorne", zone: "front" },
  { person_id: "KC-P-D", work_date: "2026-12-05", start_time: "09:00:00", end_time: "09:30:00", area: "Vorne/Hinten", zone: "neutral" },
  { person_id: "KC-P-A", work_date: "2026-12-06", start_time: "17:00:00", end_time: "23:00:00", area: "Hinten", zone: "back" }];
const p = dpPlanAusDp2(basis, zeilen, new Map([["KC-P-D", "Dora D"]]));
const t5 = p.tage.find((t) => t.d === "2026-12-05"), a = t5.leute.find((l) => l.p === "KC-P-A"), c = t5.leute.find((l) => l.p === "KC-P-C"), d = t5.leute.find((l) => l.p === "KC-P-D");
assert.deepEqual(a.s, [9, 10], "Zeit aus DP2, nicht aus dem Sollplan"); assert.equal(a.z, "vorne"); assert.equal(a.w, "pppp", "Wünsche bleiben");
assert.equal(c.s, null, "ohne DP2-Dienst kein Dienst"); assert.equal(c.w, "--pp", "Wünsche bleiben für den Wunschplan");
assert.deepEqual(d.s, [9, 9.5], "in DP2 neu eingeteilt → dabei"); assert.equal(d.n, "Dora D");
assert.deepEqual(t5.besetzt, [0, 0, 2, 1], "Besetzung neu gezählt"); assert.deepEqual(t5.fehlt, [0, 0, 0, 1], "Fehlt neu gezählt");
assert.deepEqual(t5.ber, basis.tage[0].ber, "Bereitschaft aus dem Gerüst (DP2 veröffentlicht keine)");
assert.ok(p.tage.some((t) => t.d === "2026-12-06" && t.leute[0].s[0] === 17), "Tage nur in DP2 kommen dazu");
// Verdrahtung
assert.ok(/wer = dpgHeute\(await dp2Plan\(f\?\.plan \?\? null\), heute\)/.test(server), "Morgengruß aus DP2");
assert.ok(/const plan0 = await dp2Plan\(f\.plan\);/.test(server), "Druckansicht aus DP2");
assert.ok(!/dpgAenderungenSenden\(altFrei\.plan, w/.test(server), "Freigabe verschickt keine Dienständerungen mehr");
const lauf = teil("async function dp2AenderungLauf()", "async function dpSollStand(");
assert.ok(/Date\.now\(\) - Date\.parse\(stand\) < 5 \* 60000/.test(lauf), "erst nach 5 Min. Ruhe");
assert.ok(lauf.indexOf('schluessel: "dpzwei_gesehen"') < lauf.indexOf("dpgAenderungenSenden") && /geaendert_von: "system"/.test(lauf) && /if \(me\) \{[^}]*return 0; \}/.test(lauf), "erst merken (mit Pflichtfeld), bei Fehler nichts senden");
// 3.51.0: kc_club_konfig erlaubt nur ^[a-z_]{2,40}$ – „dp2_gesehen“ (mit Ziffer) wurde abgelehnt
for (const k of [...server.matchAll(/from\("kc_club_konfig"\)[^\n]*?schluessel(?:", |: )"([^"]+)"/g)].map((m) => m[1])) assert.ok(/^[a-z_]{2,40}$/.test(k), "kc_club_konfig-Schlüssel erlaubt: " + k);
assert.ok(/"dpzwei_gesehen"/.test(lauf) && !/dp2_gesehen"/.test(server), "Schlüssel ohne Ziffer");
assert.ok(/await adminIds\(\)/.test(lauf) && /club-dp2-neu:\$\{stand\}/.test(lauf), "Hinweis an die Admins, je Stand einmal");
assert.ok(/await dp2AenderungLauf\(\)\.catch/.test(server), "läuft im Zeitplaner");
const ep = server.slice(server.indexOf('case "dp_einzelplan": {'), server.indexOf('case "dp_druck_rechnen": {'));
assert.ok(/const w: any = await dp2Plan\(plan\.wert\)/.test(ep) && /stunden: stundenDp2/.test(ep), "3.52.0: Mein Einzelplan aus DP2, Stunden aus DP2-Zeiten");
assert.ok(/Die Dienstzeiten kommen immer aus DP2/.test(app), "Hinweis in der App");
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/dp2-ein-stand.test.mjs"), "läuft in der CI");
console.log("dp2-ein-stand: ok");
