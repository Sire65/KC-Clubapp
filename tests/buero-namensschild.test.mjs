// KC-CLUB-BUERO-NAMENSSCHILD (Wunschliste #75), 2.834.0. Aufruf: node tests/buero-namensschild.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const bu = fs.readFileSync(new URL("../teile/buero.js", import.meta.url), "utf8"), html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(bu.includes('<span class="bu-mon-fuss"></span>${buNamensschild()}<span class="bu-olabel">Bildschirm</span>'), "Schild unter dem Bildschirm");
assert.ok(bu.includes('amt = a.find((x) => !/^admin$/i.test(x)) || a[0] || ""'), "erstes Amt, Admin nur ohne anderes");
assert.ok(bu.includes('const BU_LAMPE_MODUS = { tag: ["T", "Tag"], nacht: ["N", "Nacht"], auto: ["A", "Automatik"] };') && bu.includes('<span class="bu-lampe-modus"'), "T/N/A an der Lampe");
// Funktion ausprobieren
const f = new Function("ICH", "esc", bu.slice(bu.indexOf("function buNamensschild()"), bu.indexOf("// 💡 Lampe: schaltet")) + "; return buNamensschild();");
const e = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
assert.match(f({ name: "Klaus Zander", aemter: ["Admin", "Clubsprecher"] }, e), /<b>Klaus Zander<\/b><small>Clubsprecher<\/small>/);
assert.match(f({ name: "Hansi", aemter: ["Admin"] }, e), /<small>Admin<\/small>/);
assert.ok(!f({ name: "Eva", aemter: [] }, e).includes("<small>"));
assert.ok(/\.bu-namensschild \{[^}]*#d4af37/.test(html), "golden");
console.log("buero-namensschild: ok");
