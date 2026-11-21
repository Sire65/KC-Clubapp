// 3.3.0 KC-CLUB-DP-PDF-MATRIX (21.11.2026, Wunsch Hansi „halbstündig, jetzt bauen“): Dienstplan-PDF – Besetzungsmatrix auch im verschickten
// Gesamtplan (halbstündig, Soll/eingeteilt, V/H, Ampel wie im Tagesraster, +1 🎵 bei Konzertzuschlag), zweizeiliger Kopf „8 Uhr“ über „:00 | :30“,
// halbe Lücken als Schrägstrich mit nur der betroffenen Hälfte rot (SVG, kein Verlauf).
// Aufruf: node tests/dp-pdf-matrix.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const stueck = (a, b) => { const i = app.indexOf(a), j = app.indexOf(b, i + 1); assert.ok(i > 0 && j > i, "Stelle fehlt: " + a); return app.slice(i, j); };

const block = stueck("const DPD_WD", "function dpdTabelle") + stueck("function dpdBedarf(", "async function dpdBauen(") + stueck("function dpdLueckenDaten(", "// ---------- 2.721.0");
const f = new Function("esc", "cdKopf", "cdFuss", "wann", block + "; return { dpdBedarf, dpdKopfHalb, dpdLueckenDaten, dpdLueckenBlatt, dpdHalbSvg };")(
  (s) => String(s), (t) => `<header>${t}</header>`, (t) => `<footer>${t}</footer>`, (x) => String(x));

