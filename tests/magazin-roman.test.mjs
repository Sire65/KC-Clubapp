// KC-CLUB-MAGAZIN-ROMAN (06.11.2026): Fortsetzungsroman „Hinter dem Pass“ – Folge 1 von 12 in Club-Küche Nr. 1. Aufruf: node tests/magazin-roman.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const teil = lies("teile/magazin.js"), html = lies("index.html");
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const code = teil.slice(teil.indexOf("const MAG_START"), teil.indexOf("const MAG = {")) + "; const MAG = { jahr: 2027, monat: 1 };"
  + teil.slice(teil.indexOf("const MAG_RUBRIK_ART"), teil.indexOf("async function magStart"));
const { MAG_AUSGABEN, MAG_RUBRIKEN, magHeftHtml } = new Function("esc", "jsArg", code + "; return { MAG_AUSGABEN, MAG_RUBRIKEN, magHeftHtml };")(esc, JSON.stringify);
assert.ok(MAG_RUBRIKEN.some((r) => r.id === "roman" && r.t === "Fortsetzungsroman"), "Rubrik Fortsetzungsroman im Inhaltsverzeichnis");
const r = MAG_AUSGABEN[1].roman;
// Kopf wie in der Übergabe
assert.equal(r.reihe, "HINTER DEM PASS"); assert.equal(r.unter, "Ein Roman aus der Welt der Profiküche"); assert.equal(r.folge, 1); assert.equal(r.von, 12); assert.equal(r.titel, "Die Neue");
// vollständig: alle Zwischenüberschriften, Anfang und Schluss, Trüffelbestände 240 / 180 / 60
const h = r.text.filter(([a]) => a === "h").map(([, t]) => t);
assert.deepEqual(h, ["Ein Morgen voller Erwartungen", "Hinter den Kulissen", "Der junge Mann mit dem schiefen Lächeln", "Die erste gemeinsame Stunde", "Ein Blick, der Fragen aufwarf", "Wenn der Bondrucker erwacht", "Ein kleiner Fehler", "Ein Gespräch nach Feierabend", "Sechzig Gramm"]);
const alles = r.text.filter(([a]) => a === "p").map(([, t]) => t).join("\n");
assert.ok(alles.startsWith("Um sieben Minuten vor sieben stand Lena Hartmann") && /eine entscheidende Rolle spielen sollte\.$/.test(alles), "Anfang und Schluss");
assert.ok(alles.includes("**Périgord-Trüffel – 240 Gramm.**") && alles.includes("**180 Gramm.**") && alles.includes("Sechzig Gramm fehlten."), "Trüffelbestände");
assert.equal(r.text.length, 350, "nicht gekürzt: 9 Zwischenüberschriften + 341 Absätze"); assert.equal(alles.split(/\s+/).length, 2599, "nicht gekürzt: Wortzahl");
assert.equal(r.ende[0], "**Fortsetzung in der nächsten Ausgabe**");
// keine Spoiler, kein internes Material, nur Folge 1
for (const w of [/Sylt/i, /\bLuca\b/, /ehemalige Partnerin/i, /Figurenbibel\.md|handlungsbogen/i, /"folge":\s*[2-9]/]) assert.ok(!w.test(teil.replace("interne Planung (Figurenbibel, Handlungsbogen)", "")), "verboten: " + w);
// Darstellung: Bilder mit Alt-Text, fehlende Datei als Bildplatz, Ende abgesetzt
const out = magHeftHtml("roman", r);
assert.equal(r.bilder.length, 4); assert.ok(r.bilder.every((b) => b.alt && /^magazin\/roman\/0[1-5]-.+\.webp$/.test(b.datei)));
for (const b of r.bilder) assert.ok(out.includes(esc(b.alt.replace(/^Bleistiftskizze: /, ""))) || out.includes(esc(b.alt)), "Bild " + b.wo);
for (const b of r.bilder.filter((x) => x.da)) { const st = fs.statSync(new URL("../" + b.datei, import.meta.url)); assert.ok(st.size > 5000 && st.size < 200000, "Bild vorhanden und klein: " + b.datei); assert.ok(out.includes(`src="${b.datei}"`) && out.includes('loading="lazy"')); }
assert.ok(r.bilder.every((b) => b.da), "alle vier Skizzen eingesetzt");
assert.ok(out.includes('class="mag-roman-ende"') && out.includes("<b>Fortsetzung in der nächsten Ausgabe</b>"));
assert.ok(!/<p><\/p>/.test(out));
for (const k of [".mag-roman ", ".mag-roman-text ", ".mag-roman-bild ", ".mag-roman-ende "]) assert.ok(html.includes(k), "CSS " + k);
console.log("magazin-roman: ok");
