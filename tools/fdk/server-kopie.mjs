// KC-CLUB-FDK-MG (2.219.0): erzeugt supabase/functions/kc-club/fdk.js aus den Fang-den-Koch-Regeln in app.js.
// Eine Quelle (app.js) – der Server bekommt eine wörtliche Kopie; tests/app-vertrag.test.mjs prüft, dass beide gleich sind.
// Aufruf: node tools/fdk/server-kopie.mjs
import fs from "node:fs";
const app = fs.readFileSync(new URL("../../app.js", import.meta.url), "utf8");
const a = app.indexOf("const FDK_KEY = "), b = app.indexOf("// ----- FDK Regeln Ende -----", a);
if (a < 0 || b < 0) throw new Error("Fang-den-Koch-Regeln in app.js nicht gefunden");
fs.writeFileSync(new URL("../../supabase/functions/kc-club/fdk.js", import.meta.url),
  `// KC-CLUB-FDK-MG: Spielregeln Fang den Koch – wörtliche Kopie aus app.js (erzeugt von tools/fdk/server-kopie.mjs, nicht von Hand ändern)\n${app.slice(a, b).trimEnd()}\nexport { FDK_FELD, FDK_AKTION, fdkNeu, fdkOptionen, fdkZiehen, fdkWurfBeginn, fdkAugen, fdkWeiter, fdkKannSpielen, fdkKarteSpielen, fdkHygiene, fdkAbgeben, fdkSieger, fdkKiWahl, fdkKiKarte };\n`);
console.log("fdk.js geschrieben");
