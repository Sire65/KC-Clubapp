// KC-CLUB-AUFGABEN-STAND (19.11.2026): Browser-Prüfung mit dem echten app.js und AUSGEDACHTEN Aufgaben („Tablets beschaffen“ mit „Christina Beispiel“ usw.):
// Startmeldung „📌 Wie steht's mit deiner Aufgabe?“ mit drei Knöpfen, 🔶 Teilweise ohne Text geht (freiwillig), Melden ruft die Aktion, „Später“ für den Rest,
// kein Überlauf bei 390 px, Protokoll-Ansicht/Entwurf/Druck mit „Stand der Aufgaben“. Nur Testdaten, nichts an den Server (KC-TESTS-OHNE-ECHTSERVER).
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/aufgaben-stand-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8829);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e) + (process.env.STAPEL ? " " + e.stack : "")));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.goto("http://localhost:8829/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
const bild = async (n, voll) => { if (process.env.BILDER) await seite.screenshot({ path: `${process.env.BILDER}/${n}.png`, fullPage: !!voll }); };
const weg = () => seite.evaluate(() => { for (const e of document.querySelectorAll(".meldung")) e.remove(); });
const ueberlauf = () => seite.evaluate(() => { const b = document.querySelector("#astBlatt .blatt-innen") || document.querySelector("#protokollInhalt");
  return { seite: document.documentElement.scrollWidth, blatt: b ? b.scrollWidth - b.clientWidth : 0 }; });
await seite.evaluate(() => {
  const tag = (d) => new Date(Date.now() + d * 86400000).toISOString();
  ICH = { ...(ICH || {}), person_id: "P1", name: "Frank Test", vorname: "Frank", admin: false, vorstand: true, protokolle: true, buero: false };
  MITGLIEDER = [["P1", "Frank Test"], ["P2", "Christina Beispiel"], ["P3", "Klaus Probe"], ["P4", "Erika Muster"]].map(([person_id, name]) => ({ person_id, name }));
  const stand = [
    { text: "Tablets beschaffen", namen: ["Frank", "Christina"], aus: "2026-10-30", stand: "erledigt", am: "2026-11-21T10:00:00Z", notiz: "2 Tablets gekauft", neu: true, gruppe: "G" },
    { text: "Glühwein bestellen", namen: ["Klaus"], aus: "2026-10-30", stand: "teilweise", am: "2026-11-22T09:00:00Z", notiz: "Angebot fehlt noch", neu: true, gruppe: "a3" },
    { text: "Kasse prüfen", namen: ["Erika"], aus: "2026-10-02", stand: "keine", neu: false, gruppe: "a5", fehltNamen: ["Erika"] }];
  const pr = (entwurf) => ({ protokoll: { id: "PR1", treffen_id: null, titel: "Sitzung des Köcheclubs", datum: "2026-11-24", ort: "Vereinsheim", gaeste: "", kurzfassung: "", naechster_termin: null, tagesordnung: ["Begrüßung"], tagesordnungVon: [], beschluesse: [], vertagt: [],
      version: 1, veroeffentlicht_am: entwurf ? null : tag(-1), einspruch_bis: entwurf ? null : tag(6), status: entwurf ? "entwurf" : "einspruch", roh: entwurf ? "entwurf" : "veroeffentlicht",
      verfasser: { person_id: "P1", name: "Frank Test", offen: false }, anwesend: [{ person_id: "P1", name: "Frank Test" }], entschuldigt: [] },
    anlagen: [], einwaende: [], fassungen: [], gelesen: null, darfBearbeiten: entwurf, darfLoeschen: false, eigen: true, pruefung: null, schreiber: ["P1"], naechsterVorschlag: null, nachtraege: [],
    aufgaben: [{ id: "A9", person_id: "P1", gruppe: null, name: "Frank Test", text: "Grill reinigen", faellig: "2026-12-01", erledigt_am: null, bemerkung: null, meine: true, verwalten: true, stand: "nicht", stand_am: "2026-11-23T08:00:00Z", stand_text: "Ersatzteil fehlt", stand_ziel: "2026-12-10" }],
    aufgabenStand: stand, aufgabenStandLebendig: entwurf, aufgabenNachgefragtAm: null });
  window.__entwurf = false; window.__api = [];
  api = async (a, p) => { __api.push({ a, p: JSON.parse(JSON.stringify(p || {})) });
    if (a === "protokoll_laden") return pr(__entwurf);
    if (a === "aufgabe_stand_melden" || a === "aufgabe_stand_spaeter") return { ok: true };
    if (a === "aufgaben_nachfragen") return { ok: true, an: 1 };
    if (a === "protokolle_liste") return { protokolle: [], aufgaben: [], treffenOhneProtokoll: [], darfOrganisieren: true };
    return {}; };
  neuLaden = async () => {}; // kein Neuladen gegen den (nachgebildeten) Server
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  for (const b of document.querySelectorAll("body > *")) if (/Welche Stimme soll dir/.test(b.textContent || "") && b.id !== "app") b.remove();
  for (const b of document.querySelectorAll(".blatt[data-dyn], .dlg")) b.remove();
  if (typeof aktuelleAnsicht !== "undefined") try { zeige("start"); } catch {}
});
// 1) Startmeldung über den Weg nach dem Start (init → aufgabenDran)
await seite.evaluate(() => {
  for (const b of document.querySelectorAll(".blatt[data-dyn], .dlg")) b.remove();
  astNachInit({ aufgabenDran: [
    { id: "A1", text: "Tablets usw. beschaffen", faellig: "2026-11-28", grund: "sitzung", aus: "2026-10-30", mit: ["Christina"], stand: "teilweise", stand_am: "2026-11-20T09:00:00Z", stand_text: "Ein Tablet ist da", stand_von: "Christina", sitzung: { titel: "Köcheclub-Sitzung", beginn: "2026-11-24T17:00:00Z" } },
    { id: "A2", text: "Weihnachtsfeier: Saal anfragen", faellig: null, grund: "sitzung", aus: "2026-10-30", mit: [], stand: "offen", stand_am: null, stand_text: null, stand_von: null }] });
  for (const b of document.querySelectorAll(".blatt[data-dyn]:not(#astBlatt), .dlg")) b.remove();
  astPruefen(0);
});
await seite.waitForTimeout(600); await weg();
const k = await seite.evaluate(() => [...document.querySelectorAll("#astBlatt .ast-k")].map((b) => b.textContent.trim()));
ok(k.join("|") === "✅ Ja, erledigt|🔶 Teilweise|❌ Noch nicht", "Startmeldung mit drei Knöpfen: " + k.join(" · "));
const kopf = await seite.evaluate(() => $("astBlatt").textContent.replace(/\s+/g, " "));
ok(/Wie steht's mit deiner Aufgabe\?/.test(kopf) && /Tablets usw\. beschaffen/.test(kopf) && /mit Christina/.test(kopf) && /aus dem Protokoll vom 30\.10\./.test(kopf) && /Aufgabe 1 von 2/.test(kopf), "Aufgabe mit Mitbeteiligter, Herkunft, Zähler");
ok(/Christina hat gemeldet: 🔶 teilweise – „Ein Tablet ist da“/.test(kopf), "Meldung der Mitbeteiligten sichtbar");
const gross = await seite.evaluate(() => { const r = document.querySelector("#astBlatt .ast-k").getBoundingClientRect(); return [Math.round(r.height), Math.round(r.width)]; });
ok(gross[0] >= 44 && gross[1] >= 250, "große Knöpfe: " + gross.join("×"));
let ue = await ueberlauf(); ok(ue.seite <= 390 && ue.blatt <= 0, "kein Überlauf bei 390 px: " + JSON.stringify(ue));
await bild("aufgaben-stand-1-start");
// 🔶 Teilweise ohne Text → wird trotzdem gemeldet (KC-CLUB-AUFGABE-BEMERKUNG-FREI: Text freiwillig)
await seite.click('#astBlatt .ast-k[data-s="teilweise"]'); await seite.waitForTimeout(200);
ok(/freiwillig/.test(await seite.evaluate(() => $("astTextLabel").textContent)), "Teilweise: Text ist als freiwillig beschriftet");
await bild("aufgaben-stand-2-teilweise");
await seite.click("#astLos"); await seite.waitForTimeout(500); await weg();
const m = await seite.evaluate(() => __api.find((x) => x.a === "aufgabe_stand_melden")?.p);
ok(m && m.id === "A1" && m.stand === "teilweise" && m.text === "", "Teilweise ohne Text ruft aufgabe_stand_melden: " + JSON.stringify(m));
// nächste Aufgabe: ❌ Noch nicht mit Zieldatum (Grund freiwillig)
const zweite = await seite.evaluate(() => $("astBlatt")?.textContent.replace(/\s+/g, " ") || "");
ok(/Aufgabe 2 von 2/.test(zweite) && /Saal anfragen/.test(zweite), "zweite Aufgabe folgt");
await seite.click('#astBlatt .ast-k[data-s="nicht"]'); await seite.waitForTimeout(200);
ok(await seite.evaluate(() => $("astZielFeld").style.display !== "none"), "Noch nicht: Zieldatum sichtbar");
ue = await ueberlauf(); ok(ue.seite <= 390 && ue.blatt <= 0, "kein Überlauf mit Eingabefeldern: " + JSON.stringify(ue));
await bild("aufgaben-stand-3-noch-nicht");
await seite.fill("#astZiel", "2026-12-15"); await seite.click("#astLos"); await seite.waitForTimeout(500); await weg();
const m2 = await seite.evaluate(() => __api.filter((x) => x.a === "aufgabe_stand_melden")[1]?.p);
ok(m2 && m2.id === "A2" && m2.stand === "nicht" && m2.ziel === "2026-12-15", "Noch nicht ohne Grund, mit Ziel: " + JSON.stringify(m2));
ok(await seite.evaluate(() => !$("astBlatt") && !__api.some((x) => x.a === "aufgabe_stand_spaeter")), "nach der letzten Meldung zu – kein „Später“");
// „Später“ / Schließen ohne Antwort
await seite.evaluate(() => { astNachInit({ aufgabenDran: [{ id: "A3", text: "Kasse prüfen", aus: "2026-10-02", mit: [] }] }); astPruefen(0); }); await seite.waitForTimeout(300);
await seite.click("#astSpaeter"); await seite.waitForTimeout(300);
const sp = await seite.evaluate(() => __api.find((x) => x.a === "aufgabe_stand_spaeter")?.p);
ok(sp && JSON.stringify(sp.ids) === '["A3"]' && !(await seite.$("#astBlatt")), "Später → aufgabe_stand_spaeter (24 Std. Ruhe)");
await seite.evaluate(() => { astNachInit({ aufgabenDran: [{ id: "A4", text: "Zelt prüfen", mit: [] }] }); astPruefen(0); }); await seite.waitForTimeout(300);
await seite.evaluate(() => fensterZu($("astBlatt"))); await seite.waitForTimeout(200);
ok(await seite.evaluate(() => __api.filter((x) => x.a === "aufgabe_stand_spaeter").length === 2), "Schließen ohne Antwort = Später");
// 2) Protokoll (veröffentlicht): Abschnitt, Abzeichen und „Stand melden“ an meiner Aufgabe, Druck und Text
await seite.evaluate(() => protokollOeffnen("PR1")); await seite.waitForTimeout(800); await weg();
const pv = await seite.evaluate(() => $("protokollInhalt").textContent.replace(/\s+/g, " "));
ok(/Stand der Aufgaben/.test(pv) && /✅ erledigt am 21\.11\. – Frank, Christina: Tablets beschaffen – „2 Tablets gekauft“ \(aus dem Protokoll vom 30\.10\.\)/.test(pv), "Protokoll-Ansicht: Abschnitt „Stand der Aufgaben“");
ok(/🔶 teilweise \(Stand 22\.11\.\) – Klaus: Glühwein bestellen/.test(pv) && /❔ keine Rückmeldung – Erika: Kasse prüfen/.test(pv) && !/Rückmeldungen:/.test(pv), "teilweise / keine Rückmeldung; ohne Übersicht (veröffentlicht)");
ok(/❌ noch nicht · 23\.11\. · Ziel 10\.12\./.test(pv) && /📝 Stand melden/.test(pv), "Abzeichen und „📝 Stand melden“ an meiner Aufgabe");
ue = await ueberlauf(); ok(ue.seite <= 390, "Protokoll: kein Überlauf: " + JSON.stringify(ue));
await bild("aufgaben-stand-4-protokoll", true);
const druck = await seite.evaluate(() => druckProtokoll().html.replace(/\s+/g, " "));
ok(/<h2>Stand der Aufgaben<\/h2>/.test(druck) && /Glühwein bestellen – „Angebot fehlt noch“/.test(druck), "Druck/PDF mit Abschnitt");
ok(await seite.evaluate(() => /Stand der Aufgaben:\n  ✅ erledigt am 21\.11\./.test(protokollText(PR.protokoll))), "Text (Archiv) mit Abschnitt");
await seite.evaluate(() => astEinzeln("A9")); await seite.waitForTimeout(300);
const einz = await seite.evaluate(() => $("astBlatt")?.textContent.replace(/\s+/g, " ") || "");
ok(/Grill reinigen/.test(einz) && /Zuletzt gemeldet: ❌ noch nicht – „Ersatzteil fehlt“/.test(einz) && !/von 2/.test(einz) && /Schließen/.test(einz), "„Stand melden“ öffnet das Fenster nur für diese Aufgabe");
await seite.evaluate(() => fensterZu($("astBlatt")));
ok(await seite.evaluate(() => __api.filter((x) => x.a === "aufgabe_stand_spaeter").length === 2), "freiwillig geöffnet und geschlossen: kein „Später“");
// 3) Entwurf für wer schreibt: Rückmeldungen 2 von 3 + 🔔 Nachfragen
await seite.evaluate(() => { __entwurf = true; protokollOeffnen("PR1"); }); await seite.waitForTimeout(800); await weg();
const ev = await seite.evaluate(() => $("protokollInhalt").textContent.replace(/\s+/g, " "));
ok(/Rückmeldungen: 2 von 3/.test(ev) && /Noch keine Rückmeldung: Erika/.test(ev) && /🔔 Nachfragen/.test(ev) && /laufend aktualisiert/.test(ev), "Entwurf: Übersicht mit Nachfragen");
await bild("aufgaben-stand-5-entwurf", true);
await seite.evaluate(() => [...document.querySelectorAll("#protokollInhalt button")].find((b) => /Nachfragen/.test(b.textContent)).click()); await seite.waitForTimeout(400);
await seite.evaluate(() => [...document.querySelectorAll(".dlg button, .blatt button")].find((b) => /🔔 Nachfragen/.test(b.textContent) && !b.closest("#protokollInhalt"))?.click()); await seite.waitForTimeout(600);
const nfr = await seite.evaluate(() => __api.find((x) => x.a === "aufgaben_nachfragen")?.p);
ok(nfr && nfr.id === "PR1", "Nachfragen ruft aufgaben_nachfragen");
ok(!fehler.length, "keine Seitenfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
