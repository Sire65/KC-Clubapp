// KC-CLUB-BAUERNSKAT-MG (2.10.0): erzeugt supabase/functions/kc-club/bauernskat.js aus den Spielregeln in index.html.
// Eine Quelle (index.html) – der Server bekommt eine wörtliche Kopie; tests/app-vertrag.test.mjs prüft, dass beide gleich sind.
// Aufruf: node tools/bauernskat/server-kopie.mjs
import fs from "node:fs";
const html = fs.readFileSync(new URL("../../app.js", import.meta.url), "utf8"); // 2.24.8: Programm steht in app.js
const a = html.indexOf("const BSK_FARBEN = "), b = html.indexOf("// ----- Computer -----", a);
if (a < 0 || b < 0) throw new Error("Bauernskat-Regeln in index.html nicht gefunden");
const regeln = html.slice(a, b).trimEnd();
fs.writeFileSync(new URL("../../supabase/functions/kc-club/bauernskat.js", import.meta.url),
  `// KC-CLUB-BAUERNSKAT-MG: Spielregeln Bauernskat – wörtliche Kopie aus index.html (erzeugt von tools/bauernskat/server-kopie.mjs, nicht von Hand ändern)\n${regeln}\nexport { BSK_FARBEN, bskNeu, bskErlaubt, bskSpielen, bskStichAbschliessen, bskErgebnis, bskSumme };\n`);
console.log("bauernskat.js geschrieben");
