// 2.555.0 KC-CLUB-ABSTIMMUNG-PAKET: Browser-Test des echten app.js (Chromium über playwright-core) – Abstimmung mit Überschrift, Bereichen und
// mehreren Fragen: anlegen (was geht an den Server), eine Kachel in der Liste, Fenster mit allen Fragen nach Bereichen, abstimmen, beenden.
// Start: PW_CORE=… PW_CHROME=… node tools/abstimmung-paket/ap-browser.mjs  (Bilder: AP_BILD=<Ordner>)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8799);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const seite = await browser.newPage({ viewport: { width: 400, height: 820 } }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route(/supabase\.co/, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"error":"test"}' }));
await seite.goto("http://localhost:8799/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exit(1); } console.log("ok:", t); };
const bild = async (n) => { if (process.env.AP_BILD) await seite.screenshot({ path: path.join(process.env.AP_BILD, n + ".png"), fullPage: false }); };
await seite.evaluate(() => {
  ICH = { ...(ICH || {}), person_id: "P1", name: "Hansi Test", admin: true, vorstand: true }; MITGLIEDER = []; MG_GRUPPEN = [];
  const pk = (nr, abschnitt, titel, optionen, extra = {}) => ({ id: "F" + nr, art: "abstimmung", titel, beschreibung: null, optionen, geheim: false, anlagen: [], status: "offen", frist: null,
    erstellt_am: "2026-10-21T08:00:00Z", von: { person_id: "P1", name: "Hansi Test" }, treffen: null, abgestimmt: false, meine: null, stimmen: 0, berechtigt: 12,
    ergebnis: optionen.map((o) => ({ option: o, anzahl: 0, namen: [] })), ziel: null, fuerMich: true, darfAbschliessen: true, darfZurueckziehen: true, darfBearbeiten: true, darfLoeschen: true,
    paket: { id: "PK1", titel: "Technik, Bilderrechner, Abrechnung", beschreibung: "Bitte bis zur nächsten Sitzung abstimmen.", abschnitt, nr }, ...extra });
  window.__liste = [
    pk(3, "Abrechnung", "Sollen Barcode-Erfassung und die passenden Metallschilder (siehe Muster) eingesetzt werden?", ["Ja", "Nein", "Enthaltung"]),
    pk(2, "Abrechnung", "Sollen Kommen und Gehen per QR-Code erfasst werden?", ["Ja, mit Clubausweis", "Ja, mit QR-Code in der Club-App", "Nein", "Enthaltung"]),
    pk(1, "Technik", "Soll der Stand bzw. sollen die Geräte vernetzt werden?", ["Ja", "Nein", "Enthaltung"]),
    pk(0, "Technik", "Tablets und Halterungen jetzt beschaffen oder dieses Jahr mit Leihgeräten arbeiten?", ["Jetzt beschaffen (wie beschlossen)", "Dieses Jahr Leihgeräte", "Enthaltung"]),
    { ...pk(9, null, "Grillfest im Mai?", ["Ja", "Nein"]), id: "E1", paket: null },
  ];
  window.__api = []; api = async (a, p) => { __api.push([a, p]);
    if (a === "vorschlaege_liste") return { vorschlaege: __liste, treffen: [], spenden: { empfaenger: [], betraege: [50], max: 100 } };
    if (a === "vorschlag_stimme") { const v = __liste.find((x) => x.id === p.id); v.meine = p.wahl; v.abgestimmt = true; v.stimmen = 1; v.ergebnis = v.optionen.map((o) => ({ option: o, anzahl: o === p.wahl ? 1 : 0, namen: o === p.wahl ? ["Hansi Test"] : [] })); return { ok: true }; }
    if (a === "vorschlag_status") { __liste.filter((x) => x.paket?.id === "PK1").forEach((x) => (x.status = "abgeschlossen")); return { ok: true }; }
    if (a === "abstimmungspaket_speichern") return { ok: true, versand: { gesendet: 11 } };
    return {}; };
  frage = async () => true; neuLaden = () => {}; window.__melde = []; const m0 = melde; melde = (t, f) => { __melde.push(t); return m0(t, f); };
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
});
const r = await seite.evaluate(async () => {
  const warte = (t) => new Promise((x) => setTimeout(x, t)), e = {};
  zeige("vorschlaege"); await warte(500);
  const kacheln = [...document.querySelectorAll("#vorschlagListe .mini-kachel")];
  e.kacheln = kacheln.map((k) => k.textContent.replace(/\s+/g, " ").trim());
  e.eineKachel = kacheln.filter((k) => /Technik, Bilderrechner, Abrechnung/.test(k.textContent)).length === 1 && kacheln.some((k) => /4 Fragen/.test(k.textContent));
  e.einzelnDa = kacheln.some((k) => /Grillfest/.test(k.textContent));
  kacheln.find((k) => /Technik, Bilderrechner/.test(k.textContent)).click(); await warte(200);
  const f = $("vorschlagInfo"); e.fenster = !!f && f.dataset.paket === "PK1";
  e.bereiche = [...f.querySelectorAll(".pk-bereich")].map((h) => h.textContent.trim());
  e.fragen = [...f.querySelectorAll(".pk-frage-titel")].map((h) => h.textContent.trim().slice(0, 30));
  e.stand0 = /0 von 4/.test(f.textContent);
  [...f.querySelectorAll(".pk-frage")][1].querySelector(".wahl button").click(); await warte(400);
  const f2 = $("vorschlagInfo"); e.nachStimme = f2?.dataset.paket === "PK1" && /1 von 4/.test(f2.textContent) && !!f2.querySelector(".wahl button.an");
  e.stimmeAn = __api.find((x) => x[0] === "vorschlag_stimme")?.[1];
  e.kachelNoch = /noch 3 offen/.test($("vorschlagListe").textContent);
  return e;
});
console.log(JSON.stringify(r, null, 1));
await bild("2-fenster");
ok(r.eineKachel && r.einzelnDa, "Liste: eine Kachel für die Abstimmung mit 4 Fragen, einzelne Abstimmung wie bisher");
ok(r.fenster && r.bereiche.join("|") === "📂 Technik|📂 Abrechnung" && r.fragen.length === 4 && /^Tablets/.test(r.fragen[0]), "Fenster: Fragen nach Bereichen, in der eingegebenen Reihenfolge");
ok(r.stand0 && r.nachStimme && r.stimmeAn?.id === "F1" && r.kachelNoch, "abstimmen je Frage, Fenster bleibt offen, Stand „1 von 4“, Kachel „noch 3 offen“");
// beenden
const b = await seite.evaluate(async () => { const warte = (t) => new Promise((x) => setTimeout(x, t));
  [...$("vorschlagInfo").querySelectorAll("button")].find((x) => /Abstimmung beenden/.test(x.textContent)).click(); await warte(400);
  const st = __api.find((x) => x[0] === "vorschlag_status")?.[1]; return { st, erledigt: /Erledigt[\s\S]*Technik, Bilderrechner/.test($("vorschlagListe").textContent) }; });
ok(b.st?.paket === true && b.st?.status === "abgeschlossen" && b.erledigt, "🏁 beendet alle Fragen auf einmal (paket: true) → unter Erledigt");
// anlegen
await seite.evaluate(() => { $("vorschlagInfo")?.remove(); vorschlagForm("abstimmung"); });
const n = await seite.evaluate(async () => { const warte = (t) => new Promise((x) => setTimeout(x, t)), e = {};
  e.wahl = !!$("vfPaketWahl"); $("vfTitel").value = "Technik, Bilderrechner, Abrechnung";
  [...$("vfPaketWahl").querySelectorAll("button")][1].click(); await warte(100);
  e.titelBleibt = $("vfTitel").value === "Technik, Bilderrechner, Abrechnung" && /Überschrift/.test($("vfTitel").closest("label").textContent);
  const setz = (sel, w) => { const x = document.querySelector(sel); x.value = w; x.dispatchEvent(new Event("input")); };
  setz("#vfPaket .sp-projekt input", "Technik");
  setz("#vfPaket .pk-frage input", "Tablets und Halterungen jetzt beschaffen oder Leihgeräte?");
  setz("#vfPaket .pk-frage textarea", "Jetzt beschaffen\nLeihgeräte\nEnthaltung");
  [...document.querySelectorAll("#vfPaket button")].find((x) => /Frage in diesem Bereich/.test(x.textContent)).click(); await warte(50);
  const f2 = document.querySelectorAll("#vfPaket .pk-frage")[1].querySelector("input"); f2.value = "Soll der Stand vernetzt werden?"; f2.dispatchEvent(new Event("input"));
  [...document.querySelectorAll("#vfPaket button")].find((x) => /weiterer Bereich/.test(x.textContent)).click(); await warte(50);
  const b2 = document.querySelectorAll("#vfPaket .sp-projekt")[1]; b2.querySelector("input").value = "Abrechnung"; b2.querySelector("input").dispatchEvent(new Event("input"));
  b2.querySelector(".pk-frage input").value = "Kommen und Gehen per QR-Code erfassen?"; b2.querySelector(".pk-frage input").dispatchEvent(new Event("input"));
  e.formular = document.querySelectorAll("#vfPaket .pk-frage").length === 3;
  await vorschlagSpeichern(document.querySelector("#vorschlagForm .knopf.haupt")); await warte(200);
  e.an = __api.filter((x) => x[0] === "abstimmungspaket_speichern").pop()?.[1];
  e.zu = $("vorschlagForm").classList.contains("versteckt"); e.melde = __melde.slice(-3);
  return e; });
await bild("1-formular");
console.log(JSON.stringify({ an: n.an, melde: n.melde }, null, 1));
ok(n.wahl && n.titelBleibt && n.formular, "Formular: „📋 Mehrere Fragen mit Überschrift“, Überschrift bleibt beim Umschalten, Bereiche + Fragen");
ok(n.an?.titel === "Technik, Bilderrechner, Abrechnung" && n.an.fragen.length === 3 && n.an.fragen[0].abschnitt === "Technik" && n.an.fragen[2].abschnitt === "Abrechnung"
  && n.an.fragen[0].optionen.join("/") === "Jetzt beschaffen/Leihgeräte/Enthaltung" && n.an.fragen[1].optionen.join("/") === "Ja/Nein/Enthaltung" && !("optionen" in n.an) && n.zu, "an den Server: Überschrift, Fragen mit Bereich und Antworten");
// einzelne Frage unverändert
const e1 = await seite.evaluate(async () => { vorschlagForm("abstimmung", false); $("vfTitel").value = "Grillfest?"; await vorschlagSpeichern(document.querySelector("#vorschlagForm .knopf.haupt")); await new Promise((x) => setTimeout(x, 100));
  return __api.filter((x) => x[0] === "vorschlag_speichern").pop()?.[1]; });
ok(e1?.titel === "Grillfest?" && e1.optionen.join("/") === "Ja/Nein/Enthaltung" && !e1.fragen, "❓ Eine Frage wie bisher (vorschlag_speichern)");
// Vorlage „Technik, Bilderrechner, Abrechnung“ übernehmen und starten
const vo = await seite.evaluate(async () => { const warte = (t) => new Promise((x) => setTimeout(x, t)), e = {};
  vorschlagForm("abstimmung", false); await vfVorlagen(); await warte(300);
  e.liste = !!$("vfVorlageBlatt"); $("vfVorlageBlatt").querySelector("[data-i='0']").click(); await warte(200);
  e.titel = $("vfTitel").value; e.bereiche = [...document.querySelectorAll("#vfPaket .sp-projekt input[placeholder='z. B. Technik']")].map((x) => x.value);
  e.wennGewaehlt = [...document.querySelectorAll("#vfPaket select")].map((s) => s.selectedOptions[0]?.textContent).filter((t) => !/immer/.test(t));
  await vorschlagSpeichern(document.querySelector("#vorschlagForm .knopf.haupt")); await warte(200);
  e.an = __api.filter((x) => x[0] === "abstimmungspaket_speichern").pop()?.[1]; return e; });
await bild("3-vorlage");
const f5 = vo.an?.fragen?.[5];
ok(vo.liste && vo.titel === "Technik, Bilderrechner, Abrechnung" && vo.bereiche.join("|") === "Technik|Bilderrechner|Abrechnung" && vo.an?.fragen.length === 12, "📄 Vorlage: Überschrift, 3 Bereiche, 12 Fragen");
ok(f5?.mehrfach === true && f5.wenn?.nr === 4 && f5.wenn.antwort === "Ja" && f5.optionen.length === 11 && /Frage 5 .*= Ja/.test(vo.wennGewaehlt[0] || ""), "„Wer zählt zu den Helfern?“: mehrere ankreuzen, nur bei Frage 5 = Ja");
// Anzeige: Folgefrage erst nach „Ja“, ankreuzen schickt die Liste
const an = await seite.evaluate(async () => { const warte = (t) => new Promise((x) => setTimeout(x, t)), e = {};
  const fr = __api.filter((x) => x[0] === "abstimmungspaket_speichern").pop()[1].fragen;
  __liste = fr.map((f, nr) => ({ id: "V" + nr, art: "abstimmung", titel: f.frage, beschreibung: f.beschreibung || null, optionen: f.optionen, geheim: false, anlagen: [], status: "offen", frist: null, erstellt_am: "2026-10-21T08:00:00Z",
    von: { person_id: "P1", name: "Hansi Test" }, treffen: null, abgestimmt: false, meine: f.mehrfach ? [] : null, stimmen: 0, berechtigt: 12, ergebnis: f.optionen.map((o) => ({ option: o, anzahl: 0, namen: [] })), ziel: null, fuerMich: true,
    darfAbschliessen: true, darfBearbeiten: true, paket: { id: "PK2", titel: "Technik, Bilderrechner, Abrechnung", abschnitt: f.abschnitt, nr, ...(f.mehrfach ? { mehrfach: true } : {}), ...(f.wenn ? { wenn: f.wenn } : {}) } }));
  const alt = api; api = async (a, p) => { if (a === "vorschlag_stimme") { __api.push([a, p]); const v = __liste.find((x) => x.id === p.id); v.meine = p.wahl; v.abgestimmt = Array.isArray(p.wahl) ? p.wahl.length > 0 : true; return { ok: true }; } return alt(a, p); };
  await vorschlaegeLaden(); vorschlagPaketInfo("PK2"); await warte(100);
  const titel = () => [...$("vorschlagInfo").querySelectorAll(".pk-frage-titel")].map((x) => x.textContent);
  e.vorher = titel().length; e.helferVorher = titel().some((t) => /Helfern/.test(t)); e.stand = /0 von 11/.test($("vorschlagInfo").textContent);
  stimme("V4", "Ja"); await warte(300);
  e.helferNach = titel().some((t) => /Helfern/.test(t)); e.stand2 = /1 von 12/.test($("vorschlagInfo").textContent);
  pkKreuz("V5", "Feuerwehr"); await warte(300); pkKreuz("V5", "Bauhof"); await warte(300);
  e.gesendet = __api.filter((x) => x[0] === "vorschlag_stimme" && x[1].id === "V5").pop()?.[1].wahl;
  e.angekreuzt = [...$("vorschlagInfo").querySelectorAll(".wahl button.an")].map((b) => b.textContent.trim());
  return e; });
await bild("4-helfer");
console.log(JSON.stringify(an));
ok(an.vorher === 11 && !an.helferVorher && an.stand && an.helferNach && an.stand2, "Folgefrage „Wer zählt zu den Helfern?“ erscheint erst nach „Ja“ (11 → 12 Fragen)");
ok(an.gesendet?.join("/") === "Bauhof/Feuerwehr" && an.angekreuzt.some((t) => /Feuerwehr/.test(t)) && an.angekreuzt.some((t) => /Bauhof/.test(t)), "mehrere ankreuzen: Liste in Reihenfolge der Antworten");
// 2.557.0 KC-CLUB-ABSTIMMUNG-DRUCK: Ankreuzbogen und Ergebnis auf dem Kopfbogen
const dr = await seite.evaluate(async () => { const e = {};
  e.knoepfe = [...$("vorschlagInfo").querySelectorAll("button")].map((b) => b.textContent).filter((t) => /Ankreuzbogen|Ergebnis drucken/.test(t)).length;
  DRUCK = { art: "abstimmung", param: { pid: "PK2", art: "bogen" } }; await druckSeiteBauen(); const d = $("druck");
  e.kopf = !!d.querySelector(".cd-kopf") && /Köcheclub/.test(d.textContent); e.fragen = (d.innerHTML.match(/font-size:3\.9mm;font-weight:800/g) || []).length;
  e.bereiche = [...d.querySelectorAll("h2")].map((h) => h.textContent.trim()); e.folge = /nur ausfüllen, wenn bei Frage 5 „Ja“/.test(d.textContent); e.name = /Name:/.test(d.textContent) && /Unterschrift/.test(d.textContent);
  DRUCK = { art: "abstimmung", param: { pid: "PK2", art: "ergebnis" } }; await druckSeiteBauen();
  e.ergebnis = /Zwischenstand/.test($("druck").textContent) && /haben abgestimmt/.test($("druck").textContent) && /Bauhof/.test($("druck").textContent); return e; });
console.log(JSON.stringify(dr));
ok(dr.knoepfe === 2 && dr.kopf && dr.fragen === 12 && dr.bereiche.join("|") === "📂 Technik|📂 Bilderrechner|📂 Abrechnung" && dr.folge && dr.name, "🖨️ Ankreuzbogen: Kopfbogen, 12 Fragen nach Bereichen, Folgefrage-Hinweis, Name/Unterschrift");
ok(dr.ergebnis, "📊 Ergebnis drucken: Zwischenstand mit Stimmen je Frage");
ok(!fehler.length, "keine Skriptfehler" + (fehler.length ? ": " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
