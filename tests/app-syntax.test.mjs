// KC-CLUB-APP-SYNTAX (20.11.2026): app.js, sw.js und alle teile/*.js müssen sich übersetzen lassen – sonst startet die App gar nicht.
// Anlass: ein Kommentar mitten in einer Zeile hatte den Rest „verschluckt“; die übrigen Tests lesen nur Text und merkten es nicht.
// Aufruf: node tests/app-syntax.test.mjs
import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";
const wurzel = new URL("../", import.meta.url);
const dateien = ["app.js", "sw.js", "dp2-club/lader.js", ...readdirSync(new URL("teile/", wurzel)).filter((f) => f.endsWith(".js")).map((f) => "teile/" + f)];
let fehler = 0;
for (const f of dateien) {
  try { new vm.Script(readFileSync(new URL(f, wurzel), "utf8"), { filename: f }); }
  catch (e) { fehler++; console.error(`FEHLER ${f}: ${e.message}\n${String(e.stack).split("\n").slice(0, 3).join("\n")}`); }
}
if (fehler) process.exit(1);
console.log(`app-syntax: ${dateien.length} Dateien übersetzbar`);
