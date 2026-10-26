// 2.670.0 KC-CLUB-HILFE-NACHTRAG-5: Browser-Test des echten app.js (Chromium über playwright-core).
// Videos „Wecker, Stoppuhr & Timer“ (neu), „Effekte“, „Neue Nachricht“, „Chat für Fortgeschrittene“ und „Mitglieder“ Schritt für Schritt: keine Fehler,
// Pflicht-Ziele sichtbar, nichts an den Server, am Ende alles wie vorher. Dazu Twinkey, Lupe und Sprachsuche zu den Neuheiten – und für Mitglieder keine Admin-Einträge.
// Start: PW_CORE=… PW_CHROME=… node tools/hilfe/hilfe-nachtrag5-browser.mjs
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8794);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8794/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
await seite.evaluate(() => {
  ICH = { ...(ICH || {}), person_id: "P1", name: "Klaus Test", vorname: "Klaus", admin: false, vorstand: false, buero: false }; MITGLIEDER = MITGLIEDER || [];
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  window.__api = []; window.__apiEcht = async (a, p) => { __api.push({ a, p }); return {}; }; api = __apiEcht;
  try { speechSynthesis.speak = () => {}; } catch {}
  esSchreib("an", "1"); // Eselsohr an (Wecker-Video gibt es nur dann)
});
async function video(id, ms = 1400) {
  return seite.evaluate(async ({ id, ms }) => {
    const warte = (t) => new Promise((x) => setTimeout(x, t)), los = (q) => (typeof q === "function" ? q() : document.querySelector(q));
    const schritte = []; rundgangStart(false, id); await warte(ms);
    for (let n = 0; n < 60 && RG.an; n++) {
      const s = RG.st[RG.i]; const ziele = (s.sel || []).map((q) => { try { return los(q); } catch { return null; } });
      schritte.push({ t: s.t, i: RG.i, sichtbar: ziele.some((z) => z && rgSichtbar(z)), muss: !!s.mussSel, modus: typeof wkModus === "function" ? wkModus() : "", stopp: JSON.parse(localStorage.getItem("kc_club_wecker") || "null")?.stopp?.runden?.length || 0 });
      if (RG.i >= RG.st.length - 1) break;
      rundgangSchritt(1); await warte(s.live ? Math.max(ms, 9000) : ms);
    }
    rundgangEnde(true); await warte(600);
    return schritte;
  }, { id, ms });
}
const zeig = (l) => console.log(l.map((s) => `  ${s.i} ${s.t} sichtbar=${s.sichtbar}${s.muss ? " (Pflicht)" : ""} modus=${s.modus} runden=${s.stopp}`).join("\n"));
// ⏰ Wecker-Video
const vorher = await seite.evaluate(() => ({ modus: wkModus(), stand: localStorage.getItem("kc_club_wecker"), es: ES.offen }));
const w = await video("wecker"); zeig(w);
ok(w.length === 8 && w.every((s) => !s.muss || s.sichtbar), "Video „Wecker, Stoppuhr & Timer“: 8 Schritte, jedes Pflicht-Ziel sichtbar");
ok(w.find((s) => /Wecker stellen/.test(s.t)).modus === "wecker" && w.find((s) => s.t === "⏱️ Stoppuhr mit Runden").modus === "stopp" && w.find((s) => s.t === "⏲️ Timer").modus === "timer", "Wecker, Stoppuhr und Timer jeweils gezeigt");
const wn = await seite.evaluate(() => ({ modus: wkModus(), stand: localStorage.getItem("kc_club_wecker"), es: ES.offen, sim: !!$("rgSim"), klingel: !!$("wkKlingel"), server: __api.filter((x) => /wecker/.test(x.a)).length }));
ok(wn.modus === vorher.modus && wn.stand === vorher.stand && !wn.es && !wn.sim && !wn.klingel, "am Ende: Anzeige und Stoppuhr wie vorher, Kopf zurückgedreht, kein Beispielbild");
ok(wn.server === 0, "kein Wecker an den Server");
// 🎬 Effekte, Neue Nachricht, Chat für Fortgeschrittene, Mitglieder
const vEin = await seite.evaluate(() => JSON.stringify({ s: localStorage.getItem("kc_club_schatten"), e: localStorage.getItem("kc_club_kachel_ecken") }));
const e = await video("effekte", 900); zeig(e);
// Einstellungs-Schritte überspringt das Video ohne Anmeldung (Einstellungsseite nicht aufgebaut) – der neue Schritt wird darum direkt geprüft
const se = await seite.evaluate(async () => { const s = RG_EFFEKTE.find((x) => x.t === "🌗 Schatten und Ecken"); document.querySelectorAll("section[id^='v-']").forEach((x) => x.classList.add("versteckt")); $("v-einstellungen").classList.remove("versteckt"); try { einstFuellen(); } catch {} s.vor();
  await new Promise((r) => setTimeout(r, 400)); const z = s.sel.map((q) => (typeof q === "function" ? q() : document.querySelector(q))); const h = RG_EFFEKTE.find((x) => x.t === "✨ Der Hauptschalter"), hz = h.sel.map((q) => (typeof q === "function" ? q() : document.querySelector(q)));
  const r = { da: !!s, ziele: z.map((x) => !!x && rgSichtbar(x)), puls: s.puls.map((q) => !!document.querySelector(q)), vergleich: hz.map((x) => !!x && rgSichtbar(x)), ansicht: aktuelleAnsicht, sichtbar: !$("v-einstellungen").classList.contains("versteckt") }; zeige("start"); return r; });
