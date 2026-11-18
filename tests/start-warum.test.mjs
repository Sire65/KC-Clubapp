// 2.976.0 KC-CLUB-START-WARUM (Wunsch Hansi 18.11.2026): beim Start sagen, WARUM es dauert und wie lange noch (Spiegelung, Notfall-Paket …)
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const teil = app.slice(app.indexOf("// 2.976.0 KC-CLUB-START-WARUM"), app.indexOf("const schwerOder = (text) =>"));
const { schwerLage } = new Function(app.slice(app.indexOf("function schwerLage("), app.indexOf("const schwerOder")).split("// 2.976.0 KC-CLUB-START-WARUM")[0] + "; return { schwerLage };")();
const Z = [{ art: "notpaket", was: "das Notfall-Paket gebaut", min: [9, 24, 39, 54], dauer: 2 }, { art: "spiegel", was: "die Sicherheitskopie (Spiegelung) erstellt", std: [4, 13, 22], von: 10, bis: 45 }];
assert.deepEqual(schwerLage(Z, new Date("2026-11-18T13:41:10Z")), { was: "die Sicherheitskopie (Spiegelung) erstellt", rest: 4 }, "Spiegelung: noch ca. 4 Minuten");
assert.deepEqual(schwerLage(Z, new Date("2026-11-18T15:24:30Z")), { was: "das Notfall-Paket gebaut", rest: 2 }, "Notfall-Paket: noch ca. 2 Minuten");
assert.equal(schwerLage(Z, new Date("2026-11-18T15:30:00Z")), null, "sonst nichts");
assert.ok(/localStorage\.setItem\(SCHWER_MERK, JSON\.stringify\(INIT\?\.schwerZeiten \|\| null\)\)/.test(app) && /schwerLage\(INIT\?\.schwerZeiten \|\| schwerZeitenGemerkt\(\)\)/.test(teil), "Zeiten vom letzten Start gemerkt – beim nächsten Start gleich bekannt");
assert.ok(/const swHinweis = !ICH \? setTimeout\(startWartetZeigen, 3000\) : 0;/.test(app) && /clearTimeout\(swHinweis\); startWartetWeg\(\);/.test(app), "nach 3 s Hinweis, weg sobald angemeldet");
assert.ok(/das dauert noch ca\. \$\{l\.rest\} Minute/.test(teil) && /Der Server antwortet gerade langsam/.test(teil), "Grund + Minuten, sonst ehrlich „langsam“");
assert.ok(/setInterval\(startWartetZeigen, 15000\)/.test(teil) && /role", "status"/.test(teil), "zählt herunter, für Vorlesen als Status");
assert.ok(/if \(ICH \|\| START_WARTET\?\.fertig\) return;/.test(teil), "nach dem Start nie wieder");
assert.ok(/melde\(startWartetText\(\) \|\| "⏳ Einen Moment – die App meldet dich noch an …"\)/.test(app), "Tippen während des Wartens: mit Grund");
console.log("start-warum: alle Prüfungen bestanden");