// 1. Matrix im Dienstplan („plan“) als erstes Blatt, halbstündig, bei breit=2 links/rechts
const bauen = stueck("async function dpdBauen(", "\n}\n");
assert.ok(/html = \(art === "voll" \? bed \+ dpdLueckenBlatt\(d\) : art === "plan" \? bed : ""\) \+ blaetter\.flatMap/.test(bauen), "Matrix im Dienstplan als erstes Blatt");
assert.ok(/const bed = teile\.map\(\(teil, k\) =>[^\n]*dpdBedarf\(tage, von, bis, teil, k === teile\.length - 1\)/.test(bauen), "Matrix wie das Raster links/rechts geteilt");
assert.ok(/teile = breit === "2" \? \[S\.filter\(\(s\) => s < 16\), S\.filter\(\(s\) => s >= 15\.5\)\] : \[S\]/.test(bauen), "Teilung bei 15:30/16 Uhr erhalten");
assert.ok(/\+1 🎵<\/b> = Konzertabend/.test(bauen), "Legende erklärt den Konzertzuschlag");

// 2. Zellen: Soll/Ist, V/H, Ampel wie dpdTag, Konzertzuschlag
const tag = { art: "Markttag", wt: "Fr", dt: "04.12.", name: "Markttag", regel: "9–11", regelStd: 2, bedarfStd: 6,
  bedarf: [0, 0, 3, 3, 3, 3], besetzt: [0, 1, 3, 2, 4, 3], vorne: [null, null, 2, 2, 1, 1], hinten: [null, null, 1, 1, 1, 1], leute: [{ n: "A", w: "--pppp" }] };
const m = f.dpdBedarf([tag], 8, 11);
assert.equal((m.match(/<td class="(?:a-rot|a-gelb|a-gruen|zu|wu) h[vb]"/g) || []).length, 6, "eine Spalte je halbe Stunde");
assert.ok(m.includes('<td class="a-gelb hb"><b>0/1</b>'), "gelb zu viel – auch ohne Bedarf (wie dpdTag)");
assert.ok(m.includes('<td class="a-gruen hv"><b>3/3</b><small>2 V · 1 H</small></td>'), "grün passt, darunter V/H");
assert.ok(m.includes('<td class="a-rot hb"><b>3/2</b><small>2 V · 1 H</small></td>'), "rot fehlt");
assert.ok(m.includes('<td class="a-gelb hv"><b>3/4</b><small>1 V · 1 H</small><small class="zs">+1 🎵</small></td>'), "Konzertzuschlag erklärt V + H < Soll");
assert.ok(/\(1 V, 1 H, \+1 🎵\)/.test(m), "Zuschlag auch in den Zeitblöcken");
assert.ok(/<th rowspan="2">Tag<\/th><th rowspan="2">Regelzeit<\/th><th class="hk hv" colspan="2">8 Uhr<\/th>/.test(m) && /<tr class="hm"><th class="hm hv">:00<\/th><th class="hm hb">:30<\/th>/.test(m), "Kopf zweizeilig: 8 Uhr über :00 | :30");
const links = f.dpdBedarf([tag], 8, 11, [8, 8.5, 9, 9.5], false), rechts = f.dpdBedarf([tag], 8, 11, [9.5, 10, 10.5], true);
assert.ok(!/class="bd"/.test(links) && /class="bd"/.test(rechts) && /<th class="hk hv" colspan="1">9 Uhr<\/th>/.test(rechts), "Teilblätter: Zeitblöcke nur rechts, angeschnittene Stunde mit colspan 1");

// 3. Kopf zweizeilig in allen Halbstunden-Rastern
const K = f.dpdKopfHalb([15.5, 16, 16.5]);
assert.equal(K.oben, '<th class="hk hv" colspan="1">15 Uhr</th><th class="hk hv" colspan="2">16 Uhr</th>');
assert.ok(/K\.oben\}\$\{rechts \? '<th class="std" rowspan="2">Std\.<\/th>' : ""\}<\/tr><tr class="hm">\$\{K\.unten\}/.test(app), "Dienstplan-/Wunschplan-Raster mit zweizeiligem Kopf");
assert.ok(/<td class="\$\{cl\}\$\{dpdHk\(teil\[j\]\)\}">/.test(app), "Linien je Stunde/halbe Stunde im Raster");
assert.ok(/<th class="hk">\$\{h\} Uhr<small class="hh"><span>:00<\/span><span>:30<\/span><\/small><\/th>/.test(app), "Lücken-Blatt: 8 Uhr über :00 | :30");
assert.ok(/<em>:00<\/em><em>:30<\/em>/.test(app) && /i class="d"/.test(app), "Einsatzplan-Achse zweizeilig, gestrichelte Halbstundenlinie");
assert.ok(/#druck \.dpd-raster \.hv \{ border-left: \.35mm solid/.test(html) && /#druck \.dpd-raster \.hb \{ border-left: \.2mm dashed/.test(html) && /#druck \.dpd-bed \.hb \{ border-left: \.2mm dashed/.test(html), "kräftige Stunden-, gestrichelte Halbstundenlinie");

// 4. Halbe Lücke: Schrägstrich, nur betroffene Hälfte rot
const d = { von: 8, bis: 11, titel: "Test", tage: [{ d: "2026-12-04", art: "Markttag", leute: [], bedarf: [2, 2, 2, 2, 2, 0], fehlt: [1, 0, 0, 1, 1, 0] }] };
const L = f.dpdLueckenDaten(d);
assert.deepEqual(L.tage[0].zellen.map((z) => z.halb || 0), [1, 2, 1], "1 = erste Halbstunde fehlt, 2 = zweite");
assert.equal(L.tage[0].zellen[2].rest, "zu", "andere Hälfte ohne Dienst grau");
const blatt = f.dpdLueckenBlatt(d);
assert.ok(blatt.includes('<td class="halb h1"><svg class="dpl-halb"') && blatt.includes('<td class="halb h2"><svg class="dpl-halb"'), "Schrägstrich-Kästchen");
assert.ok(!blatt.includes("<sup>½</sup>"), "kein ½ mehr");
const s1 = f.dpdHalbSvg(1), s2 = f.dpdHalbSvg(2);
assert.ok(/<polygon points="0,0 10,0 0,10" fill="#f6d3d0"\/><polygon points="10,0 10,10 0,10" fill="#e3f1e6"\/>/.test(s1), "erste Hälfte: oben links rot");
assert.ok(/<polygon points="0,0 10,0 0,10" fill="#e3f1e6"\/><polygon points="10,0 10,10 0,10" fill="#f6d3d0"\/>/.test(s2), "zweite Hälfte: unten rechts rot");
assert.ok(/<line x1="10" y1="0" x2="0" y2="10"/.test(s1), "Schrägstrich");

// 5. Kein Verlauf (KC-CLUB-DRUCK-OHNE-STREIFEN)
const neu = stueck("function dpdKopfHalb(", "function dpdTabelle") + stueck("function dpdBedarf(", "async function dpdBauen(") + stueck("const dpdHalbSvg", "function dpdLueckenBlatt") + stueck("const dpeRl", "function dpdEinsatzBlatt");
assert.ok(!/gradient/i.test(neu + blatt + m), "kein Farbverlauf in den neuen Druckteilen");
const regeln = html.match(/#druck \.(?:dpd|dpl|dpe)[^{]*\{[^}]*\}/g) || [];
assert.ok(regeln.length > 40 && regeln.every((r) => !/gradient/.test(r)), "keine Verläufe in den Druckregeln");

console.log("OK – Dienstplan-PDF: Besetzungsmatrix, Kopf :00 | :30, halbe Lücken");
