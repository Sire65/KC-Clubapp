// KC-CLUB-SPUR-FEE (2.855.0, Wunsch Hansi 04.11.2026 „bau den Spruch mit in die Wege ein“). Aufruf: node tests/spur-fee.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), srv = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const fee = app.slice(app.indexOf("function feeSpruch() {"), app.indexOf("// 3) 📌 neuer Pinnwand-Zettel"));
assert.ok(/const nr = Math\.floor\(Math\.random\(\) \* FEE_SPRUECHE\.length\), s = FEE_SPRUECHE\[nr\];/.test(fee), "Spruch-Nummer gemerkt");
assert.ok(/b\.dataset\.spurSelbst = "1"; spur\("fenster", "feeBlatt:" \+ nr\);/.test(fee), "ein Wege-Eintrag mit Nummer (statt des allgemeinen Fenster-Eintrags)");
assert.ok(/&& !el\.dataset\.spurSelbst\) spur\("fenster", el\.id\);/.test(app), "allgemeiner Fenster-Eintrag entfällt nur für Fenster, die sich selbst melden");
assert.ok(/const fee = \/\^feeBlatt:\(\\d\+\)\$\/\.exec\(k \|\| ""\); if \(fee\) \{ const s = FEE_SPRUECHE\[Number\(fee\[1\]\)\]; return s \? `\$\{FENSTER_NAMEN\.feeBlatt\}: „\$\{s\}“` : FENSTER_NAMEN\.feeBlatt; \}/.test(app), "Wege zeigen den Spruch");
assert.ok(/\/\^feeBlatt:\/\.test\(k \|\| ""\) \? "feeBlatt" : k/.test(app), "„Was nutzt jeder?“ zählt alle Sprüche als ein Fenster");
// Server: nur Kennungen, nie freier Text – „feeBlatt:<nr>“ muss durchgehen
const kennung = new RegExp(/const SPUR_KENNUNG = \/(.+)\/;/.exec(srv)[1]);
assert.ok(kennung.test("feeBlatt:0") && kennung.test("feeBlatt:31") && !kennung.test("Du bist toll"), "Server nimmt die Kennung, aber keinen Text");
console.log("spur-fee: ok");
