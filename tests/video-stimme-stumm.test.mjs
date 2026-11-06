// KC-CLUB-VIDEO-STIMME-STUMM (Fund Hansi 06.11.2026, Android: Tafel steht still, kein Ton – Google-Sprachausgabe antwortete nicht):
// beginnt die Handy-Stimme nicht innerhalb RG_STIMME_WARTE_MS, läuft das Video ohne Ton weiter und ein Hinweis empfiehlt Dii/Thorsten.
// Aufruf: node tests/video-stimme-stumm.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
const vi = fs.readFileSync("teile/videos.js", "utf8"), app = fs.readFileSync("app.js", "utf8");
const sp = vi.slice(vi.indexOf("function rgSprechen("), vi.indexOf("function rgLage("));
assert.ok(/const RG_STIMME_WARTE_MS = 5000;/.test(vi), "Wartezeit 5 s");
assert.ok(/u\.onstart = \(\) => \{ gestartet = true;/.test(sp), "erstes Wort wird erkannt");
assert.ok(/if \(gestartet \|\| lauf !== RG\.lauf \|\| !RG\.an \|\| RG\.pause\) return;/.test(sp) && /if \(speechSynthesis\.speaking\) return;/.test(sp), "nur wenn wirklich still (nicht bei Pause, neuer Station oder laufender Stimme)");
assert.ok(/RG\.ton = false; rgStummHinweis\(\);/.test(sp) && /clearTimeout\(RG\.uhr\); weiter\(\);/.test(sp), "ohne Ton weiter, Hinweis");
assert.ok(sp.indexOf("RG.stummUhr = setTimeout") > sp.indexOf("if (rgpAktiv())"), "geladene Stimme (Dii/Thorsten) ist nicht betroffen");
assert.ok(/Dii“ oder „Thorsten“ wählen/.test(vi) && /spur\("rg_stumm", RG\.tour\)/.test(vi) && /rg_stumm: "🔇 Erklär-Video: Handy-Stimme antwortete nicht/.test(app), "Hinweis und Spur");
assert.ok(/RG\.ton = "speechSynthesis" in window/.test(vi), "beim nächsten Video wird die Handy-Stimme wieder versucht");
console.log("video-stimme-stumm: alle Prüfungen bestanden");
