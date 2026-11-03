// KC-CLUB-VIDEO-DAUER (Wunsch Hansi 03.11.2026). Aufruf: node tests/video-dauer.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const v = fs.readFileSync(new URL("../teile/videos.js", import.meta.url), "utf8");
const f = new Function(v.slice(v.indexOf("const rgDauerText"), v.indexOf("const rgOhneMin")) + v.slice(v.indexOf("const rgOhneMin"), v.indexOf("\n", v.indexOf("const rgOhneMin"))) + "; return { rgDauerText, rgHalbe, rgOhneMin };")();
assert.equal(f.rgDauerText(40), "unter 1 Min."); assert.equal(f.rgDauerText(60), "ca. 1 Min."); assert.equal(f.rgDauerText(95), "ca. 1½ Min."); assert.equal(f.rgDauerText(0), "");
assert.equal(f.rgHalbe(10), "½"); assert.equal(f.rgOhneMin("Suchen, Einkaufsliste (ca. 1 Min.)"), "Suchen, Einkaufsliste");
assert.ok(v.includes('<small class="rgl-dauer">⏱️ ${rgDauerText(rgDauerSek(r))}</small>'), "Dauer an jedem Video");
assert.ok(v.includes("rgSpanne(x.liste)") && v.includes("nacheinander abspielen · ⏱️ ${rgDauerText("), "Spanne je Thema, Summe beim Abspielen der angehakten");
assert.ok(/Math\.max\(1\.875 \+ 0\.315 \* w, 0\.4 \* w \/ tempo\) \+ 1\.2/.test(v), "wie der Abspieler rechnet, mit Tempo");
console.log("video-dauer: ok");
