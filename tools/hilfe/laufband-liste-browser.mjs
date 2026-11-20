// KC-CLUB-LAUFBAND-LISTE + KC-CLUB-MITFAHRT-LAUFBAND (20.11.2026): Browser-Prüfung mit dem echten app.js und AUSGEDACHTEN Startdaten:
// ▾ am oberen Rand des Info-Laufbands öffnet die Rollliste aller Meldungen (auch über 7), Mitfahrten (auch die eigene) stehen drin, Antippen springt hin, 390 px ohne Überlauf.
// Nur Testdaten – nichts an den Server (KC-TESTS-OHNE-ECHTSERVER).
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/laufband-liste-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8847);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.goto("http://localhost:8847/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
const bild = async (n, voll) => { if (process.env.BILDER) await seite.screenshot({ path: `${process.env.BILDER}/${n}.png`, fullPage: !!voll }); };
const weg = () => seite.evaluate(() => { for (const e of document.querySelectorAll(".meldung")) e.remove(); });
const ueberlauf = () => seite.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
await seite.evaluate(() => {
  ICH = { ...(ICH || {}), person_id: "P1", name: "Hans Test", vorname: "Hans", admin: false, vorstand: false, buero: false }; MITGLIEDER = MITGLIEDER || [];
  window.__sprung = [];
  ilTerminOeffnen = (id) => __sprung.push(["termin", id]); aktionOeffnen = (id) => __sprung.push(["aktion", id]);
  INIT = { ...(INIT || {}), mitfahrtenOffen: [
    { art: "biete", id: "M1", person_id: "P1", name: "Hans", eigen: true, frei: 3, bezug_art: "treffen", bezug_id: "T1", titel: "Köcheclub-Sitzung", beginn: new Date(Date.now() + 4 * 86400000).toISOString() },
    { art: "suche", id: "S1", person_id: "P3", name: "Anne", eigen: false, bezug_art: "aktion", bezug_id: "A1", titel: "Adventsmarkt", beginn: new Date(Date.now() + 8 * 86400000).toISOString() }],
    protokolleUngelesen: 2, laufbandTermine: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({ id: "L" + i, titel: "Testtermin " + i, beginn: new Date(Date.now() + i * 86400000).toISOString(), art: "veranstaltung" })) };
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  zeige("start"); try { infoGehe(INFO_FELDER.findIndex((f) => f.id === "treffen")); } catch {}
});
await seite.waitForTimeout(1500); await weg();
await seite.evaluate(() => { IL.html = ""; ilZeigen(); }); await seite.waitForTimeout(300);
const tab = await seite.evaluate(() => document.querySelector("#infoLaufband .il-alle")?.textContent || "");
ok(/^▾ \d+$/.test(tab), "▾ am oberen Rand mit Anzahl: " + tab);
ok(await seite.evaluate(() => IL.liste.some((m) => m.id === "mitfahrt:biete:M1")), "eigenes Mitfahrt-Angebot ist im Laufband (nicht mehr hinter den 7)");
await bild("laufband-1-zu");
await seite.click("#infoLaufband .il-alle"); await seite.waitForTimeout(400);
const l = await seite.evaluate(() => ({ n: document.querySelectorAll("#ilListe .il-balken").length, alle: IL.alle.length, txt: $("ilListe")?.textContent.replace(/\s+/g, " ") || "", pfeil: document.querySelector("#infoLaufband .il-alle")?.textContent || "" }));
ok(l.n === l.alle && l.n > 8, `Rollliste mit allen ${l.n} Meldungen (mehr als 7)`);
ok(/Du bietest eine Mitfahrt an/.test(l.txt) && /Anne sucht eine Mitfahrgelegenheit/.test(l.txt), "Mitfahrten in der Liste");
ok(/^▴/.test(l.pfeil), "Pfeil zeigt ▴ zum Schließen");
ok(!(await ueberlauf()), "kein Überlauf bei 390 px");
await bild("laufband-2-liste", true);
await seite.evaluate(() => [...document.querySelectorAll("#ilListe .il-balken")].find((b) => /Anne sucht/.test(b.textContent)).click()); await seite.waitForTimeout(300);
ok(await seite.evaluate(() => JSON.stringify(__sprung) === JSON.stringify([["aktion", "A1"]]) && !$("ilListe")), "Antippen springt zur Aktion und schließt die Liste");
await seite.click("#infoLaufband .il-alle"); await seite.waitForTimeout(300); await seite.click("#infoLaufband .il-alle"); await seite.waitForTimeout(300);
ok(await seite.evaluate(() => !$("ilListe")), "▴ schließt die Liste wieder");
ok(!fehler.length, "keine Seitenfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log(process.exitCode ? "laufband-liste-browser: FEHLER" : "laufband-liste-browser: alle Prüfungen bestanden");
