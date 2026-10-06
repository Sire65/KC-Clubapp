// KC-CLUB-MAE (2.26.0): erzeugt supabase/functions/kc-club/mae.js aus den Spielregeln in app.js.
// Eine Quelle (app.js) – der Server bekommt eine wörtliche Kopie; tests/app-vertrag.test.mjs prüft, dass beide gleich sind.
// Aufruf: node tools/mae/server-kopie.mjs
import fs from "node:fs";
const app = fs.readFileSync(new URL("../../app.js", import.meta.url), "utf8");
const a = app.indexOf("const MAE_FARBEN = "), b = app.indexOf("// ----- MAE Regeln Ende -----", a);
if (a < 0 || b < 0) throw new Error("Mensch-ärgere-dich-nicht-Regeln in app.js nicht gefunden");
const regeln = app.slice(a, b).trimEnd();
fs.writeFileSync(new URL("../../supabase/functions/kc-club/mae.js", import.meta.url),
  `// KC-CLUB-MAE: Spielregeln Mensch ärgere dich nicht – wörtliche Kopie aus app.js (erzeugt von tools/mae/server-kopie.mjs, nicht von Hand ändern)\n${regeln}\nexport { MAE_FARBEN, maeNeu, maeMoeglich, maeWuerfeln, maeZiehen, maeComputerWahl, maeZiel };\n`);
console.log("mae.js geschrieben");
