// KC-CLUB-AVATAR-RUECKWAERTS (2.414.0): alle bisherigen Avatare (40 Figuren, 7 echte Mitglieder-Bilder, 300 b- und 1500 c-Codes)
// müssen mit der neuen Zeichnung EXAKT gleich aussehen. Fingerabdrücke: tests/avatar-schnappschuss.json (Stand 2.413.0).
import assert from "node:assert/strict";
import fs from "node:fs";
import { avatarLaden } from "../tools/avatar-lader.mjs";
import { fingerabdruck } from "../tools/avatar-schnappschuss.mjs";
// 2.428.0: Der Schnappschuss entstand an einem Donnerstag; die „Kochjacke des Tages“ wechselt je Wochentag → Zeit fest auf einen Donnerstag
// (vorher war der Test nur donnerstags grün)
const A = avatarLaden(undefined, { jetzt: "2026-10-15T12:00:00+02:00" });
const snap = JSON.parse(fs.readFileSync(new URL("./avatar-schnappschuss.json", import.meta.url), "utf8"));
assert.equal(snap.stand, "2.413.0", "Schnappschuss darf nicht neu erzeugt werden");
const codes = Object.keys(snap.bilder); assert.ok(codes.length >= 1800, "zu wenige Bilder im Schnappschuss");
const anders = codes.filter((c) => fingerabdruck(A, c) !== snap.bilder[c]);
assert.deepEqual(anders.slice(0, 10), [], `${anders.length} bisherige Avatare sehen anders aus`);
for (const c of ["m13", "w06", "m14", "c255218b0023005011030001401", "c257b6970030004701030000137", "c257025a4000000000000000000", "c153100221201000"]) assert.ok(A.gueltig(c) && snap.bilder[c], "echtes Mitglieder-Bild " + c);
console.log(`OK – Avatare rückwärts: ${codes.length} bisherige Bilder unverändert`);
