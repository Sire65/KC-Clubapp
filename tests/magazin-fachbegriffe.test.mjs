// KC-CLUB-MAGAZIN-FACHBEGRIFFE (Wunsch Hansi 12.11.2026 „Übersetzungen für Nicht-Fachleute … im Heft kann es in Klammern dahinter stehen“).
// Fachbegriffe bekommen beim ersten Vorkommen je Heftseite eine kurze Erklärung in Klammern. Aufruf: node tests/magazin-fachbegriffe.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const teil = fs.readFileSync(new URL("../teile/magazin.js", import.meta.url), "utf8"), html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const code = teil.slice(teil.indexOf("const MAG_ERKL_OHNE"), teil.indexOf("// Bausteine für die Heftseiten"));
const { magErklaeren, MAG_ERKL_OHNE } = new Function(code + "; return { magErklaeren, MAG_ERKL_OHNE };")();
const e = (s) => magErklaeren(s);
let r = e("<p>Die Zwiebel in Brunoise schneiden. Danach noch mehr Brunoise.</p>");
assert.equal(r, '<p>Die Zwiebel in Brunoise <span class="mag-erkl">(sehr kleine Würfel von 1–2 mm, etwa aus Karotte, Sellerie, Lauch oder Zwiebel)</span> schneiden. Danach noch mehr Brunoise.</p>', "nur beim ersten Vorkommen");
r = e("<h3>Julienne schneiden</h3><p>Möhren in Julienne schneiden.</p>");
assert.ok(/<h3>Julienne schneiden<\/h3>/.test(r) && /Julienne <span class="mag-erkl">\(feine Streifen\)<\/span> schneiden/.test(r), "Überschrift frei, erklärt im Text");
r = e("<p>Julienne (feine Streifen) und Mise en place: alles bereit.</p>");
assert.ok(!/mag-erkl/.test(r), "steht schon eine Erklärung dahinter, keine zweite");
r = e("<p>Bohnen blanchieren und abschrecken.</p>");
assert.equal((r.match(/mag-erkl/g) || []).length, 2, "zwei Begriffe, je eine Erklärung");
assert.ok(!/abschrecken <span[^>]*>\(sofort[^<]*<\/span><\/span>/.test(r), "Erklärungen werden nicht selbst erklärt");
r = e('<p>Beim Fondue gab es Fonds.</p><button onclick="x(\'Fond\')">Fond</button>');
assert.ok(!/mag-erkl/.test(r), "Wortgrenzen: Fondue/Fonds nicht, Knopf und Attribute bleiben unberührt");
r = e("<p>Die <b>Hollandaise</b> montieren.</p>");
assert.ok(/Hollandaise <span class="mag-erkl">/.test(r) && /montieren <span class="mag-erkl">/.test(r));
for (const id of ["roman", "latein", "raetsel"]) assert.ok(MAG_ERKL_OHNE.has(id), "ohne Erklärung: " + id);
assert.ok(/if \(!MAG_ERKL_OHNE\.has\(r\.id\)\) inhalt = magErklaeren\(inhalt\);/.test(teil), "in jeder Rubrikseite angewendet");
assert.ok(html.includes(".mag-erkl {"), "eigener Stil");
console.log("magazin-fachbegriffe: ok");
