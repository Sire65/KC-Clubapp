// KC-CLUB-ANORDNUNG (Wunsch Hansi 18.11.2026 „Ja bauen, aber vorsichtig“ – Messung aller Seiten in 6 Rollen, Handy 360 px / Tablet 820 px).
// Sichert die gezielten Regeln ab; nachmessen im Browser: node tools/anordnung-pruefen.mjs. Aufruf: node tests/anordnung.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const i = html.indexOf("/* ---------- KC-CLUB-ANORDNUNG"); assert.ok(i > 0, "Block KC-CLUB-ANORDNUNG fehlt");
const css = html.slice(i, html.indexOf("</style>", i));
assert.ok(i > html.lastIndexOf("#v-nachrichten .kopf2 > h2 { min-width: 0; overflow: hidden; text-overflow: ellipsis", i), "steht nach den alten Regeln (gewinnt)");
// 1. Titel Nachrichten/Protokolle: nicht schrumpfen, nicht abschneiden; Knöpfe rutschen rechtsbündig in Zeile 2
assert.ok(/#v-nachrichten \.kopf2 > h2, #v-protokolle \.kopf2 > h2 \{ flex: 1 0 auto; overflow: visible; text-overflow: clip;/.test(css), "Titel bleiben ganz");
assert.ok(/#v-nachrichten \.kopf2 > #naSosKnopf \+ \.knopf\.haupt \{ margin-left: auto; \}/.test(css), "＋ Neu rechtsbündig, auch nach SOS");
assert.ok(/@media \(max-width: 480px\) \{\n    #v-fotos \.kopf2 > h2, #v-mitglieder \.kopf2 > h2 \{ flex: 1 0 calc\(100% - 60px\); \}/.test(css), "Fotos/Mitglieder: Knöpfe zusammen in Zeile 2 (nur Handy)");
// 2. lange Reihen laufen sichtbar aus
assert.ok(/\.hz-reg, \.ar-chips \{ -webkit-mask-image: linear-gradient\(to right, #000 calc\(100% - 32px\), transparent\); mask-image: [^}]*padding-right: 32px; \}/.test(css), "Auslauf rechts");
// 3. kleine Knöpfe mindestens 36 px
assert.ok(/\.nu-entdecken \{ min-height: 36px;/.test(css) && /\.tw-nicht \{ min-height: 36px;/.test(css), "mindestens 36 px");
// 4. Nachrichten-Leiste: gleich breite Spalten, Wörter passen
assert.ok(/html\.kom-sym \.kom-leiste \{ display: grid; grid-template-columns: repeat\(auto-fill, minmax\(76px, 1fr\)\); \}/.test(css) && /max-width: none; min-width: 0;/.test(css), "gleich breite Spalten");
// 5. Status-Knopf trennt mit Strich
assert.ok(/#statusChip \{ hyphens: auto;/.test(css) && /<html lang="de">/.test(html), "Silbentrennung (deutsch)");
// 👆 ? 🔍 bleiben, wo Hansi sie hingestellt hat (2.380.0, 2.725.0): keine neue Lage oder Größe – nur halb durchsichtig in Ruhe, beim Wegscrollen weiter ganz weg
const ohneKomm = css.replace(/\/\*[\s\S]*?\*\//g, "");
assert.ok(!/(su-klein|hz-frage|hz-klick)[^{]*\{[^}]*(right|left|bottom|top|width|height):/.test(ohneKomm), "schwebende Knöpfe: Lage und Größe unverändert");
assert.ok(/body:not\(\.knoepfe-weg\) :is\(\.su-klein, \.hz-frage, \.hz-klick\) \{ opacity: \.72; \}/.test(css) && /body\.klick-zeigen:not\(\.knoepfe-weg\) \.hz-klick \{ opacity: 1; \}/.test(css), "halb durchsichtig, Wegscrollen bleibt");
// 2. Runde: Reihen füllen die Zeile am Handy, Texte nicht abgeschnitten, Protokolle-Titel nicht doppelt
assert.ok(/\.rgl-fuss, #v-archiv \.ar-zeile > \.knoepfe, #scBlatt \.karte > \.knoepfe \{ display: flex; flex-wrap: wrap; gap: 8px; \}/.test(css) && /> \.knopf \{ flex: 1 1 auto; margin: 0; \}/.test(css) && /\.rgl-fuss \.knopf\.haupt \{ flex-basis: 100%; \}/.test(css), "Zeilen ganz gefüllt");
assert.ok(!/hyphens: auto/.test(css.slice(css.indexOf("/* 6."), css.indexOf("/* 7."))), "in den Reihen keine Worttrennung");
assert.ok(/@media \(max-width: 420px\) \{ #v-start \.marke-klein \{ white-space: normal; \} \}/.test(css) && /\.zk-naechst \{ white-space: normal;/.test(css), "Texte umbrechen statt …");
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
assert.ok(/\+ \(auf \|\| neu \? `<div class="abschnitt"><h3>📄 Protokolle<\/h3><\/div>` : ""\)/.test(app), "Protokolle-Zwischenüberschrift nur mit Abschnitten darüber");
// Messwerkzeug liegt in der App
const w = fs.readFileSync(new URL("../tools/anordnung-pruefen.mjs", import.meta.url), "utf8");
assert.ok(/const ROLLEN = \{/.test(w) && /admin:/.test(w) && /aushilfe:/.test(w) && /gast:/.test(w) && /einfach:/.test(w) && /\{ name: "Handy", w: 360/.test(w) && /\{ name: "Tablet", w: 820/.test(w), "6 Rollen, Handy und Tablet");
console.log("✅ anordnung: alle Prüfungen bestanden");
