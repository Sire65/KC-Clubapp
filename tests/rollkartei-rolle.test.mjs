// KC-CLUB-ROLLKARTEI-ROLLE (2.995.0, Wunsch Hansi 20.11.2026: Rollkartei „wie die Meldungen am iPad, die nach oben drehen – sorgfältig, bedienerfreundlich,
// flüssige Bewegung und Rastgeräusche, und so, dass du es wieder rückgängig machen kannst“). Aufruf: node tests/rollkartei-rolle.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const teil = (a, b) => { const i = app.indexOf(a); assert.ok(i >= 0, a); return app.slice(i, app.indexOf(b, i)); };
// Rückweg: je Gerät und für alle; klassische Rollkartei bleibt vollständig
assert.ok(/const RK_ROLLE_STANDARD = true/.test(app) && /const rkRolleAn = \(\) => einst\("rkRolle", RK_ROLLE_STANDARD\);/.test(app), "Standard an, für alle umstellbar");
assert.ok(/id="setRkRolle" onchange="rkRolleSetzen\(this\.checked\)"/.test(html) && /id="setRkRast" onchange="einstellung\('rkRast', this\.checked\)"/.test(html), "zwei Schalter unter ⚙️ Rollkartei");
assert.ok(/<div class="rk-rad"><button type="button" class="rk-pfeil" data-r="-1"/.test(app) && /function rkJalousie\(/.test(app), "klassische Rollkartei (Rad) noch da");
assert.ok(/if \(!s0 \|\| z\.rolle\) return;/.test(app), "alte Wischlogik nur im klassischen Modus");
assert.ok(/\.rk\.rk-rolle \.rk-rad, \.rk\.rk-rolle > \.rk-griff \{ display: none !important; \}/.test(html), "Rad nur in der neuen Rolle ausgeblendet");
// Einbindung in den gemeinsamen Kern (Mitglieder, Chats, Einstellungen)
assert.ok(/rkRolleEinrichten\(z\); \/\/ KC-CLUB-ROLLKARTEI-ROLLE/.test(app) && /if \(z\.rolle\) return rkRolleMasse\(z\);/.test(app) && /rkRolleAbbauen\(z\); \/\/ KC-CLUB-ROLLKARTEI-ROLLE/.test(app), "Kern: einrichten, messen, abbauen");
assert.ok(/if \(z\.rolle\) \{ z\.griffe\?\.forEach\(\(g\) => \(g\.hidden = true\)\); if \(!z\.lauf\) z\.p = z\.i; rkRolleZeichnen\(z\); \}/.test(app), "andere Stellen, die z.i setzen (Rundgang), bleiben richtig");
assert.ok(/if \(z\.rolle\) \{ z\.karten\[ziel\]\.scrollTop = 0; rkRolleFahren\(z, /.test(app), "Reiter/▲▼ gleiten statt Stufe für Stufe");
// Bewegung: dem Finger folgen, Inhalt zuerst, Schwung, Einrasten
const zug = teil("function rkRolleEinrichten(", "function rkRolleAbbauen(");
assert.ok(/z\.p \+= rest \/ schritt/.test(zug) && /k\.scrollTop \+= t; rest -= t;/.test(zug), "folgt dem Finger, erst der Karteninhalt");
assert.ok(/const weit = Math\.max\(-4, Math\.min\(4, /.test(zug) && /rkRolleFahren\(z, ziel\)/.test(zug), "Schwung über bis zu 4 Karten, dann einrasten");
assert.ok(/z\.klickSperre/.test(zug) && /!g\.ziel\?\.closest\?\.\("button, a, input, select, textarea, \.rk-zaehler, \.rk-reiter"\)/.test(zug), "Ziehen löst keinen Klick aus; Knöpfe bleiben Knöpfe");
// Lage-Rechnung: vorn 0, kommend unten, gelesen oben gestapelt – reine Rechnung prüfen
const zeichnen = teil("function rkRolleZeichnen(", "function rkRolleStand(");
const lage = (i, p, n) => { let a = (((i - p) % n) + n) % n; if (a > n / 2 + 0.0001) a -= n; return a; };
assert.ok(zeichnen.includes("let a = (((i - z.p) % n) + n) % n; if (a > n / 2 + 0.0001) a -= n;"), "Rechnung wie im Programm");
assert.equal(lage(0, 0, 8), 0); assert.equal(lage(1, 0, 8), 1); assert.equal(lage(7, 0, 8), -1, "endlos: die letzte liegt oben im Stapel");
assert.equal(lage(2, 1.5, 8), 0.5); assert.equal(lage(1, 1.5, 8), -0.5);
assert.ok(/y = -t \* RK_STAPEL; s = 1 - t \* 0\.045;/.test(zeichnen) && /clipPath = unten > 0/.test(zeichnen), "gelesen: nach oben verkleinert gestapelt; unten abgeschnitten");
assert.ok(/rkRast\(\);/.test(zeichnen), "bei jeder Karte ein Rasten");
// Rastgeräusch: leise, abschaltbar, nicht zu oft
const rast = teil("function rkRast()", "function rkRolleEinrichten(");
assert.ok(/if \(!einst\("ton", true\) \|\| !einst\("rkRast", true\)\) return;/.test(rast) && /jetzt - rkRastZeit < 35/.test(rast) && /navigator\.vibrate\?\.\(4\)/.test(rast), "abschaltbar, gedrosselt, kurzes Zucken");
// sanft und rücksichtsvoll
assert.ok(/if \(!fxAn\(\) \|\| Math\.abs\(weg\) < 0\.001\) \{ z\.p = ziel;/.test(app), "ohne Effekte: springt direkt (kein Ruckeln)");
assert.ok(/\.rk\.rk-rolle > \.rk-karte \{ transition: none !important;[^}]*touch-action: none;/.test(html), "keine CSS-Übergänge, eigener Finger");
console.log("✅ rollkartei-rolle: alle Prüfungen bestanden");
