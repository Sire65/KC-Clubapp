// KC-CLUB-ADVENT-NIKOLAUS-FOTO (Wunsch Hansi 15.11.2026: „Der Schoko-Weihnachtsmann ist freigestellt … Bau ihn in den Adventskalender ein am 06.12.“)
// Aufruf: node tests/advent-nikolaus-foto.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const bild = fs.readFileSync(new URL("../advent/schoko-nikolaus.webp", import.meta.url));
assert.equal(bild.subarray(0, 4).toString(), "RIFF", "WebP-Datei");
assert.equal(bild.subarray(8, 12).toString(), "WEBP", "WebP-Datei");
assert.ok(bild.length > 10000 && bild.length < 120000, "Foto liegt bei und ist klein genug (" + bild.length + " Bytes)");
assert.ok(/nikolaus: \{ sym: "🎅", name: "Mini-Schoko-Nikolaus", bild: "SCHOKO-NIKOLAUS", foto: "advent\/schoko-nikolaus\.webp" \}/.test(app), "Preis Nikolaus mit Foto");
assert.ok(!/kinderriegel: \{[^}]*foto:/.test(app), "Kinderriegel bleibt gezeichnet, bis es ein Foto gibt");
const karte = app.slice(app.indexOf("function akRiegelKarte("), app.indexOf("// 2.947.0 KC-CLUB-ADVENT-PREISE: gemeldete Tage"));
assert.ok(/\$\{P\.foto \? `<img class="ak-preis-foto" src="\$\{P\.foto\}" alt="\$\{esc\(P\.name\)\}" width="324" height="520" decoding="async">`/.test(karte), "Foto statt gezeichnetem Riegel");
assert.ok(/: `<div class="ak-riegel/.test(karte), "ohne Foto wie bisher");
const tag6 = app.slice(app.indexOf("const AK_TUERCHEN = ["), app.indexOf("];", app.indexOf("const AK_TUERCHEN = [")));
const eintraege = tag6.split("\n").slice(1).filter((z) => z.trim());
assert.ok(/AK_RIEGEL\("nikolaus"/.test(eintraege[5]), "Türchen 6 = Schoko-Nikolaus");
assert.ok(/\.ak-preis-foto \{ display: block;[^}]*filter: drop-shadow/.test(html) && /@media \(prefers-reduced-motion: reduce\) \{ \.ak-preis-foto \{ animation: none; \} \}/.test(html), "Darstellung + ruhig bei „Bewegung reduzieren“");
console.log("✅ advent-nikolaus-foto: alle Prüfungen bestanden");
