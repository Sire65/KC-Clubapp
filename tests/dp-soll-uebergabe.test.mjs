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

// ---- Beispielplan (Format dp_druck: tage[].leute[{n,z,w,s,p}], ber[]; p = person_id, beim Rechnen mitgeschrieben) ----
const plan = { v: 1, regel: 12, von: 8, bis: 23, stand: "2026-11-23T10:00:00Z", pids: 1, tage: [
  { d: "2026-12-02", art: "Aufbau", leute: [{ n: "Anna Muster", p: "KC-P-M0001", z: "", w: "", s: [8, 14] }, { n: "Ohne Dienst", p: "KC-P-M0009", z: "", w: "", s: null }], ber: [] },
  { d: "2026-12-04", art: "Markttag", leute: [
    { n: "Anna Muster", p: "KC-P-M0001", z: "vorne", w: "", s: [11, 17.5] },
    { n: "Bernd Beispiel", p: "KC-P-M0002", z: "hinten · nur mit anderen", w: "", s: [15, 23] },
    { n: "Carla Probe", p: "KC-P-M0003", z: "vorne+hinten", w: "", s: [17, 21] },
    { n: "Anne Müller", pm: ["KC-P-M0011", "KC-P-M0012"], z: "vorne", w: "", s: [12, 16] },   // Kurzname „Anne M“ doppelt → nicht eindeutig
    { n: "Fridbert Aus", p: "KC-P-M0004", z: "vorne", w: "", s: [12, 16] }], ber: [{ n: "Bernd Beispiel", s: [11, 15] }] },
  { d: "2026-12-14", art: "Nachbereitung", leute: [{ n: "Carla Probe", p: "KC-P-M0003", z: "", w: "", s: [8, 12] }], ber: [] },
  { d: "2026-12-20", art: "Markttag", leute: [{ n: "Anna Muster", p: "KC-P-M0001", z: "vorne", w: "", s: [11, 15] }], ber: [] } ] }; // kein veröffentlichter Tag
const tage = ["2026-12-02", "2026-12-04", "2026-12-14"];
const z = dpSollZeilen(plan, tage, { aus: ["KC-P-M0004", "KC-P-M0019"] });
assert.equal(DP_SOLL_VERTRAG, "KC_DP_SOLL_UEBERGABE_V1");
assert.equal(z.rows.length, 5, "nur Dienste an veröffentlichten Tagen mit eindeutiger Person, ohne „aus“");
assert.deepEqual(z.ohneId, ["Anne Müller"], "nicht eindeutige Person wird gemeldet, nicht übergeben");
const ue = (g) => z.uebersprungen.filter((u) => u.grund === g);
assert.deepEqual(ue("Person in der Club-App nicht eindeutig").map((u) => [u.date, u.personIds]), [["2026-12-04", ["KC-P-M0011", "KC-P-M0012"]]], "Kandidaten gehen mit");
assert.deepEqual(ue("Tag nicht veröffentlicht").map((u) => [u.date, u.personId]), [["2026-12-20", "KC-P-M0001"]]);
assert.deepEqual(ue("In der Club-App ausgenommen").map((u) => [u.date, u.personId]), [["2026-12-04", "KC-P-M0004"], [null, "KC-P-M0019"]], "„aus“ nie übergeben, DP2 löscht nichts von selbst");
assert.ok(!z.rows.some((r) => r.personId === "KC-P-M0004"));
assert.equal(dpSollZeilen({ tage: [{ d: "2026-12-04", art: "Markttag", leute: [{ n: "Anna Muster", z: "vorne", s: [11, 15] }] }] }, tage).rows.length, 0, "ohne mitgeschriebene ID nie per Name raten");
// KC-DP-SOLL-BEREITSCHAFT (24.11.2026): Bereitschaft als eigene Liste – nicht als Dienst
assert.deepEqual(z.bereitschaft, [{ importKey: "CLUB-B-2026-12-04-KC-P-M0002", personId: "KC-P-M0002", name: "Bernd Beispiel", date: "2026-12-04", start: 11, end: 15 }],
  "Bereitschaft geht mit (Person aus den Dienstzeilen desselben Plans)");
