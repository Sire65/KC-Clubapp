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
assert.ok(/if \(z\.rolle\) \{ z\.griffe\?\.forEach\(\(g\) => \(g\.hidden = true\)\); if \(!z\.lauf\) z\.p = z\.i; rkRolleZeichnen\(z\); if \(!z\.lauf\) rkRolleRuhe\(z\); \}/.test(app), "andere Stellen, die z.i setzen (Rundgang), bleiben richtig");
assert.ok(/if \(z\.rolle\) \{ z\.karten\[ziel\]\.scrollTop = 0; rkRolleFahren\(z, /.test(app), "Reiter/▲▼ gleiten statt Stufe für Stufe");
// Bewegung: dem Finger folgen, Inhalt zuerst, Schwung, Einrasten
const zug = teil("function rkRolleEinrichten(", "function rkRolleAbbauen(");
assert.ok(/z\.p \+= rest \/ schritt/.test(zug) && /k\.scrollTop \+= t; rest -= t;/.test(zug), "folgt dem Finger, erst der Karteninhalt");
assert.ok(/let ziel = basis \+ r \* rkSchwungKarten\(/.test(zug) && /rkRolleFahren\(z, ziel\)/.test(zug), "Schwung über mehrere Karten (KC-CLUB-ROLLKARTEI-SCHLOSS), dann einrasten");
assert.ok(/z\.klickSperre/.test(zug) && /!g\.ziel\?\.closest\?\.\("button, a, input, select, textarea, \.rk-zaehler, \.rk-reiter"\)/.test(zug), "Ziehen löst keinen Klick aus; Knöpfe bleiben Knöpfe");
// Lage-Rechnung: vorn 0, kommend unten, gelesen oben gestapelt – reine Rechnung prüfen
const zeichnen = teil("function rkRolleZeichnen(", "function rkRolleStand(");
const lage = (i, p, n) => { let a = (((i - p) % n) + n) % n; if (a > n / 2 + 0.0001) a -= n; return a; };
assert.ok(zeichnen.includes("let a = (((i - z.p) % n) + n) % n; if (a > n / 2 + 0.0001) a -= n;"), "Rechnung wie im Programm");
assert.equal(lage(0, 0, 8), 0); assert.equal(lage(1, 0, 8), 1); assert.equal(lage(7, 0, 8), -1, "endlos: die letzte liegt oben im Stapel");
assert.equal(lage(2, 1.5, 8), 0.5); assert.equal(lage(1, 1.5, 8), -0.5);
assert.ok(/y = -t \* RK_STAPEL - e1; s = 1 - t \* 0\.045;/.test(zeichnen) && /clipPath = unten > 0/.test(zeichnen), "gelesen: nach oben verkleinert gestapelt; unten abgeschnitten");
assert.ok(/rkRast\(\);/.test(zeichnen), "bei jeder Karte ein Rasten");
// Rastgeräusch: leise, abschaltbar, nicht zu oft
const rast = teil("function rkRast()", "function rkRolleEinrichten(");
assert.ok(/if \(!einst\("ton", true\) \|\| !einst\("rkRast", true\)\) return;/.test(rast) && /jetzt - rkRastZeit < 35/.test(rast) && /navigator\.vibrate\?\.\(4\)/.test(rast), "abschaltbar, gedrosselt, kurzes Zucken");
// sanft und rücksichtsvoll
assert.ok(/if \(rkRuhig\(\) \|\| Math\.abs\(weg\) < 0\.001\) \{ z\.p = ziel;/.test(app), "ohne Effekte: springt direkt (kein Ruckeln)");
assert.ok(/\.rk\.rk-rolle > \.rk-karte \{ transition: none !important;[^}]*touch-action: none;/.test(html), "keine CSS-Übergänge, eigener Finger");
console.log("✅ rollkartei-rolle: alle Prüfungen bestanden");
// KC-CLUB-ROLLKARTEI-GROSS (2.996.0, Wunsch Hansi 21.11.: „wenn sie im Vordergrund ist und ich nicht weiter rolle, soll sie groß werden und einrasten –
// aber wie kann man dann weiter rollen?“): nach kurzer Ruhe groß; weiterschieben schrumpft fließend zurück und rollt weiter
{
  const gr = app.slice(app.indexOf("// KC-CLUB-ROLLKARTEI-GROSS (2.996.0"), app.indexOf("function rkRolleInnenHalt("));
  assert.ok(/const RK_STREIFEN = 30, RK_RUHE_MS = 650, RK_GROSS_MS = 280;/.test(app), "Ruhe ⅔ s, Wachsen ≈ 0,3 s, Streifen der nächsten Karte");
  assert.ok(/const rkGrossAn = \(\) => einst\("rkGross", true\);/.test(gr) && /id="setRkGross" onchange="einstellung\('rkGross', this\.checked\)"/.test(html), "abschaltbar je Gerät");
  assert.ok(/if \(ziel === 1\) rkRast\(\);/.test(gr), "rastet hörbar ein, wenn sie groß ist");
  assert.ok(/if \(rest && \(z\.g \|\| 0\) > 0\) \{ \/\/ große Karte: erst fließend zurückschrumpfen/.test(app) && /z\.g = Math\.max\(0, z\.g - Math\.abs\(t\) \/ 60\)/.test(app), "weiterschieben: erst zurückschrumpfen, dann rollen");
  assert.ok(/if \(\(z\.g \|\| 0\) > 0 && Math\.abs\(weg\) >= 0\.001\) rkRolleGross\(z, 0\);/.test(app), "Reiter/▲▼/Streifen: schrumpft während der Fahrt");
  assert.ok(/rkRolleZeichnen\(z\); rkRolleRuhe\(z\); \} \};/.test(app), "nach jeder Fahrt: wieder groß nach Ruhe");
  assert.ok(/if \(g\.geschrumpft\) rkRolleGross\(z, 1\);/.test(app), "kurz angezogen und losgelassen → sofort wieder groß");
  assert.ok(/z\.w\.insertBefore\(z\.zaehler, z\.platz\);/.test(app), "▲▼ liegt nie unter der großen Karte");
  assert.ok(/if \(Math\.abs\(a\) < 0\.0005\) \{ y = -e1; hoch = g > 0 \? H \+ e1 \+ e2 : 0;/.test(app), "vorn: nach oben gewachsen, unten Streifen frei");
}
console.log("✅ rollkartei-groß: alle Prüfungen bestanden");
