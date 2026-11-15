// KC-CLUB-TA-PROTOKOLL (13.11.2026): Browser-Prüfung – Protokoll aus der Terminanfrage schreiben, senden, lesen, drucken; nur Testdaten.
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/ta-protokoll-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8828);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ colorScheme: "light", viewport: { width: 400, height: 800 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close());
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8828/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
const B = process.env.BILDER;
const ANF = [{ id: "A1", vonMir: true, anlass: "Besprechung", beginn: new Date(Date.now() - 6 * 3600000).toISOString(), ende: null, ort: "Bei mir",
  notiz: "Hallo Klaus, hast du Zeit? Punkte:\n1. Dienstplan: Entwurf\n2. Metallschilder: Menge\n3. Termine im Januar\nViele Grüße\nHansi", status: "offen", gegenvorschlag: true, anlagen: [], protokoll: null,
  von: { person_id: "P1", name: "Hans Test", vorname: "Hans" }, empfaenger: [{ person_id: "P2", name: "Klaus Probe", antwort: "ja" }] }];
await seite.evaluate((ANF) => { ICH = { ...(ICH || {}), person_id: "P1", name: "Hans Test", vorname: "Hans" }; $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  document.documentElement.style.colorScheme = "light"; window.__api = []; window.frage = async () => true;
  api = async (a, p) => { __api.push({ a, p }); if (a === "terminanfrage_protokoll") { const pr = { ...p.protokoll, status: p.senden ? "gesendet" : "entwurf", gesendet_am: p.senden ? new Date().toISOString() : null, pdf: p.pdf || null }; ANF[0].protokoll = pr; return { ok: true, protokoll: pr, an: 1 }; }
    if (a === "todo_anlegen") return { ok: true, id: "T" + __api.length };
    if (a === "anlage_hochladen") { window.__pdfGroesse = (p.daten || "").length; return { ok: true, id: "11111111-2222-3333-4444-555555555555", name: p.name }; }
    return a === "terminanfragen_liste" ? { anfragen: JSON.parse(JSON.stringify(ANF)) } : a === "unterhaltungen" ? { unterhaltungen: [] } : {}; };
  zeige("termine"); }, ANF);
await seite.waitForTimeout(1200); await seite.evaluate(() => taLaden()); await seite.waitForTimeout(500);
await seite.evaluate(() => document.querySelectorAll(".meldung, .blatt:not(.versteckt)").forEach((e) => e.remove()));
ok(await seite.evaluate(() => !!$("ta-A1") && /Protokoll schreiben/.test($("ta-A1").textContent)), "vergangene Besprechung bleibt sichtbar, Knopf „Protokoll schreiben“");
await seite.click('#ta-A1 [onclick^="taProtokoll"]'); await seite.waitForTimeout(300);
const f = await seite.evaluate(() => ({ tops: [...document.querySelectorAll("#taPrBlatt .tap-t")].map((x) => x.value), anw: $("tapAnw").value, wer: [...document.querySelectorAll("#taPrBlatt .tap-w option")].map((o) => o.textContent).slice(0, 3) }));
ok(f.tops.join("|") === "Dienstplan: Entwurf|Metallschilder: Menge|Termine im Januar" && /Hans Test, Klaus Probe/.test(f.anw) && f.wer.includes("Klaus Probe"), "Punkte aus der Tagesordnung, Anwesend vorbelegt: " + f.tops.join(" · "));
await seite.evaluate(() => { const t = document.querySelectorAll("#taPrBlatt .tap-top"); t[0].querySelector(".tap-e").value = "Entwurf steht, Klaus prüft ihn."; t[0].querySelector(".tap-w").value = "P2"; t[0].querySelector(".tap-b").value = "2026-11-20";
  t[1].querySelector(".tap-e").value = "20 Stück A5 bestellen."; $("tapNaechst").value = "Fr. 27.11., 11:30 Uhr"; });
