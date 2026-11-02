// KC-CLUB-KLAPPE-GLEICH (2.808.0, Wunsch #63 Hansi): alle gemerkten Klappbereiche mit großem, drehendem Pfeil wie die Karten.
// Aufruf: node tests/klappe-gleich.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const html = fs.readFileSync("index.html", "utf8");
const S = "details[data-klappe-an]:not(.karte):not(.av-klappe)";
const r = (sel) => new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + " \\{([^}]*)\\}").exec(html)?.[1] || "";
assert.ok(/display: flex/.test(r(S + " > summary")), "Kopfzeile: Titel, Schloss und Pfeil in einer Zeile");
assert.ok(/display: none/.test(r(S + " > summary::before")), "kein zweiter kleiner Pfeil links");
const karte = r("details.karte .pfeil"), neu = r(S + " > summary .pfeil");
for (const k of ["width: 42px", "font-size: 1.7rem", "color: var(--rot)", "transition: transform .2s"]) assert.ok(karte.includes(k) && neu.includes(k), "Pfeil gleich groß wie bei den Karten: " + k);
assert.ok(/rotate\(-90deg\)/.test(r(S + ":not([open]) > summary .pfeil")) && /rotate\(-90deg\)/.test(r("details.karte:not([open]) > summary .pfeil")), "dreht sich wie bei den Karten");
assert.ok(!/summary\.pr-monat-titel::before \{ content:/.test(html), "eigener kleiner Monatspfeil ist weg");
console.log("klappe-gleich: alle Prüfungen bestanden");
