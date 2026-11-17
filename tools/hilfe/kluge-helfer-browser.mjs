// KC-CLUB-KLUGE-HELFER (16.11.2026): Browser-Prüfung mit dem echten app.js und einem AUSGEDACHTEN Chat („Hans Test“ ↔ „Erika Beispiel“ + Gruppe „Grillfreunde“):
// „📌 Für dich“-Zeile + Blatt, Schnellantworten nur unter der neuesten Nachricht, ⏰ Erinnern und 📋 Aufgabe im Menü, Foto-Angebot, offene Frage (❓ in der Liste),
// „Noch nicht gelesen … 🔔“. Nur Testdaten – keine echte Nachricht, nichts an den Server (KC-CHATS-PRIVAT, KC-TESTS-OHNE-ECHTSERVER).
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/kluge-helfer-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8827);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.goto("http://localhost:8827/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
const bild = async (n, voll) => { if (process.env.BILDER) await seite.screenshot({ path: `${process.env.BILDER}/${n}.png`, fullPage: !!voll }); };
const weg = () => seite.evaluate(() => { for (const e of document.querySelectorAll(".meldung")) e.remove(); });
await seite.evaluate(() => {
  const h = (std) => new Date(Date.now() - std * 3600000).toISOString(), tag = (d) => new Date(Date.now() + d * 86400000).toISOString();
  ICH = { ...(ICH || {}), person_id: "P1", name: "Hans Test", vorname: "Hans", admin: false, vorstand: false, buero: false }; MITGLIEDER = MITGLIEDER || [];
  const tn = [["P1", "Hans Test"], ["P2", "Erika Beispiel"], ["P3", "Anne Muster"], ["P4", "Dieter Probe"]].map(([person_id, name]) => ({ person_id, name }));
  const foto = (i) => ({ id: "F" + i, name: `Grill-${i}.jpg`, mime: "image/jpeg", groesse: 1000 });
  const n = (id, std, x) => ({ id, zeit: h(std), von: "Erika Beispiel", vonId: "P2", text: "", anlagen: [], reaktionen: [], eigen: false, ...x });
  window.__chats = {
    "T-GRUPPE": { id: "T-GRUPPE", betreff: "", gruppe: { name: "Grillfreunde", symbol: "🔥", admins: [] }, teilnehmer: tn, gelesenBis: h(0.5), tippt: [], entwurf: [], spricht: [], diktiert: [], angeheftet: [], geplant: [], nachrichten: [
      n("g1", 26, { text: "Fotos vom Grillabend gestern 📸", anlagen: [foto(1), foto(2), foto(3), foto(4)] }),
      n("g2", 5, { eigen: true, von: "Du", vonId: "P1", wichtig: true, text: "Bitte bis Mittwoch kurz Bescheid geben, wer beim Aufbau hilft.", gelesenVon: ["Erika"], haken: "angekommen", nichtGelesen: [{ id: "P3", name: "Anne" }, { id: "P4", name: "Dieter" }] }),
      n("g3", 3, { von: "Anne Muster", vonId: "P3", text: "Hans, kannst du bitte bis Freitag die Grillkohle besorgen?" }),
      n("g4", 2, { von: "Dieter Probe", vonId: "P4", text: "📊", umfrage: { frage: "Was grillen wir am Samstag?", mehrfach: false, gesamt: 1, optionen: [{ text: "Würstchen", stimmen: 1, meine: false, namen: ["Dieter"] }, { text: "Gemüse", stimmen: 0, meine: false, namen: [] }] } }),
      n("g5", 1, { text: "@Hans kommst du am Samstag um 18 Uhr zum Aufbau?", erwaehntMich: true, erwaehnt: ["dich"] })] },
    "T-ZWEIER": { id: "T-ZWEIER", betreff: "", gruppe: null, teilnehmer: tn.slice(0, 2), gelesenBis: h(1), tippt: [], entwurf: [], spricht: [], diktiert: [], angeheftet: [], geplant: [], nachrichten: [
      n("z1", 20, { text: "Hallo Hans, schöne Woche dir!" }),
      n("z2", 13, { eigen: true, von: "Du", vonId: "P1", text: "Danke! Hast du am Samstag Zeit für den Einkauf?", gelesenVon: ["Erika"], haken: "gelesen", gelesenAlle: true })] },
  };
  const bildUrl = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="240" height="160" fill="#e9a23b"/><text x="120" y="100" font-size="60" text-anchor="middle">🔥</text></svg>');
  window.__api = [];
  api = async (a, p) => { __api.push({ a, p });
    if (a === "unterhaltung") return JSON.parse(JSON.stringify(__chats[p.id]));
    if (a === "unterhaltung_stand") return { stand: null };
    if (a === "unterhaltungen") return { unterhaltungen: [
      { id: "T-GRUPPE", gruppe: { name: "Grillfreunde", symbol: "🔥" }, teilnehmer: ["Erika Beispiel", "Anne Muster", "Dieter Probe"], anzahl: 4, ungelesen: 0, letzte: { von: "Erika", text: "@Hans kommst du am Samstag um 18 Uhr zum Aufbau?", zeit: h(1) }, nachrichten: 5 },
      { id: "T-ZWEIER", gruppe: null, teilnehmer: ["Erika Beispiel"], anzahl: 2, ungelesen: 0, letzte: { von: "Du", text: "Danke! Hast du am Samstag Zeit für den Einkauf?", zeit: h(13) }, nachrichten: 2 }] };
    if (a === "treffen_liste") return { treffen: [{ id: "TR1", titel: "Grillabend", beginn: tag(-1), ende: tag(-1) }], geburtstage: [] };
    if (a === "anlage_url") return { url: bildUrl };
    if (a === "nachricht_erinnerung_liste") return { liste: [] };
    if (a === "nachricht_erinnerung_setzen") return { ok: true, id: "00000000-0000-0000-0000-000000000001", um: p.um };
    return {}; };
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  for (const k of ["kh_zu", "kh_weg", "kh_offen"]) try { localStorage.removeItem("kc_club_" + k); } catch {}
  for (const b of document.querySelectorAll("body > *")) if (/Welche Stimme soll dir/.test(b.textContent || "") && b.id !== "app") b.remove();
});
// 1) Gruppe: Zeile, Schnellantworten, „Noch nicht gelesen“
await seite.evaluate(() => chatOeffnen("T-GRUPPE")); await seite.waitForTimeout(1500); await weg();
const zeile = await seite.evaluate(() => $("khFuerDich").textContent.replace(/\s+/g, " ").trim());
ok(/Für dich: 1 Frage · 1 Umfrage · 1 Aufgabe · 📸 4 Fotos/.test(zeile), "„Für dich“: " + zeile);
ok(await seite.evaluate(() => document.querySelectorAll("#khFuerDich .kh-zeile").length === 1), "genau eine Zeile");
const chips = await seite.evaluate(() => [...document.querySelectorAll("#chat .kh-chips")].map((c) => ({ nach: c.previousElementSibling?.dataset.id, t: [...c.querySelectorAll("button")].map((b) => b.textContent) })));
ok(chips.length === 1 && chips[0].nach === "g5" && chips[0].t.join("|") === "✅ Bin dabei|❌ Kann nicht|🤔 Vielleicht", "Schnellantworten nur unter der neuesten: " + JSON.stringify(chips));
// früh morgens liegen „vor 5 Std.“-Nachrichten am Vortag – der Chat klappt ältere Tage zusammen: erst aufklappen (Prüfung unabhängig von der Uhrzeit)
await seite.evaluate(() => [...document.querySelectorAll("#chat button, #chat a")].find((b) => /aufklappen/i.test(b.textContent || ""))?.click()); await seite.waitForTimeout(500);
const ung = await seite.evaluate(() => document.querySelector("#msg-g2 .kh-ungelesen")?.textContent.trim() || "");
ok(/Noch nicht gelesen: Anne, Dieter/.test(ung) && /🔔 Kurz erinnern/.test(ung), "eigene wichtige Nachricht: " + ung);
await seite.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await seite.waitForTimeout(500);
await bild("kluge-helfer-1-chat");
await seite.evaluate(() => { window.scrollTo(0, 0); document.querySelector("#msg-g2").scrollIntoView({ block: "center" }); }); await seite.waitForTimeout(300);
await bild("kluge-helfer-1b-ungelesen");
// 🔔 Kurz erinnern → nur Schreibfeld (nichts gesendet)
await seite.evaluate(() => khKurzErinnern("g2")); await weg();
const [txt, gesendet0] = await seite.evaluate(() => [$("text").value, __api.some((x) => x.a === "nachricht_senden")]);
ok(/^@Anne @Dieter kurze Erinnerung/.test(txt) && !gesendet0, "Kurz erinnern: nur vorgeschrieben – " + txt);
await seite.evaluate(() => { $("text").value = ""; naAntwortWeg(); NA.erw.clear(); });
// 2) Blatt „Für dich“
await seite.click("#khFuerDich .kh-zeile-text"); await seite.waitForTimeout(400); await weg();
const blatt = await seite.evaluate(() => $("khBlatt")?.textContent.replace(/\s+/g, " ") || "");
ok(/Frage an dich/.test(blatt) && /Aufgabe für dich/.test(blatt) && /Umfrage/.test(blatt) && /4 Fotos vom Grillabend/.test(blatt) && /Als Aufgabe übernehmen \(bis Fr, \d\d\.\d\d\.\)|Als Aufgabe übernehmen \(bis \w\w, /.test(blatt), "Blatt mit allen Einträgen");
await bild("kluge-helfer-2-fuer-dich");
await seite.evaluate(() => khSprung("g3")); await seite.waitForTimeout(500);
ok(await seite.evaluate(() => !$("khBlatt") && document.querySelector("#msg-g3").classList.contains("aufblitzen")), "Antippen springt zur Nachricht und lässt sie aufblitzen");
// 3) Menü: ⏰ Erinnern und 📋 Aufgabe
await seite.evaluate(() => nachrichtMenue("g3")); await seite.waitForTimeout(300);
const menue = await seite.evaluate(() => $("naMenue").textContent);
ok(/⏰ Erinnern …/.test(menue) && /📋 Als Aufgabe übernehmen \(bis /.test(menue), "Menü: ⏰ Erinnern und 📋 Aufgabe");
await bild("kluge-helfer-3-menue");
await seite.evaluate(() => { $("naMenue").remove(); khErinnern("g3"); }); await seite.waitForTimeout(400);
const erin = await seite.evaluate(() => [...document.querySelectorAll("#khErinBlatt [data-um]")].map((b) => b.textContent.trim()));
ok(erin.length === 2 && /Morgen früh, 9 Uhr/.test(erin[1]) && !!(await seite.$("#khErinWunsch")), "Erinnern: " + erin.join(" · ") + " · Wunschzeit");
await bild("kluge-helfer-4-erinnern");
await seite.click("#khErinBlatt [data-um]"); await seite.waitForTimeout(300);
const gesetzt = await seite.evaluate(() => __api.find((x) => x.a === "nachricht_erinnerung_setzen")?.p);
ok(gesetzt && gesetzt.id === "g3" && Object.keys(gesetzt).sort().join() === "id,um", "Server bekommt nur Kennung und Zeit");
// 📋 Aufgabe-Blatt vorausgefüllt
await seite.evaluate(() => khAufgabeStart("g3")); await seite.waitForTimeout(300);
const auf = await seite.evaluate(() => [$("khAufText").value, $("khAufBis").value]);
ok(auf[0] === "Die Grillkohle besorgen" && /^\d{4}-\d\d-\d\d$/.test(auf[1]), "Aufgabe vorausgefüllt: " + auf.join(" · "));
await seite.evaluate(() => $("khAufgabeBlatt").remove());
// ✕ blendet aus, bis etwas Neues kommt
await seite.evaluate(() => khZeileZu()); await weg();
ok(await seite.evaluate(() => !$("khFuerDich").textContent.trim()), "✕: Zeile weg");
// Schnellantwort: Rückgängig → nichts gesendet
await seite.evaluate(() => { khChipSenden("g5", 0); }); await seite.waitForTimeout(300);
await seite.evaluate(() => [...document.querySelectorAll(".meldung")].pop()?.click()); await seite.waitForTimeout(5600);
ok(await seite.evaluate(() => !__api.some((x) => x.a === "nachricht_senden")), "Schnellantwort rückgängig: nichts gesendet");
await seite.evaluate(() => { khChipSenden("g5", 0); }); await seite.waitForTimeout(5600);
const ges = await seite.evaluate(() => __api.find((x) => x.a === "nachricht_senden")?.p);
ok(ges && ges.text === "✅ Bin dabei" && ges.antwort_auf === "g5", "Schnellantwort nach 5 s gesendet (Gruppe: als Antwort)");
// 4) Zweier-Chat: eigene offene Frage nach 13 Std. → Zeile und ❓ in der Liste
await seite.evaluate(() => chatOeffnen("T-ZWEIER")); await seite.waitForTimeout(1200); await weg();
const z2 = await seite.evaluate(() => $("khFuerDich").textContent.replace(/\s+/g, " ").trim());
ok(/❓ deine Frage offen/.test(z2), "offene Frage: " + z2);
ok(await seite.evaluate(() => !document.querySelector("#chat .kh-chips")), "Zweier-Chat: keine Schnellantworten (letzte Nachricht ist meine)");
await seite.evaluate(() => { khBlatt(); }); await seite.waitForTimeout(300);
ok(await seite.evaluate(() => /Freundlich nachfragen/.test($("khBlatt").textContent)), "Blatt: 🔔 Freundlich nachfragen");
await seite.evaluate(() => khNachfragen("z2")); await weg();
ok(await seite.evaluate(() => /^Kurze Nachfrage zu meiner Frage/.test($("text").value)), "Nachfragen: nur vorgeschrieben");
await seite.evaluate(() => { $("text").value = ""; naAntwortWeg(); zeige("nachrichten"); }); await seite.waitForTimeout(1200); await weg();
ok(await seite.evaluate(() => !!document.querySelector('#unterhListe .unterh[data-id="T-ZWEIER"] .kh-offen-marke') && !document.querySelector('#unterhListe .unterh[data-id="T-GRUPPE"] .kh-offen-marke')), "Chat-Liste: ❓ nur am Chat mit offener Frage");
await bild("kluge-helfer-5-liste");
// Schalter aus → nichts mehr
await seite.evaluate(() => { einstellung("khFuerDich", false); einstellung("khChips", false); chatStand = ""; chatOeffnen("T-GRUPPE"); }); await seite.waitForTimeout(1200);
ok(await seite.evaluate(() => !$("khFuerDich").textContent.trim() && !document.querySelector("#chat .kh-chips")), "Schalter aus: keine Zeile, keine Knöpfe");
await seite.evaluate(() => { einstellung("khFuerDich", true); einstellung("khChips", true); });
ok(!(await seite.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), "kein Überlauf bei 390 px");
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? " – " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log(process.exitCode ? "kluge-helfer-browser: ROT" : "kluge-helfer-browser: alle Prüfungen bestanden");
