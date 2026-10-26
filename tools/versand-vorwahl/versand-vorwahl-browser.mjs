// 2.678.0 KC-CLUB-VERSAND-VORWAHL + KC-CLUB-CHAT-KOPF-KLAPPEN: Browser-Test des echten app.js – Senden an mehrere ohne Fenster (Voreinstellung),
// 📤-Feld für eine Nachricht, „❓ Jedes Mal fragen“ mit „☑️ Immer so“; Teilnehmerzeile im Chat-Kopf einzeilig mit weinrotem Pfeil, neuer Chat wieder zu.
// Start: PW_CORE=… PW_CHROME=… node tools/versand-vorwahl/versand-vorwahl-browser.mjs [bildordner]
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname), bilder = process.argv[2];
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8817);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 412, height: 860 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8817/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const r = await seite.evaluate(async () => {
  const warte = (ms) => new Promise((x) => setTimeout(x, ms));
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  ICH = { ...(ICH || {}), person_id: "P1", vorname: "Hansi", name: "Hansi Test", admin: false };
  const tn = ["P1", "P2", "P3", "P4"].map((id, i) => ({ person_id: id, name: ["Hansi Test", "Andrea Spahn", "Anne Reinkober", "Christina Brösel"][i] }));
  MITGLIEDER = tn.map((t) => ({ ...t, wege: { mail: true } }));
  chatId = "C1"; CHAT = { id: "C1", teilnehmer: tn }; anlagen = [];
  // Senden nur bis zur Versand-Entscheidung prüfen: danach abbrechen (sensibelGaesteOk liefert danach false)
  let gefragt = 0; const echt = versandWahl; versandWahl = (...a) => { gefragt++; return echt(...a); };
  const entscheide = async () => { ZW = { push: false, email: false, whatsapp: false }; $("text").value = "Test"; const p = senden(); await warte(500); const blatt = !!$("versandBlatt"); if (blatt) $("vwAbbruch")?.click(); await Promise.race([p, warte(800)]); return { blatt, zw: { ...ZW } }; };
  const a = { vorwahl: vwVorwahl() };
  versandZeigen(); a.knopf = !$("vwWegWahl").classList.contains("versteckt") ? $("vwWegWahl").textContent : null;
  a.standard = await entscheide();
  VW.einmal = "mail"; vwKnopfZeigen(); a.knopfEinmal = $("vwWegWahl").textContent; a.einmal = await entscheide();
  versandZurueck(); a.nachZurueck = VW.einmal;
  vwVorwahlSetzen("fragen", true); a.fragen = await entscheide();
  // Fenster mit „Immer so“
  $("text").value = "Test"; const p2 = senden(); await warte(500); const f = $("versandBlatt"); f.querySelector('[data-k="push"]').click(); $("vwImmer").checked = true;
  let gesendet = false; const apiAlt = api; window.api = api = async (x, d) => { gesendet = true; return {}; }; $("vwSenden").click(); await warte(500); api = apiAlt;
  a.nachImmer = vwVorwahl();
  vwVorwahlSetzen("eingestellt", true);
  // Einstellungen
  vwVorwahlEinstellungen(); a.einst = $("vwVorwahlWahl").querySelectorAll("input[type=radio]").length;
  // Chat-Kopf
  document.querySelectorAll("section[id^='v-']").forEach((x) => x.classList.add("versteckt")); $("v-chat").classList.remove("versteckt");
  const t = $("chatTeilnehmer"); t.textContent = "Runde (keine feste Gruppe) · Mit: " + ["Andrea Spahn", "Anne Reinkober", "Christina Brösel", "Dieter Zander", "Frank Brösel", "Fridbert Köhling", "Karla Kazik", "Manfred Schoppmann", "Marianne Bierkämper", "Peter Wördemann", "Reinhilde Eggenstein", "Steven Linley", "Willfried Wittwer", "Klaus Zander"].join(", ");
  chatTnPfeil(); await warte(100);
  const k = { zu: t.getBoundingClientRect().height, pfeil: !$("chatTeilnehmerPfeil").classList.contains("versteckt") };
  chatTnKlappen(); await warte(300); k.auf = t.getBoundingClientRect().height; k.offen = $("chatUnterzeile").classList.contains("auf");
  chatId = "C2"; chatTnPfeil(); k.neuerChatZu = !$("chatUnterzeile").classList.contains("auf");
  chatId = "C1";
  return { a, gefragt, k, gesendet };
});
console.log(JSON.stringify(r));
ok(r.a.vorwahl === "eingestellt" && /Wie jeder es eingestellt hat/.test(r.a.knopf || ""), "Standard: „⚙️ Wie jeder es eingestellt hat“, 📤-Feld in der Versand-Leiste sichtbar");
ok(!r.a.standard.blatt && !r.a.standard.zw.email && !r.a.standard.zw.push, "an mehrere: kein Fenster mehr, Weg wie jeder es eingestellt hat");
ok(/Nur E-Mail/.test(r.a.knopfEinmal) && !r.a.einmal.blatt && r.a.einmal.zw.email && !r.a.einmal.zw.push && r.a.nachZurueck === null, "📤 nur für diese Nachricht „Nur E-Mail“ – danach wieder die Voreinstellung");
ok(r.a.fragen.blatt, "„❓ Jedes Mal fragen“: das Fenster kommt wieder");
ok(r.a.nachImmer === "push", "Fenster: „☑️ Immer so – nicht mehr fragen“ macht die Wahl zur Voreinstellung");
ok(r.a.einst === 7, "Einstellungen: 6 Wege + „Jedes Mal fragen“");
ok(r.k.pfeil && r.k.zu < 40 && r.k.auf > r.k.zu * 2 && r.k.offen, `Chat-Kopf: Teilnehmer einzeilig (${Math.round(r.k.zu)} px) mit Pfeil, aufgeklappt ${Math.round(r.k.auf)} px`);
ok(r.k.neuerChatZu, "neuer Chat beginnt eingeklappt");
if (bilder) { await seite.evaluate(() => { chatTnKlappen(false); }); await seite.screenshot({ path: path.join(bilder, "chatkopf-zu.png"), clip: { x: 0, y: 0, width: 412, height: 220 } });
  await seite.evaluate(() => chatTnKlappen(true)); await seite.screenshot({ path: path.join(bilder, "chatkopf-auf.png"), clip: { x: 0, y: 0, width: 412, height: 420 } }); }
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
