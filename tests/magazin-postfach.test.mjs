// KC-CLUB-MAGAZIN-POSTFACH (03.11.2026). Aufruf: node tests/magazin-postfach.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const teil = lies("teile/magazin.js"), server = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261103_kc_club_magazin_postfach.sql"), app = lies("app.js");
// gleiche Arten in App und Server
const sArten = Object.keys(new Function("return " + server.slice(server.indexOf("const MAG_ARTEN: Record<string, string> = ") + "const MAG_ARTEN: Record<string, string> = ".length, server.indexOf("};", server.indexOf("const MAG_ARTEN")) + 1))());
const aArten = new Function(teil.slice(teil.indexOf("const MAG_EINSENDEN"), teil.indexOf("const MAG_STAND")) + "; return MAG_EINSENDEN.map((x) => x[0]);")();
assert.deepEqual(aArten, sArten, "Arten gleich in App und Server");
for (const a of ["rezept", "foto", "text", "witz", "portraet"]) assert.ok(sArten.includes(a), a);
// Server: nur mit Freigabe, nur eigene Anlagen, Porträt nur mit Zustimmung, Bremse, Postfach nur Redaktion
const sv = server.slice(server.indexOf('case "magazin_einreichen"'), server.indexOf('case "twinkey_daten"'));
assert.ok(sv.includes('await nurWennFrei("magazin", ich, "Das Club-Magazin");') && sv.includes("startsWith(`club/${ich.person_id}/`)") && sv.includes('if (art === "portraet" && !zustimmung)') && sv.includes('protokollPlatz(ich.person_id, "magazin_eingereicht", 10)'));
assert.equal((sv.match(/nurMagRedaktion\(ich\);/g) || []).length, 2, "Postfach und Stand nur Redaktion");
assert.ok(/const istMagRedaktion = \(ich: Ich\) => ich\.admin \|\| \(ich\.aemter \|\| \[\]\)\.some\(\(a\) => \/\^redaktion\/i\.test\(a\)\);/.test(server), "Redaktion = Admin oder Amt Redaktion");
assert.ok(server.includes("// KC-CLUB-MAGAZIN-POSTFACH: eingesandte Fotos/Dateien sieht die Redaktion"), "Anlagen für die Redaktion");
// Datenbank
assert.ok(mig.includes("grant select, insert, update, delete on public.kc_club_magazin_beitrag to service_role;") && mig.includes("enable row level security") && mig.includes("'kc_club_magazin_beitrag', 'Club-App', 'sensitive', false, true, true"));
assert.equal(lies("tools/db-test/107_erwartet.txt").trim().split("\n").length, 4);
// App: Menü, Einsenden-Knopf in den Platzhaltern, Sprung aus der Benachrichtigung, Küchenwitz-Rubrik
assert.ok(teil.includes('blZu();magEinsenden(${jsArg(MAG_RUBRIK_ART[rubrik])})') && app.includes('else if (h === "#redaktion") magPostfach();') && teil.includes('{ id: "witz", sym: "😄", t: "Küchenwitz des Monats"'));
console.log("magazin-postfach: ok");
