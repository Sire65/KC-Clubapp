// KC-DP-SOLL-UEBERGABE (Hansi 23.11.2026): gerechneten Sollplan mit einem Tipp an DP2 übergeben; ändert sich der Plan, wird von selbst
// eine neue Übergabe angeboten (nur wenn sich die Zeilen wirklich ändern). Prüft das Zeilenformat (DP2-Schichtschema), den stabilen importKey,
// die Pause wie DP2, „keine Bereitschaft“, die Prüfsumme, nur Admin und die Migration (RLS, Rechte, Prüfregister).
// Aufruf: node tests/dp-soll-uebergabe.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { dpSollZeilen, dpSollKanonisch, dpSollPause, DP_SOLL_VERTRAG } from "../supabase/functions/kc-club/dp-rechnen.js";
import { programmText } from "./programm.mjs";
const app = programmText();
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const sql = fs.readFileSync(new URL("../supabase/migrations/20261123_kc_dp_soll_uebergabe.sql", import.meta.url), "utf8");
const ci = fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8");

// ---- Beispielplan (Format dp_druck: tage[].leute[{n,z,w,s}], ber[]) ----
const plan = { v: 1, regel: 12, von: 8, bis: 23, stand: "2026-11-23T10:00:00Z", tage: [
  { d: "2026-12-02", art: "Aufbau", leute: [{ n: "Anna Muster", z: "", w: "", s: [8, 14] }, { n: "Ohne Dienst", z: "", w: "", s: null }], ber: [] },
  { d: "2026-12-04", art: "Markttag", leute: [
    { n: "Anna Muster", z: "vorne", w: "", s: [11, 17.5] },
    { n: "Bernd Beispiel", z: "hinten · nur mit anderen", w: "", s: [15, 23] },
    { n: "Carla Probe", z: "vorne+hinten", w: "", s: [17, 21] },
    { n: "Unbekannt Neu", z: "vorne", w: "", s: [12, 16] }], ber: [{ n: "Bernd Beispiel", s: [11, 15] }] },
  { d: "2026-12-14", art: "Nachbereitung", leute: [{ n: "Carla Probe", z: "", w: "", s: [8, 12] }], ber: [] },
  { d: "2026-12-20", art: "Markttag", leute: [{ n: "Anna Muster", z: "vorne", w: "", s: [11, 15] }], ber: [] } ] }; // kein Veranstaltungstag