ok(se.da && se.ziele.every(Boolean) && se.puls.every(Boolean), "Effekte-Video: Schritt „Schatten und Ecken“ – Schalter und Regler auf der Einstellungsseite sichtbar " + JSON.stringify(se));
ok((await seite.evaluate(() => JSON.stringify({ s: localStorage.getItem("kc_club_schatten"), e: localStorage.getItem("kc_club_kachel_ecken") }))) === vEin, "Effekte-Video stellt nichts um");
const n = await video("nachricht", 900); zeig(n.filter((s) => /verschicken/.test(s.t)));
ok(n.find((s) => /Wie verschicken/.test(s.t))?.sichtbar, "Nachricht-Video: „📤 Wie verschicken?“ als Beispielbild");
const c = await video("chatprofi", 700);
ok(["Senden ohne Warten", "Jederzeit ändern", "Auch an weitere"].every((t) => c.find((s) => s.t.includes(t))?.sichtbar), "Chat-Video: Senden ohne Warten, Jederzeit ändern, Auch an weitere");
await video("mitglieder", 700);
const nach = await seite.evaluate(() => ({ sim: !!$("rgSim"), api: api === __apiEcht, senden: __api.filter((x) => /senden|nachricht|wecker|einstellung/.test(x.a)).map((x) => x.a) }));
ok(!nach.sim && nach.api && !nach.senden.length, "nach allen Videos: kein Beispielbild offen, nichts gesendet oder gespeichert" + (nach.senden.length ? " – " + nach.senden.join(",") : ""));
// Twinkey, Lupe, Sprachsuche
const t = await seite.evaluate(() => {
  const tw = (f) => twFinden(f).slice(0, 3).map((x) => x.e?.id || x.id);
  const lu = (q) => { SU.q = q; SU.genau = false; return suAppTreffer().slice(0, 3).map((x) => x.t); };
  return { tw1: tw("Kann ich einen Wecker stellen?"), tw2: tw("Mein Timer ist stumm"), tw3: tw("Was bedeutet Wie verschicken"), tw4: tw("Kann ich eine Nachricht später noch ändern?"),
    tw5: tw("Warum kann ich bei manchen nicht anklopfen?"), tw6: tw("Was ist die Sanduhr an meiner Nachricht?"), tw7: tw("Glückskeks bekommen"),
    lu1: lu("wecker"), lu2: lu("stoppuhr"), lu3: lu("wie verschicken"), lu4: lu("kachel zug"), lu5: lu("clubmoment"), lu6: lu("bildunterschrift"),
    sb1: sbErkennen("Wecker stellen"), sb2: sbErkennen("Timer"), sb3: sbErkennen("Kachel-Effekt"), sb4: sbErkennen("Nachricht an Klaus Wecker stellen"),
    video: twVideosHtml({ id: "f:wecker" }) };
});
console.log(JSON.stringify(t));
ok(t.tw1.includes("f:wecker") || t.tw1.includes("h:uhr_wecker"), "Twinkey: Wecker stellen");
ok(t.tw2.includes("f:wecker-stumm") || t.tw2.includes("h:wecker_ton"), "Twinkey: Timer stumm → Antippen für Ton");
ok(t.tw3.includes("f:wie-verschicken") || t.tw3.includes("h:wie_verschicken"), "Twinkey: Wie verschicken");
ok(t.tw4.includes("f:nachricht-aendern") || t.tw4.includes("h:nachricht_aendern"), "Twinkey: Nachricht später ändern");
ok(t.tw5.includes("f:anklopfen-blass") || t.tw5.includes("h:anklopfen_wahl"), "Twinkey: nicht anklopfen können");
ok(t.tw6.includes("f:sanduhr") || t.tw6.includes("h:sende_schlange"), "Twinkey: Sanduhr");
ok(t.tw7.includes("f:glueckskeks"), "Twinkey: Glückskeks");
ok(/Wecker, Stoppuhr/.test(t.video), "Twinkey bietet das Video „Wecker, Stoppuhr & Timer“ an");
ok(/Wecker/.test(t.lu1.join()) && /Wecker/.test(t.lu2.join()) && /verschicken/.test(t.lu3.join()) && /Register-Wechsel/.test(t.lu4.join()) && /Clubmoment/.test(t.lu5.join()) && /Bildunterschrift/.test(t.lu6.join()), "Lupe findet Wecker, Stoppuhr, Wie verschicken, Kachel-Zug, Clubmoment, Bildunterschrift");
ok(t.sb1?.art === "suche" && t.sb2?.art === "suche" && ["suche", "einst"].includes(t.sb3?.art) && t.sb4?.art === "nachricht", "Sprachsuche: Wecker, Timer → Lupe, Kachel-Effekt → Lupe oder Kachel-Einstellungen; „Nachricht an Klaus …“ bleibt Nachricht");
// Für Mitglieder: keine Admin-Einträge, kein „Admin“ in den Texten
const adm = await seite.evaluate(() => {
  const hz = HILFE.filter((x) => !x.nur || x.nur()), tw = TW_FAQ.filter((x) => !x.nur || x.nur()), lu = suAppListe ? suAppListe() : [];
  const wort = (s) => /\bAdmin\b|Admin-|\(Clubleitung\)/.test(String(s || "").replace(/Gruppen-Admin/g, ""));
  return { hz: hz.filter((x) => wort(x.t) || wort(x.x)).map((x) => x.id), tw: tw.filter((x) => wort(x.t) || wort(x.x)).map((x) => x.id), lu: lu.filter((x) => wort(x[1])).map((x) => x[1]),
    neu: ["uhr_wecker", "wecker_ton", "kachel_effekte", "clubabend_live", "geplant_vorab", "pinnwand_teil_ab", "abstimmung_mehrere", "wie_verschicken", "weitere_empfaenger", "sende_schlange", "nachricht_aendern", "chat_neu_markiert", "anklopfen_wahl", "clubmoment"].filter((id) => !hz.some((x) => x.id === id)) };
});
ok(!adm.hz.length && !adm.tw.length && !adm.lu.length, "Mitglied sieht in Hilfe, Twinkey und Lupe nichts von Admin" + JSON.stringify(adm));
ok(!adm.neu.length, "alle neuen Hilfe-Einträge für Mitglieder sichtbar");
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
