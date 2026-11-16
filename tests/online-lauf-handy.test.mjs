// KC-CLUB-ONLINE-LAUF-HANDY (Fund Hansi 16.11.2026: „Am Handy keine Laufschrift bei den Online-Mitgliedern. Am PC klappt es“)
// Aufruf: node tests/online-lauf-handy.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(!/\.mini \.on-lauf:hover \.on-band, /.test(html.replace(/@media \(hover: hover\) and \(pointer: fine\) \{[^}]*\}/, "")), "Anhalten bei :hover nur auf Geräten mit Maus (am Handy klebt :hover nach dem Antippen)");
assert.ok(/\.mini \.on-lauf:active \.on-band \{ animation-play-state: paused; \}/.test(html), "Finger drauf → hält an");
assert.ok(/@media \(hover: hover\) and \(pointer: fine\) \{ \.mini \.on-lauf:hover \.on-band, \.mini \.on-lauf:focus-visible \.on-band \{ animation-play-state: paused; \} \}/.test(html), "Maus darüber → hält an (nur PC)");
assert.ok(!/html\.spar \.mini \.on-lauf \.on-band \{ animation: none !important; \}/.test(html), "im Sparmodus nicht mehr still");
assert.ok(/html\.spar \.mini \.on-namen\.on-lauf \.on-band \{ animation-duration: var\(--on-dauer, 9s\) !important; animation-iteration-count: infinite !important; \}/.test(html), "Sparmodus: Ausnahme von der allgemeinen Bewegungs-Sperre");
assert.ok(/@media \(prefers-reduced-motion: reduce\) \{ \.mini \.on-namen\.on-lauf \.on-band \{ animation-duration: calc\(var\(--on-dauer, 9s\) \* 2\) !important; \} \}/.test(html), "„Bewegung reduzieren“: langsamer statt still");
console.log("✅ online-lauf-handy: alle Prüfungen bestanden");
