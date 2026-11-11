// KC-CLUB-MUENZE-GESICHT / KC-CLUB-LAMPE-GESPIEGELT (Wunsch #88, 11.11.2026): Browser-Prüfung – Warte-Münze mit/ohne eigenes Gesicht, gespiegelte Lampe; nur Testdaten.
// Start: PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/muenze-gesicht-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require("playwright");
const wurzel = "/home/user/kc-clubapp";
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8824);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ deviceScaleFactor: 2, viewport: { width: 400, height: 860 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.goto("http://localhost:8824/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
const B = process.env.BILDER;
await seite.evaluate(() => { ICH = { ...(ICH || {}), person_id: "P1", name: "Hans Test", vorname: "Hans", admin: true }; $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt"); api = async () => ({}); });
const muenze = (code) => seite.evaluate((code) => { INIT = { ...(INIT || {}), einstellungen: { ...(INIT?.einstellungen || {}), avatar: code ? { figur: code } : {} } };
  wbEinsetzen(WBILD.find((x) => x.id === "muetze"), "Einen Moment …"); const z = $("warten"); z.classList.remove("versteckt"); z.classList.add("an");
  const m = z.querySelector(".muetze"); return { mitAv: m.classList.contains("mit-av"), av: !!m.querySelector(".muetze-av img, .muetze-av svg"), anim: getComputedStyle(m).animationName, nach: getComputedStyle(m, "::after").content }; }, code);
const ohne = await muenze("");
ok(!ohne.mitAv && !ohne.av && ohne.anim === "muetzeDreh" && /since/.test(ohne.nach), "ohne Avatar: nur „since 1991“ (" + JSON.stringify(ohne) + ")");
const code = await seite.evaluate(() => Object.keys(AV_FIGUREN)[0]);
const mit = await muenze(code);
ok(mit.mitAv && mit.av && mit.anim === "muetzeDreh2", "mit Avatar: Gesicht auf jeder zweiten Rückseite (" + JSON.stringify(mit) + ")");
if (B) for (const [n, t] of [["vorne", 0], ["since", 0.5], ["gesicht", 2.1]]) {
  await seite.evaluate((t) => { const m = $("warten").querySelector(".muetze"); for (const a of [m, m.querySelector(".muetze-av")].filter(Boolean)) a.style.animationPlayState = "paused";
    document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t * 1000 + (t === 0 ? 0 : 0); }); }, t === 0.5 ? 0.8 : t === 2.1 ? 2.4 : 0);
  await seite.waitForTimeout(150); const r = await seite.evaluate(() => { const b = $("warten").getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width, height: b.height }; }); await seite.screenshot({ path: `${B}/muenze-${n}.png`, clip: r }); }
const foto = await seite.evaluate(() => avatarSvg("f123456789", 56));
ok(/class="av-foto"/.test(foto), "Foto-Avatar liefert ein Bild für die Münze");
// Lampe gespiegelt
await seite.evaluate(async () => { $("warten").classList.add("versteckt"); await teilLaden("buero"); });
const l = await seite.evaluate(() => [BU_SVG.lampe(true), BU_SVG.lampe(false)]);
ok(/M47 33 L58 21 L132 64 L92 94 Z/.test(l[0]) && !/L132 64/.test(l[1]) && /M32 8 L16 46 L34 80/.test(l[0]), "Lampe gespiegelt, Licht nach rechts nur wenn an");
if (B) { await seite.setContent(`<body style="background:#556;margin:0;padding:30px 120px 30px 30px">${l.map((s) => `<span style="display:inline-block;width:70px;height:90px;margin-right:110px">${s}</span>`).join("")}</body>`); await seite.screenshot({ path: `${B}/lampe-an-aus.png` }); }
ok(!fehler.length, "keine Fehler auf der Seite " + fehler.slice(0, 3).join(" | "));
await browser.close(); srv.close();
