// KC-CLUB-HEFT-PC-DRUCK (Fund Hansi 12.11.2026: „Ich kann nicht selber drucken. Es kommt ein Fenster mit Freigeben, aber sonst passiert nix“).
// Am PC öffnet „Heft A5“/„Druckbögen“ die PDF in einem neuen Tab (Drucken im Browser), am Handy wie bisher das Teilen-Menü. Aufruf: node tests/heft-pc-druck.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const teil = fs.readFileSync(new URL("../teile/magazin.js", import.meta.url), "utf8");
const stueck = (anf, ende) => { const i = teil.indexOf(anf); assert.ok(i >= 0, anf); return teil.slice(i, teil.indexOf(ende, i)); };
const code = stueck("async function magHeftPdf(", "// Admin: Startnachricht an alle");

const lauf = async (ua, touch, { popup = true } = {}) => {
  const log = [];
  const tab = { closed: false, document: { write: () => log.push("schreiben") }, location: { set href(u) { log.push("tab:" + u); } }, close() { log.push("zu"); } };
  const nav = { userAgent: ua, maxTouchPoints: touch, canShare: () => true };
  const win = { open: () => { log.push("open"); return popup ? tab : null; } };
  const doc = { createElement: () => ({ click: () => log.push("download"), remove() {} }), body: { appendChild() {} } };
  const f = new Function("navigator", "window", "document", "MAGH", "magHeftBauen", "magHeftBoegen", "pdfAusCanvas", "teilenMitRueckfall", "melde", "URL", "File", "setTimeout",
    code + "; return magHeftPdf;")(nav, win, doc, { cache: { nr: 1, seiten: [1, 2] } }, () => log.push("bauen"), (s) => s, () => "PDF",
    async () => log.push("teilen"), (t) => log.push("melde:" + t), { createObjectURL: () => "blob:x", revokeObjectURL() {} }, class { constructor(b, n) { this.name = n; } }, () => {});
  await f(1, "boegen");
  return log;
};
const PC = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0";
const HANDY = "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Mobile Safari/537.36";
const IPAD = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";

let l = await lauf(PC, 0);
assert.equal(l[0], "open", "am PC den Tab sofort beim Tippen öffnen (sonst Pop-up-Sperre)");
assert.ok(l.includes("tab:blob:x") && !l.includes("teilen") && !l.includes("download"), "PC: PDF im Tab, kein „Freigeben“");
assert.ok(l.some((x) => /Drucken \(oder Strg\+P\)\. Beidseitig, Wenden an der kurzen Kante/.test(x)), "Hinweis zum Drucken");
l = await lauf(PC, 0, { popup: false });
assert.ok(l.includes("download") && !l.includes("teilen"), "Pop-up gesperrt → speichern");
l = await lauf(HANDY, 5);
assert.ok(!l.includes("open") && l.includes("teilen"), "Handy: Teilen-Menü wie bisher");
l = await lauf(IPAD, 5);
assert.ok(!l.includes("open") && l.includes("teilen"), "iPad im Desktop-Modus zählt als Tablet");
l = await lauf("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15", 0);
assert.ok(l.includes("tab:blob:x"), "Mac ohne Touch = PC");
assert.ok(/<b>Am PC:<\/b> die PDF öffnet sich in einem neuen Tab/.test(teil), "Erklärung im Heft-Fenster");
console.log("✅ heft-pc-druck: alle Prüfungen bestanden");
