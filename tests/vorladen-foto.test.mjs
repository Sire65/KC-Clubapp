// KC-CLUB-TEILE-VORLADEN + KC-CLUB-FOTO-NOCHMAL (28.10.2026, Wunsch Hansi „Vorhin stockte das Programm“): Teile still im Voraus laden,
// leere Fotos einmal neu versuchen und sonst frische Links holen.
// Aufruf: node tests/vorladen-foto.test.mjs
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
assert.ok(/function teileVorladen\(\) \{/.test(app) && /setTimeout\(teileVorladen, TEILE_VORLADEN_MS\);/.test(app), "Teile werden nach dem Start vorgeladen");
assert.ok(/navigator\.onLine === false \|\| navigator\.connection\?\.saveData\) return;/.test(app), "nicht ohne Netz und nicht bei „Daten sparen“");
assert.ok(/TEILE_STAND\[name\] \|\| document\.hidden \? null : teilLaden\(name\)\.catch\(\(\) => \{\}\)/.test(app), "eins nach dem anderen, Fehler still");
assert.ok(/img\.closest\("\.fotoraster, \.fa-album, \.ifotos, \.qz-album"\)/.test(app), "Fotos im Album, bei Videos, im Quiz und auf der Infoseite");
assert.ok(/if \(!img\.dataset\.nochmal\) \{ img\.dataset\.nochmal = "1";/.test(app) && /\}, 1500\); return; \}/.test(app), "erst einmal neu versuchen");
assert.ok(/aktuelleAnsicht !== "fotos" \|\| Date\.now\(\) - FOTO_NOCHMAL\.zuletzt < 60000\) return;/.test(app) && /FOTO_NOCHMAL\.zuletzt = Date\.now\(\); fotosLaden\(true\);/.test(app), "dann frische Links, höchstens einmal pro Minute");
console.log("vorladen-foto: ok");
