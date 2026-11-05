// KC-CLUB-TEILE (2.727.0): Fingerabdrücke (SRI, sha384) der Programmteile in app.js (TEILE_LISTE) eintragen.
// Aufruf nach jeder Änderung an teile/*.js: node tools/teile-pruefsumme.mjs   (der Vertragstest meldet, wenn es vergessen wurde)
import fs from "node:fs";
import { createHash } from "node:crypto";

const url = (p) => new URL("../" + p, import.meta.url);
let app = fs.readFileSync(url("app.js"), "utf8");
const geaendert = [];
for (const datei of fs.readdirSync(url("teile")).filter((f) => f.endsWith(".js")).sort()) {
  const name = datei.slice(0, -3), sri = "sha384-" + createHash("sha384").update(fs.readFileSync(url("teile/" + datei))).digest("base64");
  const re = new RegExp(`(\\n  ${name}: \\{ einstieg: \\[[^\\]]*\\], sri: ")[^"]*(")`);
  if (!re.test(app)) { console.error(`❌ teile/${datei}: kein Eintrag „${name}: { einstieg: […], sri: "…" }“ in TEILE_LISTE (app.js)`); process.exit(1); }
  const neu = app.replace(re, `$1${sri}$2`); if (neu !== app) geaendert.push(name); app = neu;
}
fs.writeFileSync(url("app.js"), app);
// 2.862.0 KC-CLUB-UPDATE-NUR-GEAENDERT: dieselben Teile mit Kurz-Fingerabdruck in sw.js (Adresse teile/<name>.js?h=…) – gleiche Rechnung wie teilKennung() in app.js
const kurz = (sri) => sri.slice(7, 23).replace(/\+/g, "-").replace(/\//g, "_");
const sriVon = (name) => new RegExp(`\\n  ${name}: \\{ einstieg: \\[[^\\]]*\\], sri: "([^"]*)"`).exec(app)[1];
let sw = fs.readFileSync(url("sw.js"), "utf8");
const namen = fs.readdirSync(url("teile")).filter((f) => f.endsWith(".js")).map((f) => f.slice(0, -3)).sort();
const swNeu = sw.replace(/const TEILE = \{[^}]*\};/, `const TEILE = { ${namen.map((n) => `${n}: "${kurz(sriVon(n))}"`).join(", ")} };`);
if (swNeu === sw && !/const TEILE = \{/.test(sw)) { console.error("❌ sw.js: „const TEILE = { … };“ nicht gefunden"); process.exit(1); }
if (swNeu !== sw) { fs.writeFileSync(url("sw.js"), swNeu); if (!geaendert.length) geaendert.push("sw.js"); }
console.log(geaendert.length ? `Fingerabdruck neu: ${geaendert.join(", ")}` : "Alle Fingerabdrücke stimmen.");