await seite.evaluate(() => taPrDazu()); await seite.evaluate(() => { const t = [...document.querySelectorAll("#taPrBlatt .tap-top")].pop(); t.querySelector(".tap-t").value = "Finger-Barcode-Reader"; t.querySelector(".tap-e").value = "Angebot einholen."; });
if (B) { await seite.evaluate(() => document.querySelectorAll(".meldung").forEach((e) => e.remove())); await seite.screenshot({ path: B + "/protokoll-formular.png" }); }
await seite.click("#tapSenden"); await seite.waitForTimeout(800);
const gesendet = await seite.evaluate(() => { const x = __api.find((y) => y.a === "terminanfrage_protokoll"); return { pdf: x?.p.pdf, kopie: x?.p.kopie, pdfGroesse: window.__pdfGroesse || 0, senden: x?.p.senden, tops: x?.p.protokoll.tops.length, wer: x?.p.protokoll.tops[0].werName, todos: __api.filter((y) => y.a === "todo_anlegen").map((y) => [y.p.zustaendige[0], y.p.faellig]) }; });
ok(gesendet.pdf === "11111111-2222-3333-4444-555555555555" && gesendet.kopie === true && gesendet.pdfGroesse > 20000, `PDF auf dem Briefkopf erzeugt und angehängt (${Math.round(gesendet.pdfGroesse * 0.75 / 1024)} KB), Kopie an mich`);
ok(gesendet.senden === true && gesendet.tops === 4 && gesendet.wer === "Klaus Probe" && JSON.stringify(gesendet.todos) === '[["P2","2026-11-20"]]', "gesendet mit 4 TOPs, 1 To-do für Klaus bis 20.11.");
ok(await seite.evaluate(() => /Protokoll \(verschickt\)/.test($("ta-A1")?.textContent || "")), "Karte zeigt „Protokoll (verschickt)“");
const d = await seite.evaluate(() => { const r = taPrDruck("A1"); return { titel: r.titel, n: (r.html.match(/>TOP \d+: /g) || []).length, klaus: /→ Klaus Probe/.test(r.html) && /bis 20\.11\.2026/.test(r.html) }; });
ok(d.titel === "Protokoll: Besprechung" && d.n === 4 && d.klaus, "Druck: 4 TOPs, „→ Klaus Probe bis 20.11.2026“");
if (B) { await seite.evaluate(async () => { druckStarten("taprotokoll", "A1"); await new Promise((r) => setTimeout(r, 1500)); druckVorschauZu(); await druckSeiteBauen(); }); await seite.emulateMedia({ colorScheme: "light" });
  await seite.pdf({ path: B + "/Beispiel-Besprechungs-Protokoll.pdf", format: "A4", printBackground: true, preferCSSPageSize: true }); }
ok(await seite.evaluate(() => /So sieht Klaus es/.test($("ta-A1")?.textContent || "")), "Knopf „👁️ So sieht Klaus es“ beim Absender");
// Klaus' Sicht: nur lesen
await seite.evaluate(() => { const a = TA.liste[0]; a.vonMir = false; taLaden = async () => {}; $("terminanfragen").innerHTML = taKarte(a); });
ok(await seite.evaluate(() => /Protokoll lesen/.test($("ta-A1").textContent)), "Angefragter sieht „Protokoll lesen“");
await seite.click('#ta-A1 [onclick^="taProtokollLesen"]'); await seite.waitForTimeout(300);
ok(await seite.evaluate(() => /TOP 4: Finger-Barcode-Reader/.test($("taPrLesen")?.textContent || "") && /Protokoll als PDF \(Briefkopf\)/.test($("taPrLesen")?.textContent || "")), "Lesen-Fenster zeigt alle Punkte und den PDF-Knopf");
ok(!fehler.filter((x) => !/tdt|unterhaltung/i.test(x)).length, "keine Fehler auf der Seite" + (fehler.length ? " – " + fehler.slice(0, 3).join(" | ") : ""));
await browser.close(); srv.close();
console.log(process.exitCode ? "ta-protokoll-browser: ROT" : "ta-protokoll-browser: alle Prüfungen bestanden");
