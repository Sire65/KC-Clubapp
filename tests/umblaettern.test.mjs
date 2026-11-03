// KC-CLUB-UMBLAETTERN (Wunsch Hansi 03.11.2026 „wie Blätter-Prospekte“). Aufruf: node tests/umblaettern.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(app.includes("const blatt = richtung ? blUmblattVorher(b, richtung) : null;") && app.includes("if (blatt) blUmblattLos(b, blatt, richtung);"), "im gemeinsamen Blättern-Baustein");
assert.ok(/const blUmblattAn = \(\) => \{ try \{ return fxAn\(\) && !matchMedia\("\(prefers-reduced-motion: reduce\)"\)\.matches/.test(app), "nur mit Effekten, ohne „Bewegung verringern“");
assert.ok(app.includes("an.onfinish = weg; an.oncancel = weg; setTimeout(weg, dauer + 400);"), "Blatt wird immer wieder entfernt (kein Dauerlauf)");
assert.ok(/\.bl-umblatt-vorn, \.bl-umblatt-hinten \{[^}]*backface-visibility: hidden/.test(html), "Vorder-/Rückseite");
console.log("umblaettern: ok");
