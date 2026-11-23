// KC-CLUB-ROLLKARTEI-SCHLOSS (Wunsch Hansi 23.11.2026): Rollkartei – sanftes Wischen = eine Karte, schnelles = 3–10 Karten (sanft auslaufend),
// Mausrad ein Raster = eine Karte; gelbes Schloss oben rechts stellt die Karte fest (rollt nicht weiter, Gummiband, Hinweis); für die Sitzung gemerkt.
// Quelltext + reine Rechenfunktion, offline. Aufruf: node tests/rollkartei-schloss.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const teil = (a, b) => { const i = app.indexOf(a); assert.ok(i >= 0, a); return app.slice(i, app.indexOf(b, i)); };

// 1. reine Rechnung „Schwung → Anzahl Karten“
const fn = teil("function rkSchwungKarten(", "const rkRuhig");
const RK_SCHNELL = Number(app.match(/const RK_SCHNELL = ([\d.]+);/)?.[1]);
assert.ok(RK_SCHNELL > 0.3 && RK_SCHNELL < 2, "Schwelle sanft/schnell");
const karten = new Function("RK_SCHNELL", fn + "; return rkSchwungKarten;")(RK_SCHNELL);
assert.equal(karten(0.2), 1, "langsam = genau eine Karte");
assert.equal(karten(RK_SCHNELL - 0.01), 1, "knapp unter der Schwelle = eine Karte");
assert.equal(karten(-0.5), 1, "Richtung egal");
assert.equal(karten(RK_SCHNELL), 3, "schnell: mindestens 3");
assert.ok(karten(1.8) > 3 && karten(1.8) < 10, "mittlerer Schwung dazwischen");
assert.equal(karten(50), 10, "höchstens 10");
assert.equal(karten(-50), 10);
assert.equal(karten(5, true), 1, "weniger Bewegung: kein Schwung");
assert.equal(karten(NaN), 1);
for (let v = 0; v < 6; v += 0.1) assert.ok(karten(v + 0.1) >= karten(v), "steigt mit dem Schwung");

