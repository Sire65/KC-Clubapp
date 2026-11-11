// KC-CLUB-SPRACHE (10.11.2026): Browser-Prüfung mit dem echten app.js – Flagge im Kopf schaltet Deutsch ↔ English (nur Bedienelemente),
// Inhalte bleiben deutsch, nichts überlappt, Wahl bleibt nach Neustart; keine Fehler, nichts an den Server.
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/sprache-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8813);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close());
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8813/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const anmelden = () => seite.evaluate(() => {
  ICH = { ...(ICH || {}), person_id: "P1", name: "Klaus Test", vorname: "Klaus", admin: false, vorstand: false, buero: false }; MITGLIEDER = MITGLIEDER || [];
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  window.__api = window.__api || []; api = async (a, p) => { __api.push({ a, p }); return a === "unterhaltungen" ? { unterhaltungen: [] } : {}; };
  zeige("start", true); $("begruessung").textContent = kopfGruss();
  for (const e of document.querySelectorAll(".meldung, .blatt:not(.versteckt)")) e.remove();
  if (!$("spProbe")) document.body.insertAdjacentHTML("beforeend", '<div id="spProbe"><div class="spiel"><button id="spSpiel">▶ Start</button></div><div id="chat"><button id="spChat">Abbrechen</button></div><div class="karte"><button id="spInhalt" type="button" data-test="1">Termine Werne 2027</button></div></div>');
});
const bild = async (n) => { if (process.env.BILDER) await seite.evaluate(() => document.querySelectorAll(".meldung, .blatt:not(.versteckt)").forEach((e) => e.remove())); if (process.env.BILDER) await seite.screenshot({ path: process.env.BILDER + "/" + n + ".png", clip: { x: 0, y: 0, width: 400, height: 140 } }); };
const lage = () => seite.evaluate(() => { ICH = { ...(ICH || {}), person_id: "P1", name: "Klaus Test", vorname: "Klaus" }; $("begruessung").textContent = kopfGruss(); return { flagge: $("spKnopf").title, lang: document.documentElement.lang, gruss: $("begruessung").textContent,
  fuss: [...document.querySelectorAll(".fuss-leiste button")].map((b) => b.textContent.replace(/[^\p{L}]/gu, "")),
  spiel: $("spSpiel").textContent, chat: $("spChat").textContent, inhalt: $("spInhalt").textContent }; });
await anmelden(); await seite.waitForTimeout(3000); await anmelden(); await seite.waitForTimeout(300);
let l = await lage();
ok(/Deutsch/.test(l.flagge) && l.lang !== "en" && l.gruss === "Hallo Klaus!" && l.fuss.join(",").includes("Start,Termine,Nachrichten,Mitglieder,Mehr"), "Start: Deutsch, Flagge 🇩🇪, „Hallo Klaus!“"); await bild("sprache-de");
await seite.evaluate(() => $("spKnopf").click()); await seite.waitForTimeout(1200);
l = await lage();
ok(/English/.test(l.flagge) && l.lang === "en", "Antippen: Flagge 🇬🇧, Seite englisch (Teil nachgeladen)");
ok(/^Good (morning|afternoon|evening), Klaus!$/.test(l.gruss), "Begrüßung: " + l.gruss);
ok(l.fuss.join(",").includes("Home,Events,Messages,Members,More"), "Leiste unten: " + l.fuss.join(", "));
ok(l.spiel === "▶ Start" && l.chat === "Abbrechen" && l.inhalt !== "Events Werne 2027", "Inhalte bleiben deutsch (Spiel-Start, Chat, Inhaltsknopf)"); await bild("sprache-en");
await seite.evaluate(() => { document.body.insertAdjacentHTML("beforeend", '<div id="spNeu"><button>💾 Speichern</button><button title="Schließen">✕</button></div>'); }); await seite.waitForTimeout(200);
ok(await seite.evaluate(() => $("spNeu").children[0].textContent === "💾 Save" && $("spNeu").children[1].title === "Close"), "später gezeichnete Knöpfe werden auch übersetzt (💾 Save, Hinweis „Close“)");
const toast = await seite.evaluate(async () => { melde("💾 Gespeichert"); melde("Bitte ein Datum wählen.", true); await new Promise((r) => setTimeout(r, 150));
  const t = [...document.querySelectorAll("body > .meldung")].map((m) => m.textContent); document.querySelectorAll("body > .meldung").forEach((m) => m.remove()); return t; });
ok(toast.includes("💾 Saved") && toast.includes("Please choose a date."), "kurze Meldungen unten englisch: " + toast.join(" · "));
const dlg = await seite.evaluate(async () => { const p = frage("Eintrag löschen?"); await new Promise((r) => setTimeout(r, 150));
  const f = [...document.querySelectorAll(".dlg-blatt")].pop(), t = [f?.querySelector(".dlg-kopf")?.textContent, ...[...(f?.querySelectorAll("button") || [])].map((b) => b.textContent)]; f?.querySelector("[data-w='0']")?.click(); return t; });