assert.ok(!z.rows.some((r) => r.area === "Bereitschaft" || r.personId === "KC-P-M0002" && r.start === 11), "… aber nicht als Dienst");
{ const b = structuredClone(plan); b.tage[1].ber = [{ n: "Bernd Beispiel", p: "KC-P-M0002", s: [11, 15] }, { n: "Bernd Beispiel", p: "KC-P-M0002", s: [16, 18] },
    { n: "Fridbert Aus", s: [18, 23] }, { n: "Niemand Bekannt", s: [18, 23] }, { n: "Anne Müller", s: [18, 23] }];
  b.tage[3].ber = [{ n: "Anna Muster", p: "KC-P-M0001", s: [20, 23] }];
  const zb = dpSollZeilen(b, tage, { aus: ["KC-P-M0004"] });
  assert.deepEqual(zb.bereitschaft.map((r) => r.importKey), ["CLUB-B-2026-12-04-KC-P-M0002"], "je Person und Tag eine; aus/unbekannt/mehrdeutig/unveröffentlicht nie");
  const ub = zb.uebersprungen.filter((u) => u.typ === "bereitschaft").map((u) => [u.name, u.grund]);
  assert.deepEqual(ub, [["Fridbert Aus", "In der Club-App ausgenommen"], ["Niemand Bekannt", "Person in der Club-App nicht eindeutig"], ["Anne Müller", "Person in der Club-App nicht eindeutig"], ["Anna Muster", "Tag nicht veröffentlicht"]]);
  assert.ok(zb.ohneId.includes("Niemand Bekannt"), "nie per Name raten, wenn der Plan die Person nicht eindeutig kennt"); }
for (const r of z.bereitschaft) { assert.deepEqual(Object.keys(r).sort(), ["date", "end", "importKey", "name", "personId", "start"]); assert.equal(r.importKey, `CLUB-B-${r.date}-${r.personId}`); }
{ const hb = (zz) => createHash("sha256").update(dpSollKanonisch(zz.rows, zz.bereitschaft)).digest("hex");
  assert.equal(dpSollKanonisch(z.rows, []), dpSollKanonisch(z.rows), "ohne Bereitschaft dieselbe Prüfsumme wie bisher");
  assert.notEqual(hb(z), createHash("sha256").update(dpSollKanonisch(z.rows)).digest("hex"), "Bereitschaft gehört zur Prüfsumme");
  const b2 = structuredClone(plan); b2.tage[1].ber[0].s = [12, 15]; assert.notEqual(hb(dpSollZeilen(b2, tage, { aus: ["KC-P-M0004", "KC-P-M0019"] })), hb(z), "geänderte Bereitschaft → neue Übergabe"); }
assert.ok(/dpSollKanonisch\(z\.rows, z\.bereitschaft\)/.test(server) && /bereitschaft: s\.bereitschaft, uebersprungen/.test(server), "Server legt Bereitschaft mit ab");
assert.ok(/for \(const b of \(t\.ber \|\| \[\]\) as any\[\]\) \{ const pid = pidVon\.get\(b\.n\); if \(pid\) b\.p = pid; \}/.test(server), "ber[].p beim Rechnen");
assert.ok(/ber: \(Array\.isArray\(t\.ber\) \? t\.ber : \[\]\)\.map\(\(\{ p: _p, \.\.\.rest \}: any\) => rest\)/.test(server), "ber[].p nicht an Mitglieder");
{ const sql2 = fs.readFileSync(new URL("../supabase/migrations/20261124_kc_dp_soll_bereitschaft.sql", import.meta.url), "utf8");
  assert.ok(/add column if not exists bereitschaft jsonb not null default '\[\]'::jsonb/.test(sql2) && /'bereitschaft', u\.bereitschaft/.test(sql2), "Spalte + Abruf");
  assert.ok(/if \(select auth\.uid\(\)\) is null then raise exception/.test(sql2) && /m\.role in \('admin', 'planner', 'duty_manager'\)/.test(sql2) && /revoke all on function public\.kc_dp_soll_uebergabe_pending\(text, text\) from public, anon;/.test(sql2), "Prüfungen bleiben"); }
