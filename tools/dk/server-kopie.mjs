// KC-CLUB-DK-MG (2.219.0): erzeugt supabase/functions/kc-club/doppelkopf.js aus den Doppelkopf-Regeln in app.js.
// Eine Quelle (app.js) – der Server bekommt eine wörtliche Kopie; tests/app-vertrag.test.mjs prüft, dass beide gleich sind.
// Aufruf: node tools/dk/server-kopie.mjs
import fs from "node:fs";
const app = fs.readFileSync(new URL("../../app.js", import.meta.url), "utf8");
const zeile = (anfang) => { const i = app.indexOf(anfang); if (i < 0) throw new Error(anfang + " fehlt"); return app.slice(i, app.indexOf("\n", i)); };
const a = app.indexOf("const DK_TRUMPF = "), b = app.indexOf("// ----- DK Regeln Ende -----", a);
if (a < 0 || b < 0) throw new Error("Doppelkopf-Regeln in app.js nicht gefunden");
const kopf = [zeile("const BSK_FARBEN = "), zeile("const BSK_AUGEN = "), zeile("const DK_KEY = ")].join("\n");
fs.writeFileSync(new URL("../../supabase/functions/kc-club/doppelkopf.js", import.meta.url),
  `// KC-CLUB-DK-MG: Spielregeln Doppelkopf – wörtliche Kopie aus app.js (erzeugt von tools/dk/server-kopie.mjs, nicht von Hand ändern)\n${kopf}\n${app.slice(a, b).trimEnd()}\nexport { dkNeu, dkVorbehalt, dkErlaubt, dkSpielen, dkStichAbschliessen, dkErgebnis, dkComputerKarte, dkIstRe };\n`);
console.log("doppelkopf.js geschrieben");
