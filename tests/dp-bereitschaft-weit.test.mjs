// KC-CLUB-DP-BEREITSCHAFT-WEIT (30.10.2026, Wunsch Hansi „Willfried kommt von Hamm nicht für eine Stunde“): wer weit fährt (Mindestdienst),
// bekommt keine Bereitschaft, die kürzer ist als sein Mindestdienst.
// Aufruf: node tests/dp-bereitschaft-weit.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import { dpRechnen, DP_REGEL } from "../supabase/functions/kc-club/dp-rechnen.js";
const tag = (start, end) => ({ tage: [{ d: "2026-12-05", art: "Markttag", baender: [{ start, end, total: 1 }] }], personen: [] });
const ber = (e) => dpRechnen(e).tage[0].ber.map((b) => b.n);
// 1 Std. Lücke 22–23: Weitfahrer (Mindestdienst 3) wird übersprungen, der Nächste übernimmt
assert.deepEqual(ber({ ...tag(22, 23), bereitschaftAuto: [{ key: "Willfried W", name: "Willfried", minDienst: 3 }, { key: "Hans K", name: "Hans" }] }), ["Hans"], "kurze Bereitschaft nicht für Weitfahrer");
// nur der Weitfahrer da → lieber keine Bereitschaft als eine für 1 Std. aus Hamm
assert.deepEqual(ber({ ...tag(22, 23), bereitschaftAuto: [{ key: "Willfried W", name: "Willfried", minDienst: 3 }] }), [], "lieber keine als eine zu kurze");
// lange Lücke (3 Std.): Weitfahrer darf
assert.deepEqual(ber({ ...tag(20, 23), bereitschaftAuto: [{ key: "Willfried W", name: "Willfried", minDienst: 3 }] }), ["Willfried"], "lange Bereitschaft geht");
assert.ok(DP_REGEL >= 6, "Rechenregel erhöht – gespeicherte Pläne werden neu gerechnet");
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
assert.ok(/\(kmVon\.get\(String\(w\.person_id\)\) \?\? 0\) >= grenzeKm \? \{ minDienst: minWeit \} : \{\}\), \/\/ KC-CLUB-DP-BEREITSCHAFT-WEIT/.test(server), "Server gibt den Mindestdienst der Weitfahrer mit");
console.log("dp-bereitschaft-weit: ok");