const ids = new Map([["Anna Muster", "KC-P-M0001"], ["Bernd Beispiel", "KC-P-M0002"], ["Carla Probe", "KC-P-M0003"]]);
const tage = ["2026-12-02", "2026-12-04", "2026-12-14"];
const z = dpSollZeilen(plan, ids, tage);
assert.equal(DP_SOLL_VERTRAG, "KC_DP_SOLL_UEBERGABE_V1");
assert.equal(z.rows.length, 5, "nur Dienste an Veranstaltungstagen mit eindeutiger Person");
assert.deepEqual(z.ohneId, ["Unbekannt Neu"], "unbekannte Person wird gemeldet, nicht übergeben");
assert.equal(z.bereitschaft, 1, "Bereitschaft wird gezählt …");
assert.ok(!z.rows.some((r) => r.area === "Bereitschaft" || r.personId === "KC-P-M0002" && r.start === 11), "… aber nicht übergeben");
// DP2-Schichtschema (src/core/model.js): personId KC-P-…, date YYYY-MM-DD, start/end Stunden als Zahl, zone front|back|neutral, area Text, breakMinutes
for (const r of z.rows) {
  assert.deepEqual(Object.keys(r).sort(), ["area", "breakMinutes", "date", "end", "importKey", "name", "personId", "start", "zone"]);
  assert.match(r.personId, /^KC-P-[A-Z0-9-]+$/); assert.match(r.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(typeof r.start, "number"); assert.equal(typeof r.end, "number"); assert.ok(r.end > r.start);
  assert.ok(["front", "back", "neutral"].includes(r.zone)); assert.equal(typeof r.area, "string"); assert.ok(r.area.length > 0);
  assert.equal(r.importKey, `CLUB-${r.date}-${r.personId}`, "stabiler importKey");
}
const an = (d, pid) => z.rows.find((r) => r.date === d && r.personId === pid);
assert.deepEqual([an("2026-12-04", "KC-P-M0001").zone, an("2026-12-04", "KC-P-M0002").zone, an("2026-12-04", "KC-P-M0003").zone], ["front", "back", "neutral"], "Zone aus vorne/hinten");
assert.deepEqual([an("2026-12-02", "KC-P-M0001").zone, an("2026-12-02", "KC-P-M0001").area, an("2026-12-14", "KC-P-M0003").area], ["neutral", "Vorbereitung", "Nachbereitung"]);
// Pause wie DP2 (breaks.js KC_STANDARD: über 6 Std. 30 Min., über 9 Std. 45 Min.)
assert.deepEqual([dpSollPause(6), dpSollPause(6.5), dpSollPause(9), dpSollPause(9.5), dpSollPause(4)], [0, 30, 30, 45, 0]);
assert.equal(an("2026-12-04", "KC-P-M0001").breakMinutes, 30); assert.equal(an("2026-12-04", "KC-P-M0002").breakMinutes, 30); assert.equal(an("2026-12-04", "KC-P-M0003").breakMinutes, 0);
// stabil: gleicher Plan → gleiche Zeilen und Prüfsumme; Namensänderung ändert die Prüfsumme nicht; geänderte Zeit schon
const h = (rows) => createHash("sha256").update(dpSollKanonisch(rows)).digest("hex");
assert.equal(h(dpSollZeilen(plan, ids, tage).rows), h(z.rows), "idempotent");
assert.equal(h(z.rows.map((r) => ({ ...r, name: "x" }))), h(z.rows), "Name gehört nicht zur Prüfsumme");
assert.equal(h([...z.rows].reverse()), h(z.rows), "Reihenfolge egal");
const plan2 = structuredClone(plan); plan2.tage[1].leute[0].s = [11, 16];
assert.notEqual(h(dpSollZeilen(plan2, ids, tage).rows), h(z.rows), "geänderte Zeit → neue Prüfsumme");
// je Person und Tag nur ein Dienst
const doppelt = structuredClone(plan); doppelt.tage[1].leute.push({ n: "Anna Muster", z: "vorne", s: [18, 20] });
assert.equal(dpSollZeilen(doppelt, ids, tage).rows.filter((r) => r.importKey === "CLUB-2026-12-04-KC-P-M0001").length, 1);
assert.equal(dpSollZeilen(plan, new Map([["Anna Muster", "KC-P-TEST01"]]), tage).rows.length, 0, "Testkonten nie");

// ---- Server: nur Admin, Nachreichen nur bei geänderter Prüfsumme, nie den Plan aufhalten ----
const fall = server.slice(server.indexOf('case "dp_soll_uebergeben": {'), server.indexOf('case "dp_plaene": {'));
assert.ok(fall.length > 500 && /case "dp_soll_uebergeben": \{\s*nurAdmin\(ich\);/.test(fall), "nur Admin");
assert.ok(/if \(letzte && letzte\.pruefsumme === s\.pruefsumme\) return json\(\{ \.\.\.info, ok: true, unveraendert: true \}\);/.test(fall), "gleicher Stand → nichts Neues");
assert.ok(/p\.stand !== String\(w\.stand \|\| ""\)/.test(fall), "Stand muss zur Rückfrage passen");
assert.ok(/await dpSollNachreichen\(adminId, wert\)\.catch\(/.test(server), "Nachreichen nach jeder Neuberechnung, Fehler halten den Plan nicht auf");
const nach = server.slice(server.indexOf("async function dpSollNachreichen("), server.indexOf("// welche Wunschpläne seit dem letzten Rechnen"));
assert.ok(/if \(\(await dpSollAuto\(\)\) !== true\) return;/.test(nach) && /letzte\.pruefsumme === s\.pruefsumme\) return;/.test(nach), "nur wenn an und geändert");
assert.ok(/update\(\{ status: "verworfen" \}\)[^;]*\.eq\("status", "offen"\)/.test(server), "ältere offene → verworfen");
assert.ok(!/kc_dp_plan_publish|kc_dp_plan_published"\)\.(insert|update|upsert)/.test(nach), "schreibt nie direkt in den veröffentlichten Plan");

// ---- App: Knopf, Rückfrage, Erfolgsmeldung ----
assert.ok(app.includes('onclick="dpdSollUebergeben(this)">📤 An DP2 übergeben</button>'), "Knopf beim berechneten Plan");
assert.ok(app.includes("Schichten an DP2 übergeben? In DP2 erscheinen sie zur Übernahme – erst dort übernehmen, wenn der Plan fertig ist, danach stehen sie sofort auf der Kasse."), "Rückfrage");
assert.ok(/Schichten an DP2 übergeben – in DP2 unter Sollplan/.test(app), "Erfolgsmeldung");
assert.ok(/Änderungen automatisch nachreichen/.test(app) && /api\("dp_soll_uebergeben", \{ auto: !!box\.checked \}\)/.test(app), "Nachreichen an/aus");

// ---- Migration ----
assert.ok(/alter table public\.kc_dp_soll_uebergabe enable row level security/.test(sql));
assert.ok(/revoke all on public\.kc_dp_soll_uebergabe from public, anon, authenticated/.test(sql));
assert.ok(/grant select, insert, update, delete on public\.kc_dp_soll_uebergabe to service_role/.test(sql));
for (const f of ["kc_dp_soll_uebergabe_pending\\(text, text\\)", "kc_dp_soll_uebergabe_ack\\(uuid, text, jsonb\\)"]) {
  assert.ok(new RegExp(`revoke all on function public\\.${f} from public, anon;`).test(sql), f + " ohne anon");
  assert.ok(new RegExp(`grant execute on function public\\.${f} to authenticated;`).test(sql), f + " für DP2");
}
assert.equal((sql.match(/if \(select auth\.uid\(\)\) is null then raise exception/g) || []).length, 2, "beide prüfen die Anmeldung");
assert.equal((sql.match(/m\.role in \('admin', 'planner', 'duty_manager'\)/g) || []).length, 2, "beide prüfen die DP-Planungsrolle");
assert.ok(/check \(status in \('offen', 'uebernommen', 'verworfen'\)\)/.test(sql) && /p_status not in \('uebernommen', 'verworfen'\)/.test(sql));
assert.ok(/'kc_dp_soll_uebergabe_pending'/.test(sql) && /'kc_dp_soll_uebergabe_ack'/.test(sql) && /security_definer_authenticated_execute/.test(sql), "Prüfregister");
assert.ok(ci.includes("node tests/dp-soll-uebergabe.test.mjs"), "läuft in der CI");
console.log("dp-soll-uebergabe: ok");
