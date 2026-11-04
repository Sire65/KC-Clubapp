// 2.855.0 KC-CLUB-HILFE-NACHTRAG-6: Browser-Test des echten app.js (Chromium über playwright-core).
// Geänderte Videos (Pinnwand, Fotoalbum, Neue Nachricht, Privatsphäre, Chat für Fortgeschrittene, Überblick, Oberfläche) Schritt für Schritt:
// keine Fehler, Pflicht-Ziele sichtbar, nichts an den Server. Dazu Twinkey und Lupe zu den Neuheiten 2.672.0–2.847.0 –
// und für Mitglieder keine Admin-Einträge, Runder-Tisch-Hilfe nur mit Freigabe.
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/hilfe-nachtrag6-browser.mjs
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server, sonst löst ein Proxy die Namen auf)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8796);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 400, height: 800 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.routeWebSocket(/.*/, (ws) => ws.close());
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8796/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
await seite.evaluate(() => {
  ICH = { ...(ICH || {}), person_id: "P1", name: "Klaus Test", vorname: "Klaus", admin: false, vorstand: false, buero: false }; MITGLIEDER = MITGLIEDER || [];
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  window.__api = []; window.__apiEcht = async (a, p) => { __api.push({ a, p }); return {}; }; api = __apiEcht;
  try { speechSynthesis.speak = () => {}; } catch {}
});
await seite.evaluate(() => teilLaden("videos")); await seite.evaluate(() => teilLaden("hilfe"));
async function video(id, ms = 700) {
  return seite.evaluate(async ({ id, ms }) => {
    const warte = (t) => new Promise((x) => setTimeout(x, t)), los = (q) => (typeof q === "function" ? q() : document.querySelector(q));
    const schritte = []; rundgangStart(false, id); await warte(ms);
    for (let n = 0; n < 80 && RG.an; n++) {
      const s = RG.st[RG.i]; const ziele = (s.sel || []).map((q) => { try { return los(q); } catch { return null; } });
      schritte.push({ t: s.t, i: RG.i, sichtbar: ziele.some((z) => z && rgSichtbar(z)), muss: !!s.mussSel, x: typeof s.x === "function" ? s.x() : s.x });
      if (RG.i >= RG.st.length - 1) break;
      rundgangSchritt(1); await warte(ms);
    }
    rundgangEnde(true); await warte(500);
    return schritte;
  }, { id, ms });
}
const p = await video("pinnwand");
ok(p.length > 2 && !p.some((s) => /beim Öffnen der App/.test(s.x)) && p.some((s) => /bleibt bei allen groß an der Wand/.test(s.x)), "Pinnwand-Video: wichtiger Zettel bleibt groß an der Wand (nicht mehr „beim Öffnen“)");
await seite.evaluate(() => { VI.art = "videos"; });
const f = await video("fotos");
ok(f.length > 2 && f.every((s) => !s.muss || s.sichtbar) && f.some((s) => s.t === "🎬 Fotos und Videos"), "Fotoalbum-Video: Umschalter Fotos/Videos gezeigt");
ok(await seite.evaluate(() => VI.art === "videos"), "Fotoalbum-Video: danach wieder auf „🎬 Videos“ wie vorher");
const n = await video("nachricht");
ok(n.every((s) => !s.muss || s.sichtbar) && n.some((s) => /Lesezeichen/.test(s.x)), "Nachricht-Video: Gemerkt = Lesezeichen");
const c = await video("chatprofi");
ok(c.some((s) => s.t === "🔖 Alles Gemerkte"), "Chat-Video: 🔖 Alles Gemerkte");
const u = await video("ueberblick");
ok(u.some((s) => /Vornamen/.test(s.x)) && !u.some((s) => /offene Zettel/.test(s.x)), "Überblick: Namen im Kopf, „neue Zettel“ statt „offene Zettel“");
await video("oberflaeche"); await video("privat");
const nach = await seite.evaluate(() => ({ sim: !!$("rgSim"), api: api === __apiEcht, alle: [...new Set(__api.map((x) => x.a))], senden: __api.filter((x) => /senden|speichern|setzen|einstellung|merken|gesehen|loeschen|hochladen|anlegen/.test(x.a)).map((x) => x.a) }));
console.log("Server-Aufrufe (nur gespielt):", nach.alle.join(", "));
ok(!nach.sim && nach.api && !nach.senden.length, "nach allen Videos: kein Beispielbild offen, nichts gesendet oder gespeichert" + (nach.senden.length ? " – " + nach.senden.join(",") : ""));
// Twinkey und Lupe
const t = await seite.evaluate(() => {
  const tw = (f) => twFinden(f).slice(0, 4).map((x) => x.e?.id || x.id);
  const lu = (q) => { SU.q = q; SU.genau = false; return suAppTreffer().slice(0, 4).map((x) => x.t); };
  return {
    tw: { lese: tw("Was bedeuten die Haken unter einem Chat?"), video: tw("Kann ich ein Video hochladen?"), pin: tw("Warum geht die Pinnwand nicht mehr von selbst auf?"), gruss: tw("Liebe Grüße einsetzen"),
      blinkt: tw("Warum blinkt der Knopf Nachrichten rot?"), rechnen: tw("Kann die App rechnen?"), voll: tw("Die App ist mir zu voll"), online: tw("Was sind die grünen Namen oben?") },
    lu: { video: lu("video hochladen"), impressum: lu("impressum"), pin: lu("app-pin"), gruss: lu("grußformel"), gliederung: lu("gliederung"), rechner: lu("rechner"), tipps: lu("meine tipps"), disco: lu("disco"), ordner: lu("vorschlag in ordner") },
  };
});
console.log(JSON.stringify(t));
const hat = (l, re) => l.some((x) => re.test(x));
ok(hat(t.tw.lese, /lesestand/) && hat(t.tw.video, /video/) && hat(t.tw.pin, /pinnwand/) && hat(t.tw.gruss, /gruss/) && hat(t.tw.blinkt, /blinkt/) && hat(t.tw.rechnen, /rechner/) && hat(t.tw.voll, /zu-voll|ansicht/) && hat(t.tw.online, /online/), "Twinkey findet die Neuheiten");
ok(hat(t.lu.video, /Video/) && hat(t.lu.impressum, /Impressum/) && hat(t.lu.pin, /PIN/) && hat(t.lu.gruss, /Grußformel/) && hat(t.lu.gliederung, /gliedern/) && hat(t.lu.rechner, /rechner/i) && hat(t.lu.tipps, /Tipps/) && hat(t.lu.disco, /Thema/) && hat(t.lu.ordner, /Ordner/), "Lupe findet die Neuheiten");
// Für Mitglieder: nichts von Admin, Runder Tisch nur mit Freigabe
const adm = await seite.evaluate(() => {
  const hz = HILFE.filter((x) => !x.nur || x.nur()), tw = TW_FAQ.filter((x) => !x.nur || x.nur()), lu = suAppListe();
  const wort = (s) => /\bAdmin\b|Admin-|\(Clubleitung\)/.test(String(s || "").replace(/Gruppen-Admin/g, ""));
  return { hz: hz.filter((x) => wort(x.t) || wort(x.x)).map((x) => x.id), tw: tw.filter((x) => wort(x.t) || wort(x.x)).map((x) => x.id), lu: lu.filter((x) => wort(x[1])).map((x) => x[1]),
    tisch: hz.filter((x) => /^tisch_/.test(x.id)).map((x) => x.id), freiTisch: frei("runder_tisch"),
    neu: ["lesestand_liste", "videos_album", "foto_platz", "archiv_mehr", "impressum", "hilfe_tipp", "vorschlag_erledigt", "register_umbenennen", "umblaettern", "rechner_sprache", "nachrichten_gliederung", "kom_symbole", "nachrichten_blinkt", "grussformel", "online_namen", "app_pin", "link_vorsicht", "neues_geraet", "protokoll_schreiben", "vorschlag_ordner"].filter((id) => !hz.some((x) => x.id === id)) };
});
ok(!adm.hz.length && !adm.tw.length && !adm.lu.length, "Mitglied sieht in Hilfe, Twinkey und Lupe nichts von Admin " + JSON.stringify(adm));
ok(adm.freiTisch || !adm.tisch.length, "Runder-Tisch-Hilfe nur, wenn der Runde Tisch freigegeben ist");
ok(!adm.neu.length, "alle neuen Hilfe-Einträge für Mitglieder sichtbar " + adm.neu.join(","));
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close(); console.log("ALLE TESTS GRÜN");
