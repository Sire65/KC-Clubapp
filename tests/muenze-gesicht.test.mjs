// KC-CLUB-MUENZE-GESICHT / KC-CLUB-LAMPE-GESPIEGELT (Wunsch #88, 11.11.2026)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8"), buero = fs.readFileSync(new URL("../teile/buero.js", import.meta.url), "utf8");
// Münze: eigenes Gesicht nur auf der Warte-Mütze, nur wenn ein Avatar/Foto gewählt ist
assert.match(app, /avatarSvg\(INIT\?\.einstellungen\?\.avatar\?\.figur, 56\)/, "Münze nutzt das eigene Gesicht (Avatar oder Foto)");
assert.match(app, /classList\.toggle\("mit-av", !!av\)/, "ohne Avatar keine Wechsel-Rückseite");
assert.match(app, /if \(b\.id === "muetze"\) try \{ av = avatarSvg/, "nur bei der Kochmütze, nicht bei anderen Wartebildern");
assert.match(html, /\.warten \.muetze\.mit-av::after \{ animation: muetzeSeiteA/, "„since 1991“ wechselt mit dem Gesicht");
assert.match(html, /@keyframes muetzeDreh2 \{ from \{ transform: rotateY\(0deg\); \} to \{ transform: rotateY\(720deg\); \} \}/, "zwei Umdrehungen je Wechsel");
assert.match(html, /\.warten \.muetze::after, \.si-muetze:not\(\.klein\) > span::after \{ content: "since\\A 1991"/, "„since 1991“ bleibt Standard");
// Lampe: gespiegelt, Licht nach rechts nur wenn an
assert.match(buero, /lampe: \(an\) => `<svg viewBox="0 0 70 90" aria-hidden="true" style="overflow:visible">\$\{an \? '<path d="M47 33 L58 21 L132 64 L92 94 Z"/, "Lichtkegel nach rechts, nur wenn an");
assert.match(buero, /<path d="M32 8 L16 46 L34 80"/, "Arm gespiegelt");
console.log("muenze-gesicht: ok");
