// KC-CLUB-SPUR-FEE (2.855.0, Wunsch Hansi 04.11.2026 „bau den Spruch mit in die Wege ein“). Aufruf: node tests/spur-fee.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), srv = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const fee = app.slice(app.indexOf("function feeSpruch() {"), app.indexOf("// 3) 📌 neuer Pinnwand-Zettel"));
assert.ok(/const nr = Math\.floor\(Math\.random\(\) \* FEE_SPRUECHE\.length\), s = FEE_SPRUECHE\[nr\];/.test(fee), "Spruch-Nummer gemerkt");
assert.ok(/b\.dataset\.spurSelbst = "1"; spur\("fenster", "feeBlatt:" \+ nr\);/.test(fee), "ein Wege-Eintrag mit Nummer (statt des allgemeinen Fenster-Eintrags)");
assert.ok(/&& !el\.dataset\.spurSelbst\) spur\("fenster", el\.id\);/.test(app), "allgemeiner Fenster-Eintrag entfällt nur für Fenster, die sich selbst melden");
assert.ok(app.includes('const fee = /^(feeBlatt|kaeferBlatt|kleeBlatt):(\\d+)$/.exec(k || ""); if (fee) { const s = { feeBlatt: FEE_SPRUECHE, kaeferBlatt: KAEFER_SPRUECHE, kleeBlatt: KLEE_SPRUECHE }[fee[1]][Number(fee[2])]; return s ? `${FENSTER_NAMEN[fee[1]]}: „${s}“` : FENSTER_NAMEN[fee[1]]; }'), "Wege zeigen den Spruch (Fee, 2.868.0 auch Marienkäfer und Glücksklee)");
assert.ok(app.includes('(/^(feeBlatt|kaeferBlatt|kleeBlatt):/.exec(k || "") || [])[1] || k'), "„Was nutzt jeder?“ zählt alle Sprüche als ein Fenster");
// Server: nur Kennungen, nie freier Text – „feeBlatt:<nr>“ muss durchgehen
const kennung = new RegExp(/const SPUR_KENNUNG = \/(.+)\/;/.exec(srv)[1]);
assert.ok(kennung.test("feeBlatt:0") && kennung.test("feeBlatt:31") && !kennung.test("Du bist toll"), "Server nimmt die Kennung, aber keinen Text");
console.log("spur-fee: ok");
