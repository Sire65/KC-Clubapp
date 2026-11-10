// KC-CLUB-SEE (10.11.2026): Browser-Prüfung der Szene „Am See“ – Wasserfall, Boote, Polizeiboot, Sturm, Regen, Blitze, Wegpusten, Neustart; keine Fehler, nichts an den Server.

// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/see-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8815);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close());
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8815/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
await seite.evaluate(() => { ICH = { ...(ICH || {}), person_id: "P1", name: "Klaus Test", vorname: "Klaus", admin: false }; $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  window.__api = []; api = async (a, p) => { __api.push({ a }); return a === "unterhaltungen" ? { unterhaltungen: [] } : {}; }; });
await seite.evaluate(() => teilLaden("szenen"));
// Zeichen-Baustein allein: Bilder zu festen Zeitpunkten (Kopf 380×300, rot wie die App)
const momente = [[8, "ruhig"], [16, "polizei"], [44, "regen"], [50, "blitz"], [58, "sturm"], [70, "ende"]];
const ergebnis = await seite.evaluate(async (momente) => {
  const c = document.createElement("canvas"), w = 380, h = 300; c.width = w * 2; c.height = h * 2; c.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;z-index:99999;background:linear-gradient(135deg,#4d0c16,#741521 45%,#9b2536)`;
  document.body.appendChild(c); const g = c.getContext("2d"); g.scale(2, 2); const S = seeNeu(), aus = [], dt = 1 / 30; let T = 0;
  for (const [ziel, name] of momente) {
    while (S.t < ziel || (name === "blitz" && !S.blitz)) { T += dt; seeSchritt(S, dt, w, h, 1); if (name === "blitz" && S.t > 49 && !S.blitz) { S.blitzUhr = 0; } }
    g.clearRect(0, 0, w, h); seeMalen(g, S, w, h, 1, T); await new Promise((r) => requestAnimationFrame(r));
    aus.push({ name, t: Math.round(S.t), boote: S.boote.filter((b) => !b.weg).length, polizei: !!S.polizei, regen: S.regen.length, blitz: !!S.blitz, wolken: S.wolken.length });
    window.__bild = name; await new Promise((r) => setTimeout(r, 30)); document.title = "bild:" + name; await new Promise((r) => setTimeout(r, 60));
  }
  let ende = false; while (!ende) { ende = seeSchritt(S, dt, w, h, 1); } aus.push({ name: "fertig", t: Math.round(S.t) });
  c.remove(); return aus; }, momente);
console.log(JSON.stringify(ergebnis));
const e = Object.fromEntries(ergebnis.map((x) => [x.name, x]));
ok(e.ruhig.boote === 3 && !e.ruhig.regen && !e.ruhig.blitz, "ruhig: 2 Segelboote + Ruderboot, kein Regen");
ok(e.polizei.polizei, "Polizeiboot fährt vorbei");
ok(e.regen.regen > 20, "Sturm: Regen (" + e.regen.regen + " Tropfen)");
ok(e.blitz.blitz && e.blitz.regen <= 120, "Blitz, höchstens 120 Tropfen");
ok(e.ende.boote === 0 && !e.ende.polizei && e.ende.regen === 0, "Sturm hat alles weggepustet");
ok(e.fertig.t >= 72, "Lauf endet nach 72 s – danach beginnt alles von vorn");
// Bilder: jeden Moment neu malen und fotografieren
if (process.env.BILDER) for (const [ziel, name] of momente) {
  await seite.evaluate(async ({ ziel, name }) => { const c = document.createElement("canvas"), w = 380, h = 300; c.id = "seeBild"; c.width = w * 2; c.height = h * 2;
    c.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;z-index:99999;background:linear-gradient(135deg,#4d0c16,#741521 45%,#9b2536)`; document.body.appendChild(c);
    const g = c.getContext("2d"); g.scale(2, 2); const S = seeNeu(); let T = 0; const dt = 1 / 30; while (S.t < ziel || (name === "blitz" && !S.blitz)) { T += dt; seeSchritt(S, dt, w, h, 1); if (name === "blitz" && S.t > 49 && !S.blitz) S.blitzUhr = 0; }
    seeMalen(g, S, w, h, 1, T); }, { ziel, name });
  await seite.screenshot({ path: `${process.env.BILDER}/see-${name}.png`, clip: { x: 0, y: 0, width: 380, height: 300 } }); await seite.evaluate(() => $("seeBild").remove());
}
// ganze App: Vorschau im Kopf läuft ohne Fehler
await seite.evaluate(() => { try { zeige("start", true); } catch {} try { jahreszeitVorschau("see"); } catch (e) { window.__vf = String(e); } });
await seite.waitForTimeout(4000);
ok(await seite.evaluate(() => !window.__vf && JZB?.saison === "see"), "Vorschau „⛵ Am See“ läuft im Kopf der Startseite");
if (process.env.BILDER) await seite.evaluate(() => document.querySelectorAll(".meldung, .blatt:not(.versteckt)").forEach((e) => e.remove()));
if (process.env.BILDER) await seite.screenshot({ path: `${process.env.BILDER}/see-app.png`, clip: { x: 0, y: 0, width: 400, height: 420 } });
ok(!(await seite.evaluate(() => __api.filter((x) => !/^(spur_melden|unterhaltungen|start_melden|countdowns|init|pinnwand|pinnwand_neu|einstellung_setzen)$/.test(x.a)).length)), "nichts an den Server");
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? " – " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log("see-browser: alle Prüfungen bestanden");
