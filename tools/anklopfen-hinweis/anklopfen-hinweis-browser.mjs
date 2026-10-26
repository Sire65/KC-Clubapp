// 2.660.0 KC-CLUB-ANKLOPFEN-HINWEIS: Browser-Test des echten app.js – geht Anklopfen nicht (deaktiviert, nicht online, Online-Status verborgen,
// ich verberge selbst), bleibt 👋 blass sichtbar und erklärt den Grund mit „💬 Nachricht schreiben“. Start: PW_CORE=… PW_CHROME=… node tools/anklopfen-hinweis/anklopfen-hinweis-browser.mjs [bildordner]
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname), bilder = process.argv[2];
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8808);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 420, height: 860 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8808/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const r = await seite.evaluate(() => {
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt"); $("tdtBlatt")?.classList.add("versteckt");
  ICH = { ...(ICH || {}), person_id: "P-ICH", vorname: "Hansi" };
  const M = { an: { person_id: "P-AN", name: "Anna Online", vorname: "Anna" }, aus: { person_id: "P-AUS", name: "Bert Blockt", vorname: "Bert" },
    off: { person_id: "P-OFF", name: "Carla Weg", vorname: "Carla" }, verb: { person_id: "P-VERB", name: "Dora Versteckt", vorname: "Dora", verborgen: true } };
  MITGLIEDER = Object.values(M);
  Object.assign(ONL, { zeigen: true, liste: [{ person_id: "P-AN", vorname: "Anna", klopfbar: true }, { person_id: "P-AUS", vorname: "Bert", klopfbar: false }], stand: Date.now() });
  ONL.ids = new Set(ONL.liste.map((x) => x.person_id));
  const knopf = (m) => { const d = document.createElement("div"); d.innerHTML = mgKlopfKnopf(m); const b = d.firstElementChild; return { blass: b.classList.contains("mg-aus"), sym: b.textContent, klick: b.getAttribute("onclick") }; };
  const dialog = (pid) => { document.querySelectorAll(".dlg-kopf").forEach((h) => h.closest("[class]")?.remove()); klopfNichtMoeglich(pid); const h = [...document.querySelectorAll(".dlg-kopf")].pop(); const t = h?.parentElement?.textContent || ""; return { kopf: h?.textContent || "", chat: t.includes("Nachricht schreiben") }; };
  const k = Object.fromEntries(Object.entries(M).map(([n, m]) => [n, knopf(m)]));
  const d = { off: dialog("P-OFF"), verb: dialog("P-VERB") };
  ONL.zeigen = false; const ich = { knopf: knopf(M.off), dlg: dialog("P-OFF") }; ONL.zeigen = true;
  document.querySelectorAll(".dlg-kopf").forEach((h) => h.closest("[class]")?.remove()); klopfGesperrt("P-AUS", "Bert"); const g = [...document.querySelectorAll(".dlg-kopf")].pop()?.textContent;
  document.querySelectorAll(".dlg-kopf").forEach((h) => h.closest("[class]")?.remove()); klopfNichtMoeglich("P-OFF");
  return { k, d, ich, g, selbst: mgKlopfKnopf(ICH) };
});
ok(!r.k.an.blass && r.k.an.sym === "👋" && /anklopfen\('P-AN'\)/.test(r.k.an.klick), "online + erlaubt: 👋 klopft an");
ok(r.k.aus.blass && r.k.aus.sym === "🔕" && /anklopfen\('P-AUS'\)/.test(r.k.aus.klick) && r.g === "🔕 Bert hat Anklopfen deaktiviert", "deaktiviert: 🔕 blass → „Bert hat Anklopfen deaktiviert“");
ok(r.k.off.blass && /klopfNichtMoeglich/.test(r.k.off.klick) && r.d.off.kopf.includes("Carla ist gerade nicht online") && r.d.off.chat, "nicht online: 👋 blass → Grund + 💬 Nachricht schreiben");
ok(r.k.verb.blass && r.d.verb.kopf.includes("Dora zeigt den Online-Status nicht") && r.d.verb.chat, "Online-Status verborgen: Grund + 💬");
ok(r.ich.knopf.blass && r.ich.dlg.kopf.includes("Du zeigst nicht, wann du online bist"), "ich verberge selbst: Grund + Weg zur Einstellung");
ok(r.selbst === "", "bei mir selbst kein Knopf");
if (bilder) await seite.screenshot({ path: path.join(bilder, "anklopfen-hinweis.png") });
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
