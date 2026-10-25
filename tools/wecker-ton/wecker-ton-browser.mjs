// 2.658.0 KC-CLUB-WECKER-TON: Browser-Test des echten app.js – Wecker/Timer klingeln hörbar, auch wenn der Akku-Schutz die Tonausgabe
// vorher schlafen gelegt hat; ist der Ton gesperrt, bietet das Fenster „🔊 Antippen für Ton“. Start: PW_CORE=… PW_CHROME=… node tools/wecker-ton/wecker-ton-browser.mjs
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8806);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome", args: ["--autoplay-policy=no-user-gesture-required"] });
const seite = await browser.newPage(); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8806/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const r = await seite.evaluate(async () => {
  const warte = (ms) => new Promise((r) => setTimeout(r, ms));
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  let n = 0; const P = AudioContext.prototype; for (const m of ["createOscillator", "createBufferSource"]) { const o = P[m]; P[m] = function () { n++; return o.apply(this, arguments); }; }
  const klingeln = async (art) => { const st = wkStand(); if (art === "timer") st.timer = { ende: Date.now() - 500, sid: null }; else st.wecker = { um: Date.now() - 500, text: "Test", sid: null }; wkMerken(st);
    const vor = n; wkKlingeln(art); await warte(7000); const da = { n: n - vor, schlaege: WKK.i, hinweis: !!document.querySelector(".wk-tonhinweis") }; wkKlingelAus(false); return da; };
  wkTon(); await warte(6500); const schlief = audio.state; // Akku-Schutz hat die Tonausgabe schlafen gelegt
  const timer = await klingeln("timer"); await warte(6500); const wecker = await klingeln("wecker");
  // gesperrter Ton (App frisch geöffnet, nie getippt): wecken klappt nicht → Hinweis; Tippen gibt frei
  await warte(6500); const echt = P.resume; P.resume = function () { return new Promise(() => {}); };
  const st = wkStand(); st.timer = { ende: Date.now() - 500, sid: null }; wkMerken(st); const vor = n; wkKlingeln("timer"); await warte(2500);
  const gesperrt = { n: n - vor, hinweis: !!document.querySelector(".wk-tonhinweis") }; P.resume = echt;
  document.querySelector(".wk-tonhinweis")?.click(); await warte(5000); const frei = { n: n - vor, schlaege: WKK.i, hinweisWeg: !document.querySelector(".wk-tonhinweis") }; wkKlingelAus(false);
  return { schlief, timer, wecker, gesperrt, frei };
});
ok(r.schlief === "suspended", "Ausgangslage wie auf dem Handy: Tonausgabe schläft (Akku-Schutz)");
ok(r.timer.schlaege >= 2 && r.timer.n >= r.timer.schlaege && !r.timer.hinweis, `Timer klingelt hörbar: ${r.timer.schlaege} Schläge`);
ok(r.wecker.schlaege >= 2 && r.wecker.n >= r.wecker.schlaege, `Wecker klingelt hörbar: ${r.wecker.schlaege} Schläge`);
ok(r.gesperrt.hinweis, "Ton gesperrt → „🔊 Antippen für Ton“");
ok(r.frei.schlaege >= 2 && r.frei.hinweisWeg, `nach dem Tippen klingelt es hörbar: ${r.frei.schlaege} Schläge`);
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