// 2. Einbau: Rolle (Finger), klassisch (touchend), Mausrad, sanftes Auslaufen
const zug = teil("function rkRolleEinrichten(", "function rkRolleAbbauen(");
assert.ok(/let ziel = basis \+ r \* rkSchwungKarten\(schnell \? vPx : 0, ruhig\);/.test(zug), "Rolle: Schwung → Karten");
assert.ok(/schnell = !ruhig && Math\.abs\(vPx\) >= RK_SCHNELL/.test(zug), "Rolle: schnell nur ohne „weniger Bewegung“");
assert.ok(/schwung = rkSchwungKarten\(Math\.abs\(weg\) \/ dt, rkRuhig\(\)\)/.test(app), "klassisch: gleiche Rechnung");
assert.ok(/const dauer = Math\.min\(1500, /.test(app) && /e = 1 - Math\.pow\(1 - t, 3\); \/\/ sanft auslaufen/.test(app), "sanft auslaufend");
assert.ok(/if \(rkRuhig\(\) \|\| Math\.abs\(weg\) < 0\.001\) \{ z\.p = ziel;/.test(app), "weniger Bewegung: direkt einrasten");
assert.ok(/const rkRuhig = \(\) => \{ try \{ return !fxAn\(\) \|\| schlafWenigBewegung\(\);/.test(app) && /prefers-reduced-motion: reduce/.test(app), "prefers-reduced-motion beachtet");
const rad = teil("function rkRad(", "function rkZu(");
assert.ok(/if \(Math\.abs\(d\) >= 50\) \{[^}]*rkGehe\(z, z\.i \+ Math\.sign\(d\), Math\.sign\(d\)\)/.test(rad), "Mausrad: ein Raster = eine Karte");
assert.ok(/e\.deltaMode === 1 \? 33/.test(rad) && /z\.radSumme/.test(rad), "Zeilen umgerechnet, Touchpad gesammelt");

// 3. Schloss: sperrt Rollen, Gummiband, Hinweis, Sitzung
assert.ok(app.includes('const RK_FEST_TEXT = "🔒 Karte festgestellt – zum Weiterrollen erst das Schloss öffnen";'), "Hinweistext");
assert.ok(/const RK_FEST = \{\};/.test(app) && !/localStorage[^\n]*RK_FEST|RK_FEST[^\n]*localStorage/.test(app), "nur Arbeitsspeicher (Sitzung), kein Gerätespeicher");
const gehe = teil("function rkGehe(", "function rkRad(");
assert.ok(/if \(rkFest\(z\)\) \{ rkFestHinweis\(z, [^)]*\)\); return false; \}/.test(gehe), "rkGehe (▲▼, Reiter, Mausrad, klassisches Wischen) gesperrt");
assert.ok(gehe.indexOf("rkFest(z)") < gehe.indexOf("if (z.rolle)"), "Sperre vor dem Rollen");
assert.ok(/if \(rest && rkFest\(z\)\) \{ g\.gummi = \(g\.gummi \|\| 0\) \+ rest; g\.gesperrt = true; rest = 0; gummi\(\); \}/.test(zug), "Finger: nur Gummiband");
assert.ok(zug.indexOf('if (g.modus === "innen")') >= 0 && zug.indexOf('if (g.modus === "innen")') < zug.indexOf("if (rest && rkFest(z))"), "Inhalt der Karte scrollt weiter (auch festgestellt)");
assert.ok(/if \(g\.gesperrt\) \{[^\n]*rkFestHinweis\(z, /.test(zug), "Loslassen: zurückfedern + Hinweis");
const hinweis = teil("function rkFestHinweis(", "function rkFestSchalten(");
assert.ok(/melde\(RK_FEST_TEXT\)/.test(hinweis) && /translate/.test(hinweis) && /!rkRuhig\(\)/.test(hinweis), "kurzer Hinweis, Gummiband nur mit Bewegung");
const aufbau = teil("function rkAufbauen(", "function rkAbbauen(");
assert.ok(/b\.className = "rk-fest"/.test(aufbau) && /e\.preventDefault\(\); e\.stopPropagation\(\); rkFestSchalten\(/.test(aufbau), "Schloss in jeder Karte, klappt nichts");
assert.ok(/const festI = RK_FEST\[z\.schluessel\] \?/.test(aufbau) && /if \(festI >= 0\) \{ z\.i = festI; if \(z\.rolle && !z\.lauf\) z\.p = festI; \}/.test(aufbau), "festgestellte Karte bleibt vorn beim erneuten Öffnen");
assert.ok(/if \(still\) \{ if \(z\.rolle && !z\.lauf\) z\.p = z\.i; rkMasse\(z\); \}/.test(app), "Rolle: Lage vor dem Messen gesetzt (sonst springt sie auf die alte Karte)");
assert.ok(/if \(altId && !rkFest\(z\)\)/.test(app), "Neuzeichnen (Chats/Mitglieder) behält die festgestellte Karte");
const zeigen = teil("function rkFestZeigen(", "function rkKarten(");
assert.ok(/aria-pressed/.test(zeigen) && /aria-label/.test(zeigen) && /🔒<\/span><span aria-hidden="true">fest/.test(zeigen) && /🔓<\/span><span aria-hidden="true">frei/.test(zeigen), "barrierefrei: aria-pressed / aria-label, 🔓/🔒");
assert.ok(/\.rk-karte > summary > \.rk-fest"\)\.forEach\(\(b\) => b\.remove\(\)\)/.test(app), "Abbauen entfernt das Schloss");

// reine Prüfung rkFest mit Testdaten
const rkKarteId = new Function("return " + app.match(/const rkKarteId = (\(z, d\) => [^\n;]*);/)[1])();
const rkFest = new Function("RK_FEST", "rkKarteId", "return " + app.match(/const rkFest = (\(z\) => [^\n;]*);/)[1])({ chats: "U2" }, rkKarteId);
const karte = (id) => ({ dataset: { id, klappe: "uhk" } });
const z = { schluessel: "chats", opts: { id: (d) => d.dataset.id }, karten: [karte("U1"), karte("U2")], i: 1 };
assert.equal(rkFest(z), true, "festgestellte Karte vorn → gesperrt");
assert.equal(rkFest({ ...z, i: 0 }), false, "andere Karte vorn → frei");
assert.equal(rkFest({ ...z, schluessel: "mitgl" }), false, "je Kartei getrennt");

// 4. Aussehen: gelb, oben rechts neben „?“, nicht überlappend
assert.ok(/:is\(\.rk, \.rk-box\) > \.rk-karte > summary:has\(> \.rk-fest\) \{ padding-right: 66px;/.test(html), "Platz rechts – „?“ rückt links daneben");
assert.ok(/\.rk-fest \{ position: absolute; right: 8px;[^}]*pointer-events: auto;/.test(html) && /\.rk-fest\.zu \{ background: #f5c400;/.test(html), "gelbes Schloss, antippbar");
assert.ok(/run: node tests\/rollkartei-schloss\.test\.mjs/.test(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8")), "läuft in tests.yml");
console.log("✅ rollkartei-schloss: alle Prüfungen bestanden");

// KC-CLUB-ROLLKARTEI-SCHLOSS-FIX (Fund Hansi nach 3.11.0 am Android-Handy: Schloss schlecht erkennbar; schnell/langsam wischen ging nicht)
{
  // Wischtempo aus den letzten 100 ms – reine Rechnung mit Beispielspuren (16-ms-Schritte wie am Handy)
  const tempo = new Function(teil("function rkWischTempo(", "const rkRuhig") + "; return rkWischTempo;")();
  const spur = (px, ms) => Array.from({ length: Math.round(ms / 16) + 1 }, (_, k) => [1000 + k * 16, 600 - (px * k * 16) / ms]);
  const langsam = spur(150, 400), schnell = spur(300, 120);
  const vl = tempo(langsam, langsam.at(-1)[0] + 5), vs = tempo(schnell, schnell.at(-1)[0] + 5);
  assert.ok(Math.abs(vl - 0.375) < 0.05, "langsam 150 px / 400 ms ≈ 0,375 px/ms: " + vl);
  assert.ok(Math.abs(vs - 2.5) < 0.2, "schnell 300 px / 120 ms ≈ 2,5 px/ms: " + vs);
  assert.equal(karten(vl), 1, "langsam = eine Karte"); assert.ok(karten(vs) >= 6 && karten(vs) <= 9, "schnell = mehrere Karten: " + karten(vs));
  assert.equal(tempo(langsam, langsam.at(-1)[0] + 150), 0, "Finger lag still → kein Schwung");
  const bremsen = [...spur(300, 120), [1200, 300], [1216, 300], [1232, 300], [1248, 300], [1264, 300], [1280, 300], [1296, 300], [1312, 300]];
  assert.ok(Math.abs(tempo(bremsen, 1315)) < 0.05, "nur die letzten 100 ms zählen (abgebremst → langsam)");
  assert.ok(tempo([[0, 500], [16, 600]], 20) < 0, "nach unten = negativ (zurück)");
  assert.equal(tempo([], 0), 0); assert.equal(tempo([[0, 1]], 1), 0);
  // Finger über Touch: touchmove nicht passiv, preventDefault; Pointer nur Maus/Stift
  assert.ok(/w\.addEventListener\("touchmove", z\.rtm = [^\n]*e\.preventDefault\(\); \}, \{ passive: false \}\);/.test(zug), "touchmove nicht passiv – die Geste gehört der Kartei");
  assert.ok(/z\.pd = \(e\) => \{ if \(e\.pointerType !== "touch"/.test(zug) && /z\.pm = \(e\) => \{ if \(e\.pointerType === "touch"\) return;/.test(zug), "Pointer nur für Maus/Stift");
  assert.ok(/\["touchstart", z\.rts\], \["touchmove", z\.rtm\], \["touchend", z\.rte\], \["touchcancel", z\.rtc\]/.test(app), "Abbauen entfernt die Touch-Ereignisse");
  assert.ok(/const vPx = abbruch \? 0 : rkWischTempo\(g\.spur, zeit\);/.test(zug) && /const zt = \(e\) => \{ const t = e\?\.timeStamp/.test(zug) && /rkZieh\(g\.id, "t", t\.clientX, t\.clientY, zt\(e\)\)/.test(zug), "Tempo aus der Spur (100 ms) mit Zeitstempel des Ereignisses");
  assert.ok(/Math\.abs\(weg \* schritt\) > 30 \? Math\.sign\(weg\) : 0/.test(zug), "langsam: ab 30 px genau eine Karte");
  assert.ok(/g\.modus = n && ganz0 && \(vor \? n\.scrollTop \+ n\.clientHeight < n\.scrollHeight - 2 : n\.scrollTop > 0\) \? "innen" : "rolle";/.test(zug), "Inhalt nur, wenn die Geste darin beginnt und er nicht am Rand ist");
  assert.ok(/ziel\?\.closest\?\.\("input, textarea, select, \[contenteditable\]"\)\) return;/.test(zug), "Eingabefelder bleiben normal bedienbar");
  assert.ok(/\.rk\.rk-rolle > \.rk-karte \*, \.rk\.rk-rolle \.rk-platz \* \{ touch-action: pan-x; \}/.test(html), "senkrecht kein natives Scrollen über dem Stapel");
  // Schloss deutlich: zwei Zustände mit Wort, Kontrast ≥ 3:1 gegen die Karte (hell und dunkel)
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const kontrast = (a, b) => { const L = (h) => { const [r, g, bl] = hex(h); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; }; const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const css = (re) => html.match(re)?.[1];
  const aufRand = css(/\.rk-fest \{[^}]*border: 2px solid (#[0-9a-f]{6})/), zuRand = css(/\.rk-fest\.zu \{[^}]*border: 3px solid (#[0-9a-f]{6})/), zuFuell = css(/\.rk-fest\.zu \{ background: (#[0-9a-f]{6})/);
  const dAuf = css(/:root\.dunkel \.rk-fest:not\(\.zu\) \{[^}]*border-color: (#[0-9a-f]{6})/), dZu = css(/:root\.dunkel \.rk-fest\.zu \{ border-color: (#[0-9a-f]{6})/);
  assert.equal(zuFuell, "#f5c400", "zu = gelb gefüllt");
  assert.ok(kontrast(aufRand, "#ffffff") >= 3 && kontrast(zuRand, "#ffffff") >= 3, "hell: Ränder ≥ 3:1");
  assert.ok(kontrast(dAuf, "#2a2021") >= 3 && kontrast(zuFuell, "#2a2021") >= 3 && kontrast(dZu, "#2a2021") >= 3, "dunkel: ≥ 3:1");
  assert.ok(/\.rk-fest \{[^}]*width: 50px; height: 48px;/.test(html), "groß genug (≥ 44 px)");
  assert.ok(/melde\(zu \? "🔒 festgestellt" : "🔓 frei"\)/.test(app), "kurze Bestätigung beim Umschalten");
  assert.ok(/\.replace\(\/\\s\*\[🔓🔒\]\(frei\|fest\)\$\/u, ""\)/.test(app), "Reiter-Namen ohne Schloss-Wort");
}
console.log("✅ rollkartei-schloss-fix: alle Prüfungen bestanden");
