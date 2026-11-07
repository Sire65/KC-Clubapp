// KC-CLUB-MAGAZIN-REZEPT (Wunsch Hansi 07.11.2026): Rezept des Monats in der Club-Küche Nr. 1 fest gewählt – aus dem Rezeptbuch (id), mit Kopie als Rückfall.
// Aufruf: node tests/magazin-rezept.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const m = readFileSync(new URL("../teile/magazin.js", import.meta.url), "utf8");
assert.ok(/rezept: \{ id: "dca24732-021f-4042-b71c-a740a6ecf6e9", titel: "Hähnchen mit Spitzkohl in Schmandsoße"/.test(m), "Heft 1: Rezept des Monats fest gewählt");
assert.ok(/const rezept = heftRz \? \{ \.\.\.heftRz, \.\.\.\(rezepte\.find\(\(r\) => r\.id === heftRz\.id\) \|\| \{\}\), gewaehlt: true \}/.test(m), "Rezeptbuch-Stand geht vor (z. B. späteres Foto), sonst die Kopie");
assert.ok(/z\.m \?\? z\.menge, z\.e \?\? z\.einheit, z\.n \?\? z\.name/.test(m), "Zutaten im Format des Rezeptbuchs (m/e/n) werden angezeigt");
assert.ok(/📷 <b>Foto folgt<\/b>/.test(m) && !/leckerschmecker/i.test(m), "ohne fremdes Foto: Platzhalter");
console.log("magazin-rezept: alle Prüfungen bestanden");
