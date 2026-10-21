// 2.533.0 KC-CLUB-HILFE-NACHTRAG-4: Browser-Test des echten app.js (Chromium über playwright-core).
// Video „Geheim schreiben“, „Hilfe, Suche & Twinkey“ (Lupe + Sprachsuche) und „Chat für Fortgeschrittene“ Schritt für Schritt: keine Fehler,
// Ziele sichtbar, nichts an den Server, am Ende alles wie vorher. Dazu Twinkey, Lupe und Sprachsuche zu den neuen Einträgen.
// Start: PW_CORE=… PW_CHROME=… node tools/hilfe/hilfe-nachtrag4-browser.mjs
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8793);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8793/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
await seite.evaluate(() => {
  ICH = { ...(ICH || {}), person_id: "P1", name: "Hansi Test", vorname: "Hansi" }; MITGLIEDER = MITGLIEDER || [];
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt"); // ohne Zugangslink wäre die App gesperrt
  window.__api = []; window.__apiEcht = async (a, p) => { __api.push({ a, p }); return {}; }; api = __apiEcht;
  try { speechSynthesis.speak = () => {}; } catch {}
});
// Video Schritt für Schritt: je Schritt warten, Titel, sichtbares Ziel (bei mussSel Pflicht) und Fehler sammeln
async function video(id, ms = 1600) {
  return seite.evaluate(async ({ id, ms }) => {
    const warte = (t) => new Promise((x) => setTimeout(x, t)), los = (q) => (typeof q === "function" ? q() : document.querySelector(q));
    const schritte = []; rundgangStart(false, id); await warte(ms);
    for (let n = 0; n < 40 && RG.an; n++) {
      const s = RG.st[RG.i]; const ziele = (s.sel || []).map((q) => { try { return los(q); } catch { return null; } });
      schritte.push({ t: s.t, i: RG.i, sichtbar: ziele.some((z) => z && rgSichtbar(z)), muss: !!s.mussSel, extra: id === "geheim" ? { sim: !!$("rgSim"), chat: chatId, schloss: $("vnKnopf")?.classList.contains("an"), zu: !!document.querySelector("#msg-rg-gh-2 .vn-zu"), auf: !!document.querySelector("#msg-rg-gh-3 .vn-auf"), vb: !$("chatVbKnopf")?.classList.contains("versteckt") && $("chatVbKnopf")?.textContent } : id === "hilfe" ? { su: SU.offen, treffer: (SU_APP || []).slice(0, 3).map((x) => x.t) } : { hinweis: $("schreibtHinweis")?.textContent || "" } });
      if (RG.i >= RG.st.length - 1) break;
      rundgangSchritt(1); await warte(ms);
    }
    rundgangEnde(true); await warte(400);
    return schritte;
  }, { id, ms });
}
const vorher = await seite.evaluate(() => ({ chat: chatId, vn: VN.an, klar: VN.klar.size }));
const g = await video("geheim");
console.log(g.map((s) => `${s.i} ${s.t} sichtbar=${s.sichtbar}${s.muss ? " (Pflicht)" : ""} ${JSON.stringify(s.extra)}`).join("\n"));
ok(g.length >= 12, "Video „Geheim schreiben“: alle " + g.length + " Schritte durchgelaufen");
ok(g.every((s) => !s.muss || s.sichtbar), "jedes Pflicht-Ziel war sichtbar");
ok(g.find((s) => /Schloss an/.test(s.t))?.extra.schloss === true, "„Schloss an“ zeigt das grüne Schloss");
ok(g.find((s) => /So kommt sie an/.test(s.t))?.extra.zu && g.find((s) => /Geöffnet/.test(s.t))?.extra.auf, "Beispiel-Blasen: verschlossen und geöffnet");
ok(/Schlüsselbund mit Anne/.test(g.find((s) => /Bequemer/.test(s.t))?.extra.vb || ""), "⋮-Menü zeigt „🔑 Schlüsselbund mit Anne“");
ok(g.filter((s) => /Rückfrage|festlegen|Fünf Schlüssel/.test(s.t)).every((s) => s.extra.sim), "Rückfrage, Schlüssel und Schlüsselbund als Beispielbild");
const nach = await seite.evaluate(() => ({ chat: chatId, vn: VN.an, klar: VN.klar.size, sim: !!$("rgSim"), blatt: $("chatBlatt").classList.contains("versteckt"), schloss: $("vnKnopf")?.classList.contains("an"), api: api === __apiEcht,
  server: __api.filter((x) => JSON.stringify(x.p || {}).includes("rg-gh")).length, vbGespeichert: Object.keys(localStorage).some((k) => k.startsWith("kc_club_vbund:") || k.startsWith("kc_club_vschluessel:")) }));
