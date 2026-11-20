// KC-CLUB-SB-REGION (Wunsch Hansi 20.11.2026 nach dem Supabase-Check): die Störungsseite (seit 08.10.2026 bei incident.io) listet einzelne Regionen –
// gelb nur noch bei Störung unserer Region (eu-west-2, London) oder ohne Regionsangabe. Aufruf: node tests/sb-region.test.mjs (offline)
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const code = app.slice(app.indexOf("const SB_REGION ="), app.indexOf('let DIAG_TEXT = "";'));
const { sbStatus } = new Function(code + "; return { sbStatus };")();
const ok = { status: { indicator: "none", description: "All Systems Operational" }, components: [{ name: "ap-east-1", status: "operational" }] };
assert.equal(sbStatus(ok).gelb, false); assert.match(sbStatus(ok).text, /alles in Ordnung/);
// Störung nur in Hongkong → nicht gelb, Hinweis „läuft“
const fremd = { status: { indicator: "minor", description: "Partially Degraded Service" }, components: [{ name: "ap-east-1", status: "degraded_performance" }] };
assert.equal(sbStatus(fremd).gelb, false); assert.match(sbStatus(fremd).text, /unsere Region \(London\) läuft – Störung nur anderswo \(ap-east-1\)/);
// Störung in London → gelb
const unser = { status: { indicator: "major", description: "Major Outage" }, components: [{ name: "eu-west-2", status: "major_outage" }, { name: "us-east-1", status: "major_outage" }] };
assert.equal(sbStatus(unser).gelb, true); assert.match(sbStatus(unser).text, /meldet: Major Outage · betroffen: eu-west-2, us-east-1/);
// Störung ohne Regionsangabe (z. B. „Dashboard“, „Auth“) → gelb wie bisher
const ohne = { status: { indicator: "minor", description: "Minor" }, components: [{ name: "Auth", status: "partial_outage" }] };
assert.equal(sbStatus(ohne).gelb, true);
// Wartung: nur unsere Region als Hinweis; eu-central-2 nicht
const w = { ...ok, scheduled_maintenances: [{ name: "Scheduled maintenance: Shared Pooler (Supavisor), eu-central-2" }, { name: "Scheduled maintenance: Storage, eu-west-2" }] };
assert.match(sbStatus(w).text, /🛠️ Scheduled maintenance: Storage, eu-west-2/); assert.doesNotMatch(sbStatus(w).text, /eu-central-2/);
// altes Format (Statuspage mit incidents) geht weiter
assert.match(sbStatus({ ...ohne, incidents: [{ name: "Auth-Störung" }] }).text, /· Auth-Störung/);
assert.equal(sbStatus({}).gelb, false);
// alle drei Stellen nutzen denselben Baustein
assert.equal((app.match(/sbStatus\(/g) || []).length >= 4, true, "Diagnose, Admin-Zeile, Admin-Fenster nutzen sbStatus");
assert.ok(!/\(j\.incidents \|\| \[\]\)\.map\(\(i\) => i\.name\), vorf/.test(app), "alte Auswertung ersetzt");
console.log("✅ sb-region: alle Prüfungen bestanden");
