// KC-CLUB-SPUR-WIEDER (28.10.2026, Fund Hansi „Marianne ist online, ich sehe aber nicht ihre Wege“): App aus dem Hintergrund → Schritt im Weg.
// Aufruf: node tests/spur-wieder.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs"; // 2.737.0 KC-CLUB-TEILE: app.js + teile/*.js
const app = programmText();
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
assert.ok(/const SPUR_WIEDER_MS = 5 \* 60000, SPUR_WIEDER_START_MS = 2 \* 60000;/.test(app), "ab 5 Min. Hintergrund, Start über 2 Min. = eingefroren");
assert.ok(/if \(weg >= SPUR_WIEDER_MS && ICH && INIT\) spur\(spurWieder\(weg\)\);/.test(app), "beim Wieder-Öffnen ein Schritt");
assert.ok(/if \(dauer > 6000 && !ausHinter\) fpNeu\("start_langsam"/.test(app), "kein „Start langsam“, wenn die Seite nur im Hintergrund lag");
assert.ok(/spur\(window\.KCFP\?\.ausHinter \? spurWieder\(KCFP\.ausHinter\) : "geoeffnet"\)/.test(app), "eingefrorener Start erscheint als „wieder geöffnet“");
assert.ok(/📲 wieder geöffnet \(war /.test(app) && (app.match(/spurWas\(/g) || []).length >= 2, "Anzeige in den Wegen");
assert.ok(/const SPUR_WAS = \/\^\[a-z\]\[a-z0-9_\]\{0,29\}\$\/;/.test(server) && /^[a-z][a-z0-9_]{0,29}$/.test("wieder_9999"), "Server nimmt den Schritt an");
console.log("spur-wieder: alle Prüfungen bestanden");