ok(nach.api && nach.chat === vorher.chat && nach.vn === vorher.vn && nach.klar === vorher.klar && !nach.schloss, "am Ende: api, Chat, Schloss und geöffnete Texte wie vorher");
ok(!nach.sim && nach.blatt, "Beispielbilder und ⋮-Menü wieder zu");
ok(nach.server === 0 && !nach.vbGespeichert, "nichts an den Server, kein Schlüssel und kein Schlüsselbund gespeichert");
const h = await video("hilfe");
console.log(h.map((s) => `${s.i} ${s.t} sichtbar=${s.sichtbar} ${JSON.stringify(s.extra)}`).join("\n"));
const lupe = h.find((s) => /Lupe findet alles/.test(s.t));
ok(lupe && lupe.sichtbar && lupe.extra.su && /verschlüsselt/i.test(lupe.extra.treffer.join(" ")), "Hilfe-Video: Lupe offen mit „verschlüsselt“ – Treffer oben: " + lupe?.extra.treffer.join(" · "));
ok(h[h.length - 1].extra.su === false && (await seite.evaluate(() => SU.offen)) === false, "Lupe am Ende wieder zu");
ok(!(await seite.evaluate(() => __api.some((x) => /^such/.test(x.a)))), "Lupe im Video fragt den Server nicht");
const c = await video("chatprofi", 900);
const sh = c.find((s) => /schreibt dir gerade/.test(s.t));
ok(sh && sh.sichtbar && /Anne/.test(sh.extra.hinweis), "Chat-Video: Hinweis „✍️ Anne schreibt dir gerade …“ gezeigt");
ok(!(await seite.evaluate(() => !!$("schreibtHinweis"))), "Hinweis am Ende weg");
// Twinkey, Lupe, Sprachsuche
const t = await seite.evaluate(() => {
  const tw = (f) => twFinden(f).slice(0, 3).map((x) => x.e?.id || x.id);
  const lu = (q) => { SU.q = q; SU.genau = false; return suAppTreffer().slice(0, 3).map((x) => x.t); };
  return { tw1: tw("Wie schicke ich eine Nachricht verschlüsselt?"), tw2: tw("Ich soll einen Schlüssel eingeben, will aber nicht verschlüsseln"), tw3: tw("Wo ist Express und Wichtig hin?"), tw4: tw("Was ist der Schlüsselbund"),
    tw5: tw("Fotos aus der Galerie an den Club teilen"), tw6: tw("Mann mit Hut und Koffer"),
    lu1: lu("verschlüsselt"), lu2: lu("schlüsselbund"), lu3: lu("ablagekorb"), lu4: lu("versand leiste"), lu5: lu("verschlüseln"),
    sb1: sbErkennen("verschlüsselt schreiben"), sb2: sbErkennen("Schlüsselbund"), sb3: sbErkennen("Diashow starten"), sb4: sbErkennen("Nachricht an Klaus geheime Nachricht"),
    video: twVideosHtml({ id: "f:verschluesseln" }) };
});
console.log(JSON.stringify(t, null, 1));
ok(t.tw1[0] === "f:verschluesseln" || t.tw1.includes("h:verschluesselt"), "Twinkey: „verschlüsselt schicken“ → passende Antwort");
ok(t.tw2.includes("f:schluessel-frage"), "Twinkey: „will nicht verschlüsseln“ → Normal senden");
ok(t.tw3.includes("f:versand-leiste"), "Twinkey: „Wo ist Express und Wichtig hin?“ → Versand-Leiste");
ok(t.tw4.includes("f:schluesselbund") || t.tw4.includes("h:schluesselbund"), "Twinkey: Schlüsselbund");
ok(t.tw5.some((x) => /ablagekorb|teilen/.test(x)), "Twinkey: Teilen → Ablagekorb");
ok(t.tw6.includes("f:geheimagent"), "Twinkey: Geheimagent");
ok(/Geheim schreiben/.test(t.video), "Twinkey bietet das Video „Geheim schreiben“ an");
ok(/verschlüsselt/i.test(t.lu1[0]) && /Schlüsselbund/.test(t.lu2.join()) && /Ablagekorb/.test(t.lu3.join()) && /Express/.test(t.lu4.join()) && /verschlüsselt/i.test(t.lu5.join()), "Lupe findet Verschlüsseln, Schlüsselbund, Ablagekorb, Versand-Leiste (auch mit Tippfehler)");
ok(t.sb1?.art === "suche" && t.sb2?.art === "suche" && t.sb3?.q === "diashow fotoalbum" && t.sb4?.art === "nachricht", "Sprachsuche: „verschlüsselt schreiben“, „Schlüsselbund“, „Diashow starten“ → Lupe; „Nachricht an Klaus …“ bleibt Nachricht");
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
