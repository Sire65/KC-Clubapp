// KC-CLUB-PINNWAND-ADMIN-MEHR (2.814.0, Wunsch Hansi): Admin darf 8 Zettel anheften, Mitglieder weiter 4.
// Aufruf: node tests/pinnwand-admin-mehr.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync("index.html", "utf8"), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");
const mig = fs.readFileSync("supabase/migrations/20261102_kc_club_pinnwand_admin_mehr.sql", "utf8");
assert.ok(/const PINNWAND_MAX = 4,/.test(server) && /const PINNWAND_MAX_ADMIN = 8;/.test(server), "Mitglieder 4, Admin 8");
const { pinnwandMax, pinnwandFarbeFrei } = new Function("PINNWAND_MAX", "PINNWAND_MAX_ADMIN", server.match(/const pinnwandMax = [^\n]+/)[0].replace(/: \{ admin\?: boolean \}/, "") + "\n" + server.match(/const pinnwandFarbeFrei = [^\n]+/)[0].replace(/: Set<unknown>|: number/g, "") + "\nreturn { pinnwandMax, pinnwandFarbeFrei };")(4, 8);
assert.equal(pinnwandMax({ admin: true }), 8); assert.equal(pinnwandMax({}), 4);
assert.equal(pinnwandFarbeFrei(new Set([1, 2, 3, 4]), 8), 5, "Admin: 5. Zettel orange");
assert.equal(pinnwandFarbeFrei(new Set([1, 3]), 4), 2, "kleinste freie Farbe wie bisher");
const an = server.slice(server.indexOf('case "pinnwand_anheften"'), server.indexOf('case "pinnwand_anheften"') + 2500);
assert.ok(/const maxZ = pinnwandMax\(ich\);/.test(an) && /length >= maxZ\) throw/.test(an), "Grenze beim Anheften je Rolle");
assert.ok(/max: pinnwandMax\(ich\),/.test(server), "App zeigt die eigene Grenze (x/8)");
assert.ok(/check \(farbe between 1 and 8\)/.test(mig), "Datenbank erlaubt Farben 1–8");
for (const n of [5, 6, 7, 8]) assert.ok(html.includes(`.zettel.f${n} { background:`) && html.includes(`.kork .pw-nadel.f${n} { --nadel:`), "Farbe " + n);
assert.ok(/Number\(z\.farbe\) >= 1 && Number\(z\.farbe\) <= 8/.test(app), "App zeigt Farben 5–8");
console.log("pinnwand-admin-mehr: alle Prüfungen bestanden");
