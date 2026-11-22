// KC-NOTAUS-OBEN (22.11.2026): Knopf oben in der Kopfzeile links neben 🚨 SOS, keine eigene Zeile; kurz antippen → Hinweis-Blase mit Probe-NOT-AUS.
// KC-NOTAUS (21.11.2026): Browser-Prüfung mit dem echten app.js – Pilzknopf nur für den Admin, 1,5 s halten löst aus (kürzer nicht), Probe ändert nichts,
// roter Balken + gesperrtes Schreibfeld, Entriegeln-Fenster mit drei Knöpfen, 423 vom Server → freundliche Meldung, 390 px ohne Überlauf.
// Nur Testdaten – nichts an den Server (KC-TESTS-OHNE-ECHTSERVER).
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/notaus-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8857);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
// KC-TESTS-OHNE-ECHTSERVER: eigene Seite durchlassen; …/functions/v1/… mit Testdaten beantworten (NOT-AUS 423); alles andere abbrechen
await seite.route("**/*", (r) => {
  const u = r.request().url();
  if (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(u)) return r.continue();
  if (/\/functions\/v1\//.test(u)) return r.fulfill({ status: 423, contentType: "application/json", body: JSON.stringify({ error: "⛔ NOT-AUS: Nachrichten sind gerade angehalten – bitte später noch einmal.", notaus: true, seit: "2026-11-21T13:03:00Z" }) });
  return r.abort();
});
await seite.routeWebSocket(/realtime\/v1\/websocket/, (ws) => ws.close());
await seite.goto("http://localhost:8857/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
const bild = async (n) => { if (process.env.BILDER) await seite.screenshot({ path: `${process.env.BILDER}/${n}.png` }); };
const meldungen = () => seite.evaluate(() => [...document.querySelectorAll(".meldung")].map((e) => e.textContent).join(" | "));
const weg = () => seite.evaluate(() => { for (const e of document.querySelectorAll(".meldung")) e.remove(); });
const ueberlauf = () => seite.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
await seite.evaluate(() => {
  window.__api = []; window.__stand = { aktiv: false };
  api = async (a, p) => { __api.push({ a, p });
    if (a === "notaus_ausloesen") { if (p?.probe) return { ok: true, aktiv: false, angehalten: 7, probe: true }; __stand = { aktiv: true, seit: "2026-11-21T13:03:00Z" }; return { ok: true, aktiv: true, seit: __stand.seit, angehalten: 7, probe: false }; }
    if (a === "notaus_stand") return { ...__stand, angehalten: 7, nach_kanal: { push: 5, email: 2 } };
    if (a === "notaus_entriegeln") { __stand = { aktiv: false }; return { ok: true, aktiv: false, aktion: p.aktion, freigegeben: 7, verworfen: 0, behalten: 0 }; }
    if (a === "notaus_info") return __stand;
    if (a === "unterhaltungen") return { unterhaltungen: [] };
    return {}; };
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
});
const als = (admin) => seite.evaluate((admin) => { ICH = { ...(ICH || {}), person_id: admin ? "P1" : "P2", name: "Test", vorname: "Test", admin, vorstand: admin, buero: false }; document.body.classList.toggle("ist-admin", admin); MITGLIEDER = MITGLIEDER || []; zeige("nachrichten"); }, admin);
// 1) Mitglied: kein Knopf
await als(false); await seite.waitForTimeout(400);
ok(await seite.evaluate(() => !document.getElementById("notausKnopf")), "Mitglied sieht keinen NOT-AUS-Knopf");
// 2) Admin: Knopf sichtbar, 390 px ohne Überlauf
await als(true); await seite.waitForTimeout(400); await weg();
const k = await seite.evaluate(() => { const b = document.getElementById("notausKnopf")?.getBoundingClientRect(), s = $("naSosKnopf").getBoundingClientRect(), n = document.querySelector("#v-nachrichten .kopf2 > .knopf.haupt").getBoundingClientRect();
  return b && { w: b.width, h: b.height, r: b.right, sosH: s.height, sichtbar: b.width > 0 && b.height > 0, inKopf: !!document.querySelector("#v-nachrichten .kopf2 #notausKnopf"), linksVonSos: b.right <= s.left + 1 && s.left - b.right < 20,
    eineReihe: Math.abs((b.top + b.bottom) / 2 - (s.top + s.bottom) / 2) < 3 && Math.abs(s.top - n.top) < 3, zeile: !!document.querySelector(".notaus-zeile"), naLeer: $("naNotaus").classList.contains("versteckt") }; });
ok(k?.sichtbar && k.inKopf && k.linksVonSos && k.eineReihe && k.r <= 390, "Admin sieht den Pilzknopf oben links neben SOS (" + JSON.stringify(k) + ")");
ok(k.h >= 36 && k.h <= k.sosH + 8, "Knopf etwa in SOS-Höhe");
ok(!k.zeile && k.naLeer, "keine eigene NOT-AUS-Zeile mehr");
ok(!(await ueberlauf()) && await seite.evaluate(() => { const k = document.querySelector("#v-nachrichten .kopf2"); return k.scrollWidth <= k.clientWidth + 1; }), "390 px ohne Überlauf (Kopfzeile)");
await bild("notaus-1-knopf");
// 3) kurz antippen → Hinweis-Blase, darin Probe – ändert nichts
await seite.click("#notausKnopf"); await seite.waitForTimeout(300);
ok(/1,5 s halten = alle Nachrichten stoppen/.test(await seite.evaluate(() => $("notausTipp")?.textContent || "")) && await seite.evaluate(() => !NOTAUS.aktiv), "kurz antippen → Hinweis „1,5 s halten …“ mit Probe, nichts ausgelöst");
await bild("notaus-1b-tipp");
await seite.click("#notausProbeKnopf"); await seite.waitForTimeout(300);
ok(/Würde 7 Aufträge anhalten/.test(await meldungen()) && await seite.evaluate(() => !NOTAUS.aktiv), "Probe-NOT-AUS: „Würde 7 Aufträge anhalten“, nichts aktiv");
await weg();
// 4) kurz drücken (0,6 s) → nichts
const mitte = await seite.evaluate(() => { const b = document.getElementById("notausKnopf").getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
await seite.mouse.move(mitte.x, mitte.y); await seite.mouse.down(); await seite.waitForTimeout(600); await seite.mouse.up(); await seite.waitForTimeout(400);
ok(await seite.evaluate(() => !NOTAUS.aktiv && !__api.some((x) => x.a === "notaus_ausloesen" && !x.p?.probe)), "0,6 s gedrückt → nichts ausgelöst");
// 5) 1,0 s → Ring halb gefüllt, dann loslassen → nichts
await seite.mouse.down(); await seite.waitForTimeout(900);
const fuell = await seite.evaluate(() => Number(getComputedStyle(document.getElementById("notausKnopf")).getPropertyValue("--fuell")));
await bild("notaus-2-halten");
await seite.mouse.up(); await seite.waitForTimeout(300);
ok(fuell > 0.4 && fuell < 0.8 && await seite.evaluate(() => !NOTAUS.aktiv), "Ring füllt sich sichtbar (" + fuell + "), vor 1,5 s losgelassen → nichts");
// 6) 1,7 s halten → ausgelöst, ohne Rückfrage
await seite.mouse.down(); await seite.waitForTimeout(1700); await seite.mouse.up(); await seite.waitForTimeout(500);
ok(await seite.evaluate(() => NOTAUS.aktiv && !document.querySelector(".dlg-blatt")), "1,5 s gehalten → NOT-AUS aktiv, keine Rückfrage");
ok(/⛔ NOT-AUS ausgelöst – 7 angehalten/.test(await meldungen()), "Meldung „⛔ NOT-AUS ausgelöst – 7 angehalten“");
const balken = await seite.evaluate(() => document.querySelector("#naNotaus .notaus-balken")?.textContent || "");
ok(/NOT-AUS seit 14:03 – Nachrichten sind angehalten/.test(balken) && /Entriegeln/.test(balken), "roter Balken mit Uhrzeit + 🔓 Entriegeln: " + balken);
ok(await seite.evaluate(() => $("text").disabled && $("sendenKnopf").disabled), "Schreibfeld und ➤ gesperrt");
ok(!(await ueberlauf()), "390 px ohne Überlauf (Balken)");
await bild("notaus-3-aktiv");
const puls = () => seite.evaluate(() => { const h = document.querySelector("#v-nachrichten .kopf2 > h2"); return h.classList.contains("notaus-puls") && getComputedStyle(h).animationName === "notausTitelPuls"; });
ok(await puls(), "KC-NOTAUS-PULS: Titel „Nachrichten“ pulsiert, solange aktiv");
await weg(); await seite.waitForTimeout(600); await bild("notaus-puls");
// 7) Chat: Balken auch dort
await seite.evaluate(() => { zeige("chat"); }); await seite.waitForTimeout(300);
ok(/NOT-AUS seit 14:03/.test(await seite.evaluate(() => document.querySelector("#chatNotaus")?.textContent || "")), "Balken auch im Chat");
await seite.evaluate(() => zeige("nachrichten")); await seite.waitForTimeout(200); await weg();
// 8) Entriegeln-Fenster
await seite.click("#notausEntriegeln"); await seite.waitForTimeout(500);
const fenster = await seite.evaluate(() => document.getElementById("notausFenster")?.textContent.replace(/\s+/g, " ") || "");
ok(/7<\/b>|: 7 Aufträge/.test(fenster) && /Push\s*5/.test(fenster) && /E-Mail\s*2/.test(fenster), "Fenster: Anzahl je Kanal: " + fenster.slice(0, 160));
const kn = await seite.evaluate(() => [...document.querySelectorAll("#notausFenster [data-w]")].map((b) => b.textContent.trim()));
ok(["📤 Alle jetzt senden", "🗑️ Alle verwerfen", "⏸️ Angehalten lassen (später)"].every((t) => kn.includes(t)), "drei Knöpfe: " + kn.join(" | "));
ok(!(await ueberlauf()), "390 px ohne Überlauf (Fenster)");
await bild("notaus-4-entriegeln");
await seite.click('#notausFenster [data-w="senden"]'); await seite.waitForTimeout(400);
ok(/jetzt senden\?/.test(await seite.evaluate(() => document.querySelector(".dlg-blatt")?.textContent || "")), "kurze Rückfrage");
await seite.evaluate(() => document.querySelector(".dlg-blatt [data-w='1']").click()); await seite.waitForTimeout(500);
ok(await seite.evaluate(() => !NOTAUS.aktiv && !$("text").disabled && __api.some((x) => x.a === "notaus_entriegeln" && x.p.aktion === "senden")), "entriegelt, Schreibfeld frei");
ok(/Entriegelt – 7 Aufträge gehen jetzt raus/.test(await meldungen()), "Meldung nach dem Entriegeln");
ok(!(await puls()), "KC-NOTAUS-PULS: nach dem Entriegeln sofort aus");
await weg();
// 9) Mitglied sendet, Server meldet 423 NOT-AUS (abgeschirmte Antwort) → freundliche Meldung, Balken erscheint
await als(false); await seite.waitForTimeout(200);
const e = await seite.evaluate(async () => { try { await apiRoh("nachricht_senden", { id: "T1", text: "Hallo" }); return null; } catch (e) { meldeFehler(e); return { notaus: !!e.notaus, msg: e.message }; } });
await seite.waitForTimeout(300);
ok(e?.notaus && await seite.evaluate(() => NOTAUS.aktiv && !!document.querySelector("#naNotaus .notaus-balken") && !document.querySelector("#naNotaus #notausEntriegeln")), "423 → NOT-AUS-Balken für das Mitglied (ohne Entriegeln)");
ok(/NOT-AUS: Nachrichten sind gerade angehalten/.test(await meldungen()) && await seite.evaluate(() => ![...document.querySelectorAll(".meldung")].some((m) => /fehler/.test(m.className))), "freundliche Meldung statt Fehlerfenster");
ok(await puls(), "KC-NOTAUS-PULS: auch beim Mitglied");
await bild("notaus-5-mitglied");
ok(!fehler.length, "keine Seitenfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log(process.exitCode ? "notaus-browser: FEHLER" : "notaus-browser: alle Prüfungen bestanden");
