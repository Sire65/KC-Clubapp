// KC-CLUB-AVATAR-RUECKWAERTS (2.414.0): legt fest, wie alle BISHERIGEN Avatare aussehen (Fingerabdruck je Bild).
// Erzeugt einmalig VOR einer Änderung an der Zeichnung: node tools/avatar-schnappschuss.mjs  → tests/avatar-schnappschuss.json
// Der Test tests/avatar-rueckwaerts.test.mjs zeichnet dieselben Codes mit der neuen app.js und verlangt exakt dasselbe Bild.
import fs from "node:fs";
import crypto from "node:crypto";
import { avatarLaden } from "./avatar-lader.mjs";
export function schnappCodes(A) {
  const codes = new Set(Object.keys(A.lese("AV_FIGUREN")));
  // echte gespeicherte Mitglieder-Bilder (Stand 2026-10-15, nur die Codes – keine Namen)
  ["m13", "w06", "m14", "c255218b0023005011030001401", "c257b6970030004701030000137", "c257025a4000000000000000000", "c153100221201000"].forEach((c) => codes.add(c));
  let s = 20261015; const r = (n) => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return (((t ^ (t >>> 14)) >>> 0) % n); }; // mulberry32 – fest, wiederholbar
  // Grenzen der ALTEN Listen (Stand 2.413.0) – neue Einträge kommen nur hinten dazu
  const g = [5, 9, 8, 17, 7, 13, 12, 8, 2, 4, 4, 4, 4, 13, 11, 7, 19, 10, 6, 2, 2, 19, 19, 6, 9, 9];
  for (let i = 0; i < 300; i++) codes.add("b" + [5, 9, 8, 3, 4, 2, 12, 8, 2].map((n) => r(n).toString(36)).join("")); // Baukasten 2.23.86 (b-Codes: alte Listenlängen)
  for (let i = 0; i < 1500; i++) { const len = 15 + r(12); codes.add("c" + g.slice(0, len).map((n, k) => (k === 14 && r(n) === 7 ? 0 : r(n)).toString(36)).join("")); } // ohne „Jacke täglich“ (hängt vom Tag ab)
  return [...codes];
}
const hash = (t) => crypto.createHash("sha256").update(t).digest("hex").slice(0, 20);
export function fingerabdruck(A, code) { return hash(A.svg(code, 64) + "|" + A.svg(code, 96, "HK")); }
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const A = avatarLaden(), aus = {};
  for (const c of schnappCodes(A)) { if (!A.teile(c)) continue; aus[c] = fingerabdruck(A, c); }
  fs.writeFileSync(new URL("../tests/avatar-schnappschuss.json", import.meta.url), JSON.stringify({ stand: "2.413.0", hinweis: "Fingerabdrücke der bisherigen Avatare – NICHT neu erzeugen, sonst prüft der Test nichts mehr", bilder: aus }, null, 0) + "\n");
  console.log("Schnappschuss:", Object.keys(aus).length, "Bilder");
}