// DP2-Schichtschema (src/core/model.js): personId KC-P-…, date YYYY-MM-DD, start/end Stunden als Zahl, zone front|back|neutral, area Text, breakMinutes
for (const r of z.rows) {
  assert.deepEqual(Object.keys(r).sort(), ["area", "breakMinutes", "date", "end", "importKey", "name", "personId", "start", "zone"]);
  assert.match(r.personId, /^KC-P-[A-Z0-9-]+$/); assert.match(r.date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(typeof r.start, "number"); assert.equal(typeof r.end, "number"); assert.ok(r.end > r.start);
  assert.ok(["front", "back", "neutral"].includes(r.zone)); assert.equal(typeof r.area, "string"); assert.ok(r.area.length > 0);
  assert.equal(r.importKey, `CLUB-${r.date}-${r.personId}`, "stabiler importKey");
}
const an = (d, pid) => z.rows.find((r) => r.date === d && r.personId === pid);
assert.deepEqual([an("2026-12-04", "KC-P-M0001").zone, an("2026-12-04", "KC-P-M0002").zone, an("2026-12-04", "KC-P-M0003").zone], ["front", "back", "neutral"], "Zone aus vorne/hinten (vorne+hinten → neutral)");
assert.deepEqual([an("2026-12-02", "KC-P-M0001").zone, an("2026-12-02", "KC-P-M0001").area, an("2026-12-14", "KC-P-M0003").area], ["neutral", "Vorbereitung", "Nachbereitung"]);
// Pause wie DP2 (breaks.js KC_STANDARD: über 6 Std. 30 Min., über 9 Std. 45 Min.)
assert.deepEqual([dpSollPause(6), dpSollPause(6.5), dpSollPause(9), dpSollPause(9.5), dpSollPause(4)], [0, 30, 30, 45, 0]);
assert.equal(an("2026-12-04", "KC-P-M0001").breakMinutes, 30); assert.equal(an("2026-12-04", "KC-P-M0002").breakMinutes, 30); assert.equal(an("2026-12-04", "KC-P-M0003").breakMinutes, 0);
// stabil: gleicher Plan → gleiche Zeilen und Prüfsumme; Namensänderung ändert die Prüfsumme nicht; geänderte Zeit schon
const h = (rows) => createHash("sha256").update(dpSollKanonisch(rows)).digest("hex");
assert.equal(h(dpSollZeilen(plan, tage, { aus: ["KC-P-M0004"] }).rows), h(z.rows), "idempotent");
assert.equal(h(z.rows.map((r) => ({ ...r, name: "x" }))), h(z.rows), "Name gehört nicht zur Prüfsumme");
assert.equal(h([...z.rows].reverse()), h(z.rows), "Reihenfolge egal");
const plan2 = structuredClone(plan); plan2.tage[1].leute[0].s = [11, 16];
assert.notEqual(h(dpSollZeilen(plan2, tage).rows), h(z.rows), "geänderte Zeit → neue Prüfsumme");
// je Person und Tag nur ein Dienst
const doppelt = structuredClone(plan); doppelt.tage[1].leute.push({ n: "Anna Muster", p: "KC-P-M0001", z: "vorne", s: [18, 20] });
assert.equal(dpSollZeilen(doppelt, tage).rows.filter((r) => r.importKey === "CLUB-2026-12-04-KC-P-M0001").length, 1);
const test = structuredClone(plan); test.tage[1].leute[0].p = "KC-P-TEST01";
assert.ok(!dpSollZeilen(test, tage).rows.some((r) => r.personId.startsWith("KC-P-TEST")), "Testkonten nie");

// ---- Server: nur Admin, Nachreichen nur bei geänderter Prüfsumme, nie den Plan aufhalten ----
const fall = server.slice(server.indexOf('case "dp_soll_uebergeben": {'), server.indexOf('case "dp_plaene": {'));
assert.ok(fall.length > 500 && /case "dp_soll_uebergeben": \{\s*nurAdmin\(ich\);/.test(fall), "nur Admin");
assert.ok(/if \(letzte && letzte\.pruefsumme === s\.pruefsumme\) return json\(\{ \.\.\.info, ok: true, unveraendert: true \}\);/.test(fall), "gleicher Stand → nichts Neues");
assert.ok(/p\.stand !== String\(w\.stand \|\| ""\)/.test(fall), "Stand muss zur Rückfrage passen");
assert.ok(/await dpSollNachreichen\(adminId, wert\)\.catch\(/.test(server), "Nachreichen nach jeder Neuberechnung, Fehler halten den Plan nicht auf");
const nach = server.slice(server.indexOf("async function dpSollNachreichen("), server.indexOf("// welche Wunschpläne seit dem letzten Rechnen"));
assert.ok(/if \(!w\?\.pids\) return;/.test(nach) && /letzte\.pruefsumme === s\.pruefsumme\) return;/.test(nach), "nur wenn an und geändert");
assert.ok(/update\(\{ status: "verworfen" \}\)[^;]*\.eq\("status", "offen"\)/.test(server), "ältere offene → verworfen");
assert.ok(!/kc_dp_plan_publish|kc_dp_plan_published"\)\.(insert|update|upsert)/.test(nach), "schreibt nie direkt in den veröffentlichten Plan");

// Personen-ID beim Rechnen mitschreiben – nur bei eindeutigem Kurznamen; nicht an Mitglieder herausgeben
assert.ok(/if \(alle\.size === 1\) pidVon\.set\(n, pid\); else mehrdeutig\.set\(n, \[\.\.\.alle\]\);/.test(server) && /const pid = pidVon\.get\(p\.n\); if \(pid\) p\.p = pid; else if \(mehrdeutig\.has\(p\.n\)\) p\.pm = mehrdeutig\.get\(p\.n\);/.test(server), "p/pm beim Rechnen");
assert.ok(/gerechnet: "club-server", pids: 1 \};/.test(server));
const plaene = server.slice(server.indexOf('case "dp_plaene": {'), server.indexOf('case "dp_druck": {'));
assert.ok(/map\(\(\{ p: _p, pm: _pm, \.\.\.rest \}: any\) => rest\)/.test(plaene), "Mitglieder bekommen keine Personen-IDs");
// mehrere Admins: nur der Plan des Admins, der übergeben hat, reicht nach
assert.ok(/if \(a\?\.an !== true \|\| a\.von !== adminId\) return;/.test(nach), "nur der übergebende Admin");
assert.ok(/wert: \{ an: p\.auto, von: ich\.person_id \}/.test(fall) && /wert: \{ an: true, von: ich\.person_id \}/.test(fall));
// Datenverkehr: Prüfen beim Öffnen rechnet nie neu, nur der Knopf (aktuell: true)
assert.ok(/if \(p\.pruefen === true && p\.aktuell === true && \(!w\?\.pids \|\| await dpDruckVeraltet/.test(fall) && (fall.match(/dpDruckNeu\(/g) || []).length === 1, "nur mit aktuell neu rechnen");
assert.ok(/api\("dp_soll_uebergeben", \{ pruefen: true \}\)/.test(app) && /api\("dp_soll_uebergeben", \{ pruefen: true, aktuell: true \}/.test(app));
// übersprungene Zeilen gehen mit (DP2 zeigt den Grund und behält)
assert.ok(/uebersprungen: s\.uebersprungen/.test(server) && /'uebersprungen', u\.uebersprungen/.test(sql));

// ---- App: Knopf, Rückfrage, Erfolgsmeldung ----
assert.ok(app.includes('onclick="dpdSollUebergeben(this)">📤 An DP2 übergeben</button>'), "Knopf beim berechneten Plan");
assert.ok(app.includes("Schichten an DP2 übergeben? In DP2 erscheinen sie zur Übernahme – erst dort übernehmen, wenn der Plan fertig ist, danach stehen sie sofort auf der Kasse."), "Rückfrage");
assert.ok(/Schichten\$\{e\.bereitschaft \? ` und \$\{e\.bereitschaft\} × Bereitschaft` : ""\} an DP2 übergeben – in DP2 unter Sollplan/.test(app), "Erfolgsmeldung (mit Bereitschaft)");
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