ok(dlg[0] === "Delete entry?" && dlg.some((x) => /Delete/.test(x)) && dlg.some((x) => /Cancel/.test(x)), "Rückfrage-Fenster englisch: " + dlg.join(" · "));
const muster = await seite.evaluate(async () => { document.body.insertAdjacentHTML("beforeend", '<div id="spMu"><button>Di., 10.11., 19:30 Uhr</button><button>3 neue Nachrichten</button><button>Anfrage an Klaus</button></div>'); await new Promise((r) => setTimeout(r, 100)); return [...$("spMu").children].map((b) => b.textContent); });
ok(muster.join("|") === "Tue, 10.11., 19:30|3 new messages|Request to Klaus", "Datum, Zahlen und Namen: " + muster.join(" · "));
await seite.evaluate(() => zeige("einstellungen")); await seite.waitForTimeout(500);
ok(await seite.evaluate(() => [...document.querySelectorAll("#v-einstellungen summary")].some((s) => /✨ Effects/.test(s.textContent))), "⚙️ More: Klappen-Überschriften englisch");
ok(await seite.evaluate(() => [...document.querySelectorAll("#v-einstellungen .schalter > div > b")].some((b) => /Flip tiles/.test(b.textContent))), "⚙️ More: Schalter-Namen englisch (🔄 Flip tiles)");
ok(await seite.evaluate(() => [...document.querySelectorAll("#v-einstellungen .schalter .hinweis")].some((h) => /^Deleted items visibly run through the shredder\. Applies to this device\.$/.test(h.textContent.trim()))), "⚙️ More: Erklärtexte unter den Schaltern englisch");
await seite.evaluate(() => zeige("start", true));
// nichts überlappt (Pfeile, Flagge, Balken, Schriftzug)
for (const w of [360, 412]) { await seite.setViewportSize({ width: w, height: 780 }); await seite.waitForTimeout(250);
  const t = await seite.evaluate(() => { const ids = ["kopfPfeil", "spKnopf", "netzBalken"], r = ids.map((i) => $(i).getBoundingClientRect()), treff = [];
    for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) if (r[i].width && r[j].width && !(r[i].right + 4 <= r[j].left || r[j].right + 4 <= r[i].left)) treff.push(ids[i] + "/" + ids[j]);
    const rg = document.createRange(); rg.selectNodeContents(document.querySelector("#v-start .marke-klein")); const tx = rg.getBoundingClientRect(), f = r[2];
    if (!(f.bottom <= tx.top || f.right <= tx.left || f.left >= tx.right)) treff.push("spKnopf/Schriftzug"); return treff; });
  ok(!t.length, `${w} px: Pfeile, Flagge und Balken mit Abstand nebeneinander` + (t.length ? " – " + t.join(", ") : "")); }
await seite.setViewportSize({ width: 400, height: 800 });
// Erklärvideo: währenddessen deutsch, danach wieder English
await seite.evaluate(async () => { await teilLaden("videos"); try { speechSynthesis.speak = () => {}; } catch {} rundgangStart(false); }); await seite.waitForTimeout(900);
ok((await lage()).fuss.join(",").includes("Start,Termine"), "Erklärvideo läuft: Bedienung deutsch (Video spricht deutsch)");
await seite.evaluate(() => rundgangEnde(true)); await seite.waitForTimeout(600);
ok((await lage()).fuss.join(",").includes("Home,Events"), "nach dem Video wieder English");
// zurück auf Deutsch (ab hier zählen: Umschalten allein fragt nichts beim Server an)
await seite.waitForTimeout(1500); const apiVorher = await seite.evaluate(() => __api.length);
await seite.evaluate(() => $("spKnopf").click()); await seite.waitForTimeout(500);
l = await lage();
ok(/Deutsch/.test(l.flagge) && l.lang === "de" && l.gruss === "Hallo Klaus!" && l.fuss.join(",").includes("Start,Termine,Nachrichten,Mitglieder,Mehr"), "zurück: alles wieder deutsch");
ok(await seite.evaluate(() => $("spNeu").children[0].textContent === "💾 Speichern" && $("spNeu").children[1].title === "Schließen"), "auch Hinweise wieder deutsch");
// Wahl bleibt nach Neustart
await seite.evaluate(() => $("spKnopf").click()); await seite.waitForTimeout(500);
const senden = await seite.evaluate((n) => __api.slice(n).filter((x) => !/^(spur_melden|unterhaltungen|start_melden|countdowns|init|pinnwand|pinnwand_neu)$/.test(x.a)).map((x) => x.a), apiVorher);
ok(!senden.length, "Umschalten fragt nichts beim Server an" + (senden.length ? " – " + senden.join(",") : ""));
await seite.reload(); await seite.waitForTimeout(2500); await anmelden(); await seite.waitForTimeout(3000); await anmelden(); await seite.waitForTimeout(800);
l = await lage();
ok(/English/.test(l.flagge) && l.lang === "en" && l.fuss.join(",").includes("Home,Events"), "nach Neustart wieder English (je Gerät gemerkt)");
await seite.evaluate(() => $("spKnopf").click()); await seite.waitForTimeout(300);
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? " – " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log("sprache-browser: alle Prüfungen bestanden");
