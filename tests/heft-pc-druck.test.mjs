// KC-CLUB-HEFT-PC-DRUCK (Fund Hansi 12.11.2026: „Ich kann nicht selber drucken. Es kommt ein Fenster mit Freigeben, aber sonst passiert nix“)
// und KC-CLUB-HEFT-PC-DRUCK-2 („der Ausdruck klappt nicht, es ist nur eine Seite rausgekommen am PC“): am PC kein vorab geöffneter Tab mehr
// (der zeigte nur „⏳ Die PDF wird erstellt …“ = eine Seite), sondern Knöpfe im Heft-Fenster, wenn die fertige PDF da ist: Drucken, Öffnen, Speichern.
// Am Handy/Tablet wie bisher das Teilen-Menü. Aufruf: node tests/heft-pc-druck.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const teil = fs.readFileSync(new URL("../teile/magazin.js", import.meta.url), "utf8");
const stueck = (anf, ende) => { const i = teil.indexOf(anf); assert.ok(i >= 0, anf); return teil.slice(i, teil.indexOf(ende, i)); };
const code = stueck("async function magHeftPdf(", "// Admin: Startnachricht an alle");

const lauf = async (ua, touch, art = "boegen") => {
  const log = [], kn = { innerHTML: "" };
  const nav = { userAgent: ua, maxTouchPoints: touch, canShare: () => true };
  const win = { open: () => { log.push("open"); return null; } };
  const doc = { createElement: () => ({ click: () => log.push("download"), remove() {}, setAttribute() {}, style: {} }), body: { appendChild() {} }, getElementById: () => null };
  const f = new Function("navigator", "window", "document", "MAGH", "magHeftBauen", "magHeftBoegen", "pdfAusCanvas", "teilenMitRueckfall", "melde", "URL", "File", "setTimeout", "$",
    code + "; return { magHeftPdf, MAGHP };")(nav, win, doc, { cache: { nr: 1, seiten: [1, 2, 3, 4] } }, () => log.push("bauen"), (s) => s.slice(0, 2), (c, quer, s) => { log.push("pdf:" + s.length); return "PDF"; },
    async () => log.push("teilen"), (t) => log.push("melde:" + t), { createObjectURL: () => "blob:x", revokeObjectURL() {} }, class { constructor(b, n) { this.name = n; } }, () => {}, () => kn);
  await f.magHeftPdf(1, art);
  return { log, html: kn.innerHTML, MAGHP: f.MAGHP };
};
const PC = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0";
const HANDY = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36";
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";

let r = await lauf(PC, 0);
assert.ok(!r.log.includes("open"), "PC: kein vorab geöffneter Tab mehr (der druckte nur die Platzhalter-Seite)");
assert.ok(!r.log.includes("teilen") && !r.log.includes("download"), "PC: kein „Freigeben“, nicht ungefragt speichern");
assert.ok(r.log.includes("pdf:2"), "Druckbögen: alle Bögen in der PDF");
assert.ok(/onclick="magHeftDrucken\(\)">🖨️ PDF anzeigen und drucken/.test(r.html) && /href="blob:x" target="_blank"/.test(r.html) && /magHeftSpeichern\(MAGHP\.datei\)/.test(r.html), "PC: Drucken, Öffnen, Speichern als Knöpfe");
assert.ok(/Seiten: Alle/.test(r.html) && /beidseitig/.test(r.html) && /kurzen Kante/.test(r.html), "Druckhinweis");
assert.equal(r.MAGHP.url, "blob:x");
r = await lauf(PC, 0, "a5");
assert.ok(r.log.includes("pdf:4") && /Heft A5 fertig: 4 Seiten/.test(r.html), "Heft A5: alle Seiten");
r = await lauf(HANDY, 5);
assert.ok(!r.log.includes("open") && r.log.includes("teilen") && !r.html, "Handy: Teilen-Menü wie bisher");
r = await lauf(IPAD, 5);
assert.ok(r.log.includes("teilen"), "iPad im Desktop-Modus zählt als Tablet");
r = await lauf("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15", 0);
assert.ok(/PDF anzeigen und drucken/.test(r.html), "Mac ohne Touch = PC");
assert.ok(/function magHeftDrucken\(\)/.test(teil) && !/contentWindow\.print\(\)/.test(teil) && /id = "magHeftAnsicht"/.test(teil) && /<iframe title="Heft als PDF" src="\$\{MAGHP\.url\}"/.test(teil), "KC-CLUB-HEFT-PC-DRUCK-3: PDF sichtbar anzeigen (kein unsichtbares print() – „Fehler beim Drucken“)");
assert.ok(/<b>Am PC:<\/b> nach dem Erstellen „🖨️ PDF anzeigen und drucken“/.test(teil), "Erklärung im Heft-Fenster");
console.log("✅ heft-pc-druck: alle Prüfungen bestanden");
