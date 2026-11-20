// 19.11.2026 KC-CLUB-LEITUNG-SPARSAM – Frage Hansi „wird sichergestellt, dass die Anzeige wer ist online und wer ist raus funktioniert?“
// Echter Browser, abgeschirmt (KC-TESTS-OHNE-ECHTSERVER): die direkte Leitung (Supabase Realtime + Anwesenheit) ist nachgebaut, der Club-Server
// antwortet mit Testdaten. Geprüft:
//   1. ein zweites Gerät kommt (presence_diff join) → die App gleicht ab und zeigt das Mitglied als online (LED grün),
//   2. es geht OHNE „weg“ (Absturz/Netz weg; presence_diff leave) → sofortiger Abgleich (Server zeigt es noch bis 150 s) und Nachlauf nach 165 s →
//      danach ist es aus der Liste (Zeit mit der Playwright-Uhr vorgespult),
//   3. Mitglied ohne Leitung online → Sicherheitsabgleich 3 Min. statt 10 Min.
// Braucht Playwright mit Chromium. Läuft eigenständig: node tests/anwesenheit.browser.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire(import.meta.url)("playwright");
const WURZEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ICH = { person_id: "KC-P-TEST-ANW-A", vorname: "Anna", name: "Anna Probe", admin: false, vorstand: false, aemter: [], rollen: [] };
const B = { person_id: "KC-P-TEST-ANW-B", vorname: "Bernd", name: "Bernd Probe", klopfbar: true };
const RT_KANAL = "kc-rt-test-anw-a", RT_CLUB = "club-anw-test";
const INIT = { ok: true, ich: ICH, rtKanal: RT_KANAL, rtClub: RT_CLUB,
  einstellungen: { begruessung: { gesehen: true }, unterstuetzung: "normal", einweisung: { an: false, gesehen: {} }, spiel_einladung: { an: false }, ansicht: { art: "erweitert", gewaehlt: true }, einladung: { aus: true } },
  mitglieder: [], treffen: [], chats: [], pinnwand: [], termine: [], zaehler: {}, kacheln: null };
const SERVER = { online: [], pings: 0 }; // was der nachgebaute Club-Server als „online“ meldet

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json",
  ".webmanifest": "application/manifest+json", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".mp3": "audio/mpeg", ".wasm": "application/wasm", ".woff2": "font/woff2" };
const server = http.createServer((req, res) => {
  const p = path.normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const datei = path.join(WURZEL, p || "index.html");
  if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "Content-Type": MIME[path.extname(datei)] || "application/octet-stream" }); fs.createReadStream(datei).pipe(res);
});
await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
const BASIS = `http://127.0.0.1:${server.address().port}`;

// Nachgebaute Leitung: Beitritt bestätigen, Herzschlag beantworten; Anwesenheits-Nachrichten schickt der Test selbst (an das Club-Thema)
let LEITUNG = null;
function leitung(ws) {
  LEITUNG = ws;
  ws.onMessage((roh) => {
    let m; try { m = JSON.parse(String(roh)); } catch { return; }
    if (m.event === "phx_join" || m.event === "heartbeat") ws.send(JSON.stringify({ topic: m.topic, event: "phx_reply", ref: m.ref, payload: { status: "ok", response: {} } }));
  });
}
const anwesenheit = (event, payload) => LEITUNG.send(JSON.stringify({ topic: "realtime:" + RT_CLUB, event, payload }));

