// KC-CLUB-SPRACHE (10.11.2026, Wunsch Hansi „Flagge … Bedienelemente auf Englisch, nicht die Inhalte … Begrüßung Good morning Hans“).
// Aufruf: node tests/sprache.test.mjs (offline). Browser-Prüfung: tools/hilfe/sprache-browser.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), html = lies("index.html"), teil = lies("teile/sprache.js"), sw = lies("sw.js");
// eine Flagge im Kopf, Pfeile etwas nach links
assert.match(html, /<button type="button" class="sp-knopf" id="spKnopf" onclick="spracheUmschalten\(\)"/);
assert.match(html, /\.kopf-pfeil\.kp-halb \{ left: calc\(50% - 62px\); \} \.kopf-pfeil\.kp-ganz \{ left: calc\(50% - 6px\); \}/);
assert.match(html, /\.sp-knopf \{ position: absolute; top: 0; right: 98px;/, "Flagge zwischen Pfeilen und Verbindungs-Balken");
// nur geladen, wenn jemand Englisch wählt; je Gerät gemerkt
assert.match(app, /\n  sprache: \{ einstieg: \["spracheEnglisch", "spracheDeutsch"\], sri: "sha384-[^"]+" \}/);
assert.match(sw, /sprache: "[\w-]{16}"/);
assert.match(app, /const spracheEn = \(\) => einst\("englisch", false\);/);
assert.match(app, /einstellung\("englisch", !spracheEn\(\)\)/);
// Begrüßung
assert.match(app, /"Good morning" : h >= 12 && h < 18 \? "Good afternoon" : "Good evening"/);
assert.equal((app.match(/\$\("begruessung"\)\.textContent = kopfGruss\(\);/g) || []).length, 3, "alle Begrüßungen über kopfGruss");
// nur Bedienelemente, Inhalte nie
assert.match(teil, /const SP_NIE = "#chat, \.chat, \.nachricht, [^"]*input, textarea, select, \[contenteditable\]/);
assert.match(teil, /const SP_FUSS = \{ "Start": "Home" \};/, "„Start“ → „Home“ nur in der Leiste unten");
assert.doesNotMatch(teil.slice(teil.indexOf("const SP_EN"), teil.indexOf("const SP_FUSS")), /"Start":/, "„▶ Start“ in Spielen bleibt");
assert.doesNotMatch(teil, /\bapi\(|fetch\(/, "Umschalten fragt nichts beim Server an");
// Wörterbuch: nur Text → Text, keine doppelten Schlüssel
const dict = teil.slice(teil.indexOf("const SP_EN = {"), teil.indexOf("\n};", teil.indexOf("const SP_EN = {")));
const schl = [...dict.matchAll(/"([^"]+)": "/g)].map((m) => m[1]);
for (const [, k, v] of dict.matchAll(/"([^"]+)": "([^"]*)"/g)) assert.ok(!v.includes("=") || k.includes("="), `Eintrag „${k}“ falsch eingelesen (= im Wert)`);
assert.equal(new Set(schl).size, schl.length, "kein Begriff doppelt: " + schl.filter((x, i) => schl.indexOf(x) !== i).join(", "));
assert.ok(schl.length >= 140, "Wörterbuch Stufe 1 vollständig (" + schl.length + ")");
// Erklärvideos (deutsch gesprochen, finden Knöpfe am deutschen Text): während des Videos Bedienung deutsch, danach wieder English
const vid = lies("teile/videos.js");
assert.match(vid, /spracheEn\(\) && typeof spracheDeutsch === "function" && !spracheDeutsch\._teil\) \{ spracheDeutsch\(\); RG\.warEn = true; \}/);
assert.match(vid, /if \(RG\.warEn\) \{ RG\.warEn = false; setTimeout\(\(\) => \{ if \(!RG\.an && spracheEn\(\)\) spracheEnglisch\(\); \}, 0\); \}/);
// Teil-Namen dürfen keine Namen aus app.js überdecken (sonst „already declared“ – beim Bau zweimal passiert: SP, SPR)
const oben = [...teil.matchAll(/^(?:const|let|var|function|async function) ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]);
for (const n of oben) assert.doesNotMatch(app, new RegExp(`^(?:const|let|var|function|async function) ${n.replace("$", "\\$")}\\b|^let [^;\\n]*\\b${n}\\b\\s*=`, "m"), `Name ${n} gibt es schon in app.js`);
// allgemein: kein Teil darf einen Namen aus app.js oder einem anderen Teil noch einmal anlegen (sonst lädt das Teil nicht)
const namen = (t) => new Set([...t.matchAll(/^(?:const|let|var|function|async function) ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]));
const appN = namen(app), gesehen = new Map();
for (const f of fs.readdirSync(new URL("../teile", import.meta.url)).filter((x) => x.endsWith(".js"))) for (const n of namen(lies("teile/" + f))) {
  assert.ok(!appN.has(n), `teile/${f}: ${n} gibt es schon in app.js`); assert.ok(!gesehen.has(n), `teile/${f}: ${n} gibt es schon in teile/${gesehen.get(n)}`); gesehen.set(n, f); }
console.log("sprache: alles grün (" + schl.length + " Begriffe)");
