// KC-CLUB-GK-DIREKT-SENDEN (20.11.2026): Browser-Prüfung mit dem echten app.js und einer AUSGEDACHTEN gemeinsamen Karte („Karla Beispiel“):
// „💌 Jetzt an … schicken“ → Rückfrage → GENAU EINE Nachricht mit Bild + Gruß, erst danach „verschickt“; bei Upload-Fehler geht nichts raus.
// Nur Testdaten – nichts an den Server (KC-TESTS-OHNE-ECHTSERVER).
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/gk-senden-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8851);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.goto("http://localhost:8851/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
const bild = async (n, voll) => { if (process.env.BILDER) await seite.screenshot({ path: `${process.env.BILDER}/${n}.png`, fullPage: !!voll }); };
const weg = () => seite.evaluate(() => { for (const e of document.querySelectorAll(".meldung")) e.remove(); });
const ueberlauf = () => seite.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
await seite.evaluate(() => {
  ICH = { ...(ICH || {}), person_id: "P1", name: "Hans Test", vorname: "Hans", admin: true, vorstand: true, buero: false }; MITGLIEDER = MITGLIEDER || [];
  window.__api = []; window.__uploadKaputt = false;
  const karte = { id: "K1", fuer: "P9", fuerName: "Karla", anlass: "genesung", motiv: "strauss", titel: 0, text: "Werde schnell wieder gesund!", von: "Dein Köcheclub", bis: new Date(Date.now() - 3600000).toISOString(),
    starter: "Hans", darfSenden: true, ichDabei: true, namen: ["Hans", "Anne", "Thomas"], leute: [{ pid: "P1", name: "Hans" }, { pid: "P2", name: "Anne" }, { pid: "P3", name: "Thomas" }] };
  api = async (a, p) => { __api.push({ a, p });
    if (a === "gk_gemeinsam_liste") return { ok: true, karten: [karte] };
    if (a === "einzelchat_finden") return { id: "T-KARLA" };
    if (a === "nachricht_senden") return { ok: true, id: "T-KARLA", mid: "M77" };
    if (a === "gk_gemeinsam_ende") return { ok: true, status: "gesendet" };
    if (a === "unterhaltung") return { id: "T-KARLA", betreff: "", teilnehmer: [], nachrichten: [], tippt: [], entwurf: [], spricht: [], diktiert: [], angeheftet: [], geplant: [], gelesenBis: null };
    if (a === "unterhaltung_stand") return { stand: null };
    return {}; };
  anlageHochladen = async (f) => { __api.push({ a: "UPLOAD", p: { name: f.name, typ: f.type, groesse: f.size } }); return __uploadKaputt ? {} : { id: "A55", name: f.name }; };
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
});
await seite.waitForTimeout(500); await weg();
// 1) Upload kaputt → nichts verschickt, Karte bleibt offen
await seite.evaluate(() => { __uploadKaputt = true; return gkGemeinsamOeffnen("K1"); }); await seite.waitForTimeout(1500);
const knopf = await seite.evaluate(() => [...document.querySelectorAll("#gkGemBlatt [data-w]")].map((b) => b.textContent.trim()));
ok(knopf.some((t) => t === "💌 Jetzt an Karla schicken"), "Knopf heißt „💌 Jetzt an Karla schicken“: " + knopf.join(" | "));
await seite.click('#gkGemBlatt [data-w="senden"]'); await seite.waitForTimeout(400);
const frageText = await seite.evaluate(() => document.querySelector(".dlg-blatt")?.textContent.replace(/\s+/g, " ") || "");
ok(/jetzt an Karla schicken\?/.test(frageText) && /Gute Besserung/i.test(frageText), "Rückfrage zeigt Empfängerin und Gruß: " + frageText.slice(0, 120));
await bild("gk-senden-1-frage");
await seite.evaluate(() => [...document.querySelectorAll(".dlg-blatt button")].find((b) => /Ja, jetzt schicken/.test(b.textContent)).click()); await seite.waitForTimeout(2500);
ok(/nicht hochgeladen werden[\s\S]*nichts verschickt/.test(await seite.evaluate(() => [...document.querySelectorAll(".meldung")].map((e) => e.textContent).join(" | "))), "Upload kaputt: verständliche Meldung „… nichts verschickt“");
ok(await seite.evaluate(() => __api.some((x) => x.a === "UPLOAD") && !__api.some((x) => x.a === "nachricht_senden") && !__api.some((x) => x.a === "gk_gemeinsam_ende")), "Upload kaputt: keine Nachricht, nicht „verschickt“");
// 2) Normalfall
await seite.evaluate(() => { __uploadKaputt = false; __api.length = 0; document.querySelectorAll(".meldung").forEach((e) => e.remove()); $("gkGemBlatt")?.remove(); return gkGemeinsamOeffnen("K1"); }); await seite.waitForTimeout(1500);
await seite.click('#gkGemBlatt [data-w="senden"]'); await seite.waitForTimeout(400);
await seite.evaluate(() => [...document.querySelectorAll(".dlg-blatt button")].find((b) => /Ja, jetzt schicken/.test(b.textContent)).click()); await seite.waitForTimeout(3000);
const ab = await seite.evaluate(() => __api.map((x) => x.a).filter((a) => ["UPLOAD", "einzelchat_finden", "nachricht_senden", "gk_gemeinsam_ende"].includes(a)));
ok(JSON.stringify(ab) === JSON.stringify(["UPLOAD", "einzelchat_finden", "nachricht_senden", "gk_gemeinsam_ende"]), "Reihenfolge: hochladen → Chat finden → senden → verschickt: " + ab.join(" → "));
const s = await seite.evaluate(() => __api.find((x) => x.a === "nachricht_senden")?.p);
ok(s && s.id === "T-KARLA" && JSON.stringify(s.anlagen) === '["A55"]' && /3 haben unterschrieben/.test(s.text), "EINE Nachricht mit Bild + Gruß: " + JSON.stringify(s));
ok(await seite.evaluate(() => __api.filter((x) => x.a === "nachricht_senden").length === 1 && __api.find((x) => x.a === "UPLOAD").p.typ === "image/jpeg" && __api.find((x) => x.a === "UPLOAD").p.groesse > 10000), "genau eine Nachricht, Bild ist ein echtes JPEG");
ok(await seite.evaluate(() => JSON.stringify(__api.find((x) => x.a === "gk_gemeinsam_ende").p) === '{"id":"K1","nachricht":"M77"}'), "„verschickt“ mit Nachrichten-Kennung");
const m = await seite.evaluate(() => [...document.querySelectorAll(".meldung")].map((e) => e.textContent).join(" | "));
ok(/ist bei Karla angekommen – mit 3 Unterschriften/.test(m), "Meldung: " + m);
ok(await seite.evaluate(() => aktuelleAnsicht === "chat" && chatId === "T-KARLA" && !$("gkGemBlatt")), "danach ist der Chat mit Karla offen");
await bild("gk-senden-2-chat");
ok(!fehler.length, "keine Seitenfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log(process.exitCode ? "gk-senden-browser: FEHLER" : "gk-senden-browser: alle Prüfungen bestanden");
