// 2.952.0 KC-CLUB-BILDSCHIRMFOTO-OKLAB (Fund Hansi 15.11.2026: „Foto anhängen“ → „Attempting to parse an unsupported color function oklab“):
// echte Bibliothek (lib/html2canvas.min.js) + echte Glätt-Funktion aus app.js im abgeschirmten Browser mit modernen Farben.
// Aufruf: node tests/bildschirmfoto-farben.browser.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0";
const wurzel = new URL("..", import.meta.url);
const app = fs.readFileSync(new URL("app.js", wurzel), "utf8");
const glaetten = app.slice(app.indexOf("const BF_MODERN = "), app.indexOf("function bfVorschau() {"));
assert.ok(glaetten.includes("function bfKlonGlaetten(d)") && glaetten.includes("function bfFarbeRgba(f)"), "Glätt-Funktion gefunden");
const bib = fs.readFileSync(new URL("lib/html2canvas.min.js", wurzel), "utf8");
const seite = `<!doctype html><html><head><style>
  body{margin:0;background:oklab(0.97 0 0)}
  .a{width:200px;height:60px;background:color-mix(in oklab, #c62828 40%, white);color:oklch(45% 0.15 260);border:3px solid lab(50% 40 30)}
  .b{width:200px;height:40px;background:color-mix(in srgb, #1565e0 30%, transparent);box-shadow:0 2px 6px oklab(0 0 0 / 0.3)}
</style></head><body><div class="a">Testfarbe</div><div class="b">zweite</div></body></html>`;
const b = await chromium.launch({ args: [OHNE_ECHTSERVER, "--no-proxy-server"] });
try {
  const p = await b.newPage();
  await p.route("**/*", (r) => (r.request().url().startsWith("https://foto.test/") ? r.fulfill({ status: 200, contentType: "text/html", body: seite }) : r.abort()));
  await p.goto("https://foto.test/");
  await p.addScriptTag({ content: bib });
  await p.addScriptTag({ content: glaetten + "\nwindow.bfKlonGlaetten = bfKlonGlaetten; window.bfRgba = bfRgba;" });
  const erg = await p.evaluate(async () => {
    const opt = { logging: false, backgroundColor: window.bfRgba(getComputedStyle(document.body).backgroundColor) };
    let ohne = "ok";
    try { await window.html2canvas(document.body, { logging: false, backgroundColor: getComputedStyle(document.body).backgroundColor }); } catch (e) { ohne = String(e.message || e); }
    const c = await window.html2canvas(document.body, { ...opt, onclone: window.bfKlonGlaetten });
    const px = c.getContext("2d").getImageData(20, 20, 1, 1).data;
    return { ohne, breite: c.width, px: [...px], grund: opt.backgroundColor, modern: getComputedStyle(document.querySelector(".a")).backgroundColor };
  });
  console.log(JSON.stringify(erg));
  assert.ok(erg.breite > 0, "Bildschirmfoto entsteht");
  assert.match(erg.grund, /^rgba\(/, "Grundfarbe als rgba");
  assert.ok(erg.px[0] > erg.px[2] && erg.px[3] === 255, "die rötliche Mischfarbe ist im Bild (nicht schwarz, nicht leer)");
  console.log(`OK – Bildschirmfoto mit modernen Farben (${erg.modern.split("(")[0]}…); ohne Glätten: ${erg.ohne === "ok" ? "ging auch" : "Fehler wie bei Frank"}`);
} finally { await b.close(); }
