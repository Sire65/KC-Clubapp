// KC-CLUB-RT-TERMINANFRAGE (2.874.0): Terminanfragen über die direkte Leitung, Sparbremse vollständig. Aufruf: node tests/rt-terminanfrage.test.mjs (offline)
import assert from "node:assert/strict";
import fs from "node:fs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), sql = lies("supabase/migrations/20261106_kc_club_rt_terminanfrage.sql");
// Datenbank: Trigger auf beiden Tabellen, nur Signal (Art), Fehler stören das Speichern nie, nur „gelesen“ meldet nichts
assert.ok(/create trigger kc_club_rt_ta_empfaenger after insert or update on public\.kc_club_terminanfrage_empfaenger/.test(sql) && /create trigger kc_club_rt_ta_anfrage after update on public\.kc_club_terminanfragen/.test(sql), "Trigger");
assert.equal((sql.match(/'terminanfrage'\)/g) || []).length, 3, "drei Fälle: neu, Antwort, Absage");
assert.ok(/row\(new\.antwort, new\.notiz, new\.vorschlag_beginn, new\.vorschlag_ende\) is distinct from row\(old\./.test(sql), "nur echte Antworten melden");
assert.ok(/exception when others then null; -- das Speichern geht immer vor/.test(sql), "Fehler stören das Speichern nicht");
assert.ok(/revoke all on function public\.kc_club_rt_ta_trigger\(\) from public, anon, authenticated;/.test(sql), "keine Rechte für Fremde");
// Sparbremse: alle teuren Arten ab 70 %, Alarm bis zuletzt
const teuer = /p_art in \(([^)]*)\) and v_n >= 1400000/.exec(sql)?.[1] || "";
for (const a of ["tippt", "spricht", "diktiert", "vorfuehren", "mitschauen", "online", "pinnwand", "termin", "abstimmung", "livetermin"]) assert.ok(teuer.includes(`'${a}'`), "70 %: " + a);
assert.ok(!teuer.includes("'terminanfrage'") && /if p_art <> 'alarm' and v_n >= 1900000 then return; end if;/.test(sql), "Terminanfrage bis 95 %, Alarm immer");
// Probelauf mit erwartetem Bericht
const erw = lies("tools/db-test/111_erwartet.txt");
for (const z of ["neu=1", "gelesen=0", "antwort=1", "absage=2", "inhalt=0", "bremse70_spricht=0", "bremse70_terminanfrage=1"]) assert.ok(erw.includes(z), "erwartet " + z);
// App: Signal → Hinweis/Liste frisch; Takt mit Leitung nur jedes 6. Mal
assert.ok(app.includes('if (s.art === "terminanfrage") { clearTimeout(RT.ta); RT.ta = setTimeout(taSignal, 600 + Math.random() * 1400); return; }'), "Signal-Handler");
assert.ok(app.includes("setInterval(() => { if (rtAn() && ++TAH_TICK % 6) return; taHinweisPruefen(9); }, TAH_TAKT_MS);"), "Takt mit Leitung seltener");
assert.ok(/function taSignal\(\) \{\n  if \(document\.hidden\) return;[^]{0,200}TAH_ZULETZT = 0; taHinweisPruefen\(9\);\n  if \(\$\("terminanfragen"\)\?\.offsetParent\) taLaden\(\);/.test(app), "taSignal");
// Notfall-Ablauf auf Node 22
assert.ok(/node-version: "22"/.test(lies(".github/workflows/notfall-sicherung-lesen.yml")), "Node 22");
console.log("rt-terminanfrage: ok");