const fehler = [], melde = (t) => fehler.push(t);
// KC-TESTS-OHNE-ECHTSERVER: Netzsperre – die echten Server-Adressen zeigen ins Leere, auch an der Abschirmung vorbei
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0";
const browser = await chromium.launch({ args: [OHNE_ECHTSERVER, "--no-proxy-server" /* hinter einem Proxy löst sonst der Proxy die Namen auf */] });
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, serviceWorkers: "block", locale: "de-DE", timezoneId: "Europe/Berlin",
    userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36" });
  const seite = await ctx.newPage();
  seite.on("pageerror", (e) => melde("Programmfehler: " + String(e.message || e).slice(0, 200)));
  await seite.clock.install(); // Uhr steuerbar (läuft normal weiter, kann vorgespult werden)
  await seite.routeWebSocket(/realtime\/v1\/websocket/, leitung);
  await seite.route("**/*", (r) => {
    const u = new URL(r.request().url());
    if (u.origin === BASIS || u.protocol === "data:" || u.protocol === "blob:") return r.continue();
    if (/\/functions\/v1\/kc-club$/.test(u.pathname)) {
      let a = ""; try { a = JSON.parse(r.request().postData() || "{}").action; } catch {}
      if (a === "online") SERVER.pings++;
      const ant = a === "init" ? INIT : a === "online" ? { zeigen: true, online: SERVER.online, gespraeche: [], anrufe: [], klopfen: [], antworten: [], verpasst: [], klopfVerpasst: [] } : { ok: true };
      return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify(ant) });
    }
    if (/\/functions\/v1\//.test(u.pathname)) return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: "{}" });
    return r.abort(); // nichts nach draußen
  });
  await seite.goto(`${BASIS}/index.html?k=0123456789abcdef0123456789abcdef`);
  await seite.waitForFunction(() => typeof ICH !== "undefined" && !!ICH, null, { timeout: 30000 }).catch(() => melde("Start: nicht angemeldet"));
  const warte = async (fn, arg, ms, was) => { try { await seite.waitForFunction(fn, arg, { timeout: ms, polling: 200 }); return true; } catch { melde(was); return false; } };
  if (await warte(() => RT.ok && RT.anw && !!ONL.timer, null, 20000, "Leitung/Anwesenheit steht nicht")) {
    anwesenheit("presence_state", {}); // außer mir niemand da
    await warte(() => RT.anwStand && ONL.sicher, null, 5000, "Anwesenheits-Stand fehlt / kein Sicherheitsabgleich");
    // 1. Bernd kommt
    SERVER.online = [B]; const vorher = SERVER.pings;
    anwesenheit("presence_diff", { joins: { gbernd: { metas: [{ t: 1 }] } }, leaves: {} });
    if (await warte((id) => ONL.ids.has(id), B.person_id, 15000, "Kommen: Bernd erscheint nicht in der Online-Liste")) {
      const led = await seite.evaluate(() => { onlineLedZeigen(); const l = document.getElementById("ledOnline"); return !l || l.classList.contains("gruen"); });
      if (!led) melde("Kommen: Online-LED nicht grün");
      if (SERVER.pings - vorher > 2) melde(`Kommen: ${SERVER.pings - vorher} Abgleiche statt einem`);
    }
    // jeder Online-Eintrag hat ein Gerät in der Anwesenheit → 10 Min.
    await warte(() => ONL.sicherMs === 600000, null, 5000, "Takt mit Leitung + Anwesenheit nicht 10 Min.");
    // 2. Bernd geht OHNE „weg“: Server zeigt ihn noch (Lebenszeichen nicht abgelaufen) → sofortiger Abgleich behält ihn, Nachlauf geplant
    const p0 = SERVER.pings;
    anwesenheit("presence_diff", { joins: {}, leaves: { gbernd: { metas: [{ t: 1 }] } } });
    await warte(() => !!RT.nachlauf, null, 5000, "Gehen: kein Nachlauf geplant");
    for (let i = 0; i < 150 && SERVER.pings <= p0; i++) await seite.waitForTimeout(200); // sofortiger (gebremster) Abgleich
    if (SERVER.pings <= p0) melde("Gehen: kein sofortiger Abgleich");
    await seite.waitForTimeout(300);
    if (!(await seite.evaluate((id) => ONL.ids.has(id), B.person_id))) melde("Gehen: Bernd zu früh weg (Server zeigte ihn noch)");
    // Bernd noch online, aber nicht mehr in der Anwesenheit → Mitglied ohne Leitung → 3 Min.
    await warte(() => ONL.sicherMs === 180000, null, 5000, "Mitglied ohne Leitung online: Takt nicht 3 Min.");
    // 150 s später ist Bernds Lebenszeichen am Server abgelaufen
    SERVER.online = [];
    // in kleinen Schritten vorspulen – so beantwortet die nachgebaute Leitung jeden Herzschlag und bleibt stehen (sonst baute die App sie neu auf und
    // gliche dabei ohnehin ab – dann würde der Test den Nachlauf nicht beweisen); 166 s < 3-Min.-Sicherheitsabgleich
    const pVor = SERVER.pings;
    for (let t = 0; t < 166000; t += 2000) { await seite.clock.fastForward(2000); await seite.waitForTimeout(25); }
    if (SERVER.pings !== pVor + 1) melde(`Gehen: ${SERVER.pings - pVor} Abgleiche beim Vorspulen (erwartet genau 1: der Nachlauf)`);
    await warte((id) => !ONL.ids.has(id) && !RT.nachlauf, B.person_id, 15000, "Gehen: Bernd nach dem Nachlauf noch als online angezeigt");
    await warte(() => ONL.sicherMs === 600000, null, 5000, "nach dem Gehen nicht zurück auf 10 Min.");
  }
  await ctx.close();
} finally { await browser.close(); server.close(); }
if (fehler.length) { console.error("❌ Anwesenheit (Browser): " + fehler.length + " Fund(e)\n" + fehler.join("\n")); process.exit(1); }
console.log("OK – Anwesenheit (Browser): Kommen sofort, Gehen ohne „weg“ nach Nachlauf, Takt 10/3 Min.");
