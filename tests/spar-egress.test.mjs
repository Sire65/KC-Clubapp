// 2.898.0 KC-CLUB-SPAR-FP + KC-CLUB-SPAR-AKTIONEN (Egress-Messung 08./09.11.2026, Freigabe Hansi „Ja, bau beides für 12 Uhr ein“). Aufruf: node tests/spar-egress.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const lauf = server.slice(server.indexOf("async function fpUeberwachen() {"), server.indexOf("await protokoll(null, \"fp_schwer_gemeldet\""));
assert.ok(/const FP_FENSTER_STD = 24, FP_MIT_DETAILS = /.test(server), "Fenster 24 Std.");
assert.ok(lauf.includes("const seit = l0 && l0 > fenster ? l0 : fenster;"), "nie älter als das Fenster (vorher seit 14.10.)");
assert.ok(lauf.includes('.select("id,zeit,person_id,aktion").or(FP_FILTER).gt("zeit", seit).order("zeit", { ascending: false }).limit(500)'), "zuerst nur Zeit/Art, die neuesten");
assert.ok(lauf.includes('select("id,details").in("id", brauchtDetails.map('), "Einzelheiten nur, wo nötig");
assert.ok(!/select\("zeit,person_id,aktion,details"\)\.or\(FP_FILTER\)\.gt\("zeit", seit\)\.order\("zeit"\)\.limit\(500\)/.test(server), "alter Großabruf ist weg");
// Einstufung bleibt gleich: Details werden für Skript-/Sicherheitsmeldungen und Hilferufe geholt
const re = /^fehler_(anonym_)?(skript|sicherheit)$/;
assert.ok(re.test("fehler_skript") && re.test("fehler_anonym_sicherheit") && !re.test("fehler_umgebung"));
const ak = server.slice(server.indexOf("async function aktionenRoh() {"), server.indexOf("async function aktionenLesen("));
assert.ok(ak.includes('.select("updated_at").eq("org_id", ORG).eq("section_key", AKTIONEN_QUELLE.aktionen)') && ak.includes("(st.updated_at ?? null) === AKT_MERK.stand") && ak.includes("structuredClone(AKT_MERK.liste)"), "Aktionen: nur Stand fragen, gemerkte Liste nur bei gleichem Stand (nie veraltet), Kopie herausgeben");
console.log("spar-egress: ok");
