import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const read = (f) => fs.readFileSync(fileURLToPath(new URL("../" + f, import.meta.url)), "utf8");
const style = read("magazin/premium.css");
const index = read("index.html");
const worker = read("sw.js");
const magazin = read("teile/magazin.js");

test("Premium-Stylesheet ist in der App eingebunden und fuer Offline-Erststart vorgeladen", () => {
  assert.match(index, /<link rel="stylesheet" href="magazin\/premium\.css">/);
  assert.match(worker, /const DATEIEN = \[[^\n]+"magazin\/premium\.css"/);
  assert.equal((index.match(/href="magazin\/premium\.css"/g) || []).length, 1);
});

test("Editorial-Komponenten fuer Cover, Rubriken, Rezepte, Bilder und Roman", () => {
  for (const selector of [
    ".mag-titel:not(.wm-titel)", ".mag-schlagzeilen", ".mag-inhalt",
    ".mag-rezept", ".mag-fakten", ".mag-fotos", ".mag-roman",
    ".mag-roman-bild", ".mag-h", ".mag-kasten",
  ]) assert.ok(style.includes(selector), "Fehlt im Premium-CSS: " + selector);
  assert.match(style, /@media \(max-width: 520px\)/);
  assert.match(style, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(style, /@media print/);
});

test("Weihnachtsmarkt-Prospekt bleibt gruen und unveraendert im Look", () => {
  assert.match(style, /\.mag-titel:not\(\.wm-titel\)/);
  assert.match(style, /\.wm-seite \.mag-kopf\s*\{/);
  assert.match(style, /\.wm-seite \.mag-rumpf\s*\{/);
  assert.match(style, /\.wm-seite \.mag-h::after\s*\{ content: none; \}/);
  assert.match(style, /\.wm-seite \.mag-platz\s*\{/);
  assert.doesNotMatch(style, /@import\s+url\(/);
});

test("Magazinlogik fuer Blättern, Roman, Archiv und A5-Druck bleibt vorhanden", () => {
  for (const name of [
    "magStart(", "magSeiten(", "magRomanHtml(", "magArchiv(",
    "magHeftSeiten(", "magHeftPdf(", "magErschienen(",
  ]) assert.ok(magazin.includes(name), name + " fehlt");
  // Die grafische Aufwertung greift ausschliesslich in CSS/HTML-Kopfleiste ein,
  // nicht in die Manuskriptdatei oder die zeitgesteuerte Veröffentlichung.
  assert.match(magazin, /2027-01-01/);
  assert.match(magazin, /2027-12-01/);
});

test("CSS-Syntax: geschlossene Blockklammern ausserhalb von Kommentaren und Strings", () => {
  let level = 0, inComment = false, quote = null;
  for (let i = 0; i < style.length; i++) {
    const ch = style[i], next = style[i + 1];
    if (inComment) { if (ch === "*" && next === "/") { inComment = false; i++; } continue; }
    if (quote) { if (ch === "\\") i++; else if (ch === quote) quote = null; continue; }
    if (ch === "/" && next === "*") { inComment = true; i++; continue; }
    if (ch === "'" || ch === '"') { quote = ch; continue; }
    if (ch === "{") level++;
    if (ch === "}") { level--; assert.ok(level >= 0, "Unerwartete schliessende Klammer an Zeichen " + i); }
  }
  assert.equal(level, 0, "Nicht geschlossene CSS-Blöcke");
  assert.equal(inComment, false, "Unbeendeter CSS-Kommentar");
  assert.equal(quote, null, "Unbeendeter CSS-String");
});
