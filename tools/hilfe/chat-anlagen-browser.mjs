// KC-CLUB-CHAT-ANLAGEN-SICHTBAR (19.11.2026): Browser-Prüfung mit dem echten app.js und einem AUSGEDACHTEN Chat („Hans Test“ ↔ „Erika Beispiel“, „Anne Muster“):
// Anlage-Leiste in der Nachricht, „📎2“ in der Chat-Liste, Aufleuchten bei neuer Nachricht, Fenster „📎 Alle Anlagen“ mit Sprung zur Nachricht, 390 px ohne Überlauf.
// Nur Testdaten – keine echte Nachricht, nichts an den Server (KC-CHATS-PRIVAT, KC-TESTS-OHNE-ECHTSERVER).
// Start: PW_CORE=playwright PW_CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome node tools/hilfe/chat-anlagen-browser.mjs   (BILDER=<Ordner> für Bildschirmfotos)
import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const OHNE_ECHTSERVER = "--host-resolver-rules=MAP *.supabase.co 0.0.0.0, MAP *.supabase.com 0.0.0.0, MAP *.workers.dev 0.0.0.0, MAP speed.cloudflare.com 0.0.0.0, MAP api.github.com 0.0.0.0"; // KC-TESTS-OHNE-ECHTSERVER: Netzsperre (dazu --no-proxy-server)
const { chromium } = require(process.env.PW_CORE || "playwright-core");
const wurzel = path.resolve(new URL("../..", import.meta.url).pathname);
const typ = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/json", ".mp3": "audio/mpeg" };
const srv = http.createServer((q, a) => { const f = path.join(wurzel, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+/, "") || "index.html"); fs.readFile(fs.existsSync(f) && fs.statSync(f).isFile() ? f : path.join(wurzel, "index.html"), (e, d) => { a.writeHead(e ? 404 : 200, { "content-type": typ[path.extname(f)] || "application/octet-stream" }); a.end(d); }); }).listen(8833);
const browser = await chromium.launch({ executablePath: process.env.PW_CHROME || "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: [OHNE_ECHTSERVER, "--no-proxy-server"] /* KC-TESTS-OHNE-ECHTSERVER: Netzsperre */ });
const seite = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const fehler = []; seite.on("pageerror", (e) => fehler.push(String(e)));
await seite.route("**/*", (r) => (/^(http:\/\/localhost:\d+\/|data:|blob:)/.test(r.request().url()) ? r.continue() : r.abort())); // KC-TESTS-OHNE-ECHTSERVER: alles Fremde abbrechen
await seite.goto("http://localhost:8833/index.html"); await seite.waitForTimeout(2500);
const ok = (b, t) => { if (!b) { console.error("FEHLER:", t); process.exitCode = 1; } else console.log("ok:", t); };
const bild = async (n, voll) => { if (process.env.BILDER) await seite.screenshot({ path: `${process.env.BILDER}/${n}.png`, fullPage: !!voll }); };
const weg = () => seite.evaluate(() => { for (const e of document.querySelectorAll(".meldung")) e.remove(); });
const ueberlauf = () => seite.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
await seite.evaluate(() => {
  const h = (std) => new Date(Date.now() - std * 3600000).toISOString();
  ICH = { ...(ICH || {}), person_id: "P1", name: "Hans Test", vorname: "Hans", admin: false, vorstand: false, buero: false }; MITGLIEDER = MITGLIEDER || [];
  const tn = [["P1", "Hans Test"], ["P2", "Erika Beispiel"], ["P3", "Anne Muster"]].map(([person_id, name]) => ({ person_id, name }));
  const n = (id, std, x) => ({ id, zeit: h(std), von: "Erika Beispiel", vonId: "P2", text: "", anlagen: [], reaktionen: [], eigen: false, ...x });
  window.__neu = n("m4", 0.2, { von: "Anne Muster", vonId: "P3", text: "📎", anlagen: [{ id: "A9", name: "Nachtrag.pdf", mime: "application/pdf" }] });
  window.__chat = { id: "T-ANL", betreff: "", gruppe: { name: "Vorstand Test", symbol: "🧑‍🍳", admins: [] }, teilnehmer: tn, gelesenBis: h(1.5), tippt: [], entwurf: [], spricht: [], diktiert: [], angeheftet: [], geplant: [], nachrichten: [
    n("m1", 0.9 * 24, { text: "Hier die Preisliste und ein Foto vom Stand", anlagen: [{ id: "A1", name: "Preisliste-Weihnachtsmarkt-2026-mit-sehr-langem-Dateinamen.pdf", mime: "application/pdf" }, { id: "A2", name: "Stand.jpg", mime: "image/jpeg" }] }),
    n("m2", 3, { eigen: true, von: "Du", vonId: "P1", text: "Danke!", anlagen: [], haken: "gelesen" }),
    n("m3", 1, { von: "Anne Muster", vonId: "P3", text: "Plan und Fotos für Samstag", anlagen: [{ id: "A7", name: "Plan.docx", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }, { id: "A3", name: "Foto1.jpg", mime: "image/jpeg" }, { id: "A4", name: "Foto2.jpg", mime: "image/jpeg" }] })] };
  window.__liste = () => ({ unterhaltungen: [{ id: "T-ANL", gruppe: { name: "Vorstand Test", symbol: "🧑‍🍳" }, teilnehmer: ["Erika Beispiel", "Anne Muster"], anzahl: 3, ungelesen: __chat.nachrichten.at(-1).id === "m4" ? 1 : 1,
    letzte: { von: khVorname(__chat.nachrichten.at(-1).von), text: __chat.nachrichten.at(-1).text, zeit: __chat.nachrichten.at(-1).zeit }, nachrichten: __chat.nachrichten.length }] });
  const bildUrl = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160"><rect width="240" height="160" fill="#7aa6d8"/><text x="120" y="100" font-size="60" text-anchor="middle">🎄</text></svg>');
  window.__api = [];
  api = async (a, p) => { __api.push({ a, p });
    if (a === "unterhaltung") return JSON.parse(JSON.stringify(__chat));
    if (a === "unterhaltung_stand") return { stand: null };
    if (a === "unterhaltungen") { const r = __liste(); if (window.__nieGelesen) r.unterhaltungen[0].letzte = { von: "Anne", text: "📎", zeit: h(1) }; return r; }
    if (a === "anlage_url") return { url: bildUrl };
    if (a === "diagnose") return { ok: true };
    if (a === "nachricht_erinnerung_liste") return { liste: [] };
    if (a === "treffen_liste") return { treffen: [], geburtstage: [] };
    return {}; };
  window.open = () => null; anlageAlsDatei = async () => ({ blob: new Blob(["%PDF-1.4"], { type: "application/pdf" }), name: "Beispiel.pdf", mime: "application/pdf" });
  $("gesperrt").classList.add("versteckt"); $("app").classList.remove("versteckt");
  for (const k of ["anl_auf", "anl_chat", "kh_zu", "kh_weg", "kh_offen"]) try { localStorage.removeItem("kc_club_" + k); } catch {}
  for (const b of document.querySelectorAll("body > *")) if (/Welche Stimme soll dir/.test(b.textContent || "") && b.id !== "app") b.remove();
});
// 0) Chat nie geöffnet, letzte Nachricht eine reine Anlage von Anne → 📎1
await seite.evaluate(() => { window.__nieGelesen = true; zeige("nachrichten"); }); await seite.waitForTimeout(1200); await weg();
const m0 = await seite.evaluate(() => document.querySelector('#unterhListe .unterh[data-id="T-ANL"] .anl-marke')?.textContent || "");
ok(m0 === "📎1", "Liste vor dem ersten Öffnen: " + (m0 || "(keine Marke)"));
await seite.evaluate(() => { window.__nieGelesen = false; });
// 1) Chat öffnen: Leiste, Aufleuchten nur bei der ungelesenen Nachricht
await seite.evaluate(() => chatOeffnen("T-ANL")); await seite.waitForTimeout(300);
ok(await seite.evaluate(() => document.querySelector("#msg-m3 .anl-leiste")?.classList.contains("anl-puls") && !document.querySelector("#msg-m1 .anl-puls") && document.querySelectorAll("#chat .anl-puls").length === 1), "📎 leuchtet nur bei der ungelesenen Nachricht auf");
ok(await seite.evaluate(() => getComputedStyle(document.querySelector("#msg-m3 .anl-klammer")).animationName === "anlPuls"), "Animation läuft (anlPuls)");
await seite.waitForTimeout(1200); await weg();
await seite.evaluate(() => [...document.querySelectorAll("#chat button, #chat a")].find((b) => /aufklappen/i.test(b.textContent || ""))?.click()); await seite.waitForTimeout(500);
const l1 = await seite.evaluate(() => document.querySelector("#msg-m1 .anl-leiste")?.textContent.replace(/\s+/g, " ").trim() || "");
ok(/📎 2 Anlagen:/.test(l1) && /Preisliste-Weihnachtsmarkt/.test(l1) && /Foto/.test(l1), "Leiste in m1: " + l1);
ok(await seite.evaluate(() => !document.querySelector("#msg-m1 .anlage") && document.querySelectorAll("#msg-m1 img[data-anlage]").length === 1), "Datei nur in der Leiste, Foto weiter als Vorschaubild");
const l3 = await seite.evaluate(() => document.querySelector("#msg-m3 .anl-leiste")?.textContent.replace(/\s+/g, " ").trim() || "");
ok(/📎 3 Anlagen:/.test(l3) && /Plan\.docx/.test(l3) && /2 Fotos/.test(l3), "Leiste in m3: " + l3);
ok(await seite.evaluate(() => document.querySelectorAll(".anl-teil.ungeoeffnet").length === 2), "zwei Dateien noch nicht geöffnet (•)");
ok(!(await ueberlauf()), "Chat: kein Überlauf bei 390 px");
await seite.evaluate(() => document.querySelector("#msg-m1").scrollIntoView({ block: "center" })); await seite.waitForTimeout(300);
await bild("chat-anlagen-1-leiste");
// 2) Datei antippen → Öffnen-Fenster wie bisher, danach „geöffnet“
await seite.click('#msg-m1 .anl-teil[data-anl="A1"]'); await seite.waitForTimeout(300);
ok(await seite.evaluate(() => !!$("anlBlatt") && /Öffnen/.test($("anlBlatt").textContent)), "Antippen öffnet wie bisher (Öffnen / Teilen / Speichern)");
await seite.evaluate(() => $("anlBlatt")?.remove());
ok(await seite.evaluate(() => !document.querySelector('.anl-teil[data-anl="A1"]').classList.contains("ungeoeffnet") && JSON.parse(localStorage.getItem("kc_club_anl_auf")).includes("A1")), "danach als geöffnet gemerkt (nur Kennung)");
// 3) Neue Nachricht kommt an → nur sie leuchtet auf
await seite.evaluate(() => { __chat.nachrichten.push(__neu); chatStand = "x"; return chatLaden(false); }); await seite.waitForTimeout(600); await weg();
ok(await seite.evaluate(() => document.querySelector("#msg-m4 .anl-leiste")?.classList.contains("anl-puls") && !document.querySelector("#msg-m3 .anl-leiste").classList.contains("anl-puls")), "neue Nachricht mit Anlage leuchtet auf, die vorige nicht nochmal");
await seite.waitForTimeout(1700); await seite.evaluate(() => { chatStand = "y"; return chatLaden(false); }); await seite.waitForTimeout(300);
ok(await seite.evaluate(() => !document.querySelector("#chat .anl-puls")), "beim nächsten Neuzeichnen ruhig");
// 4) „📎 Alle Anlagen“ aus dem Menü
await seite.evaluate(() => chatMenue()); await seite.waitForTimeout(200);
const mk = await seite.evaluate(() => $("chatAnlKnopf").textContent);
ok(/📎 Alle Anlagen \(Fotos & Dateien\) · 6/.test(mk), "Menü: " + mk);
await seite.click("#chatAnlKnopf"); await seite.waitForTimeout(600);
const fen = await seite.evaluate(() => ({ t: $("anlAlleBlatt")?.textContent.replace(/\s+/g, " ") || "", z: document.querySelectorAll("#anlAlleBlatt .anl-zeile").length, k: document.querySelectorAll("#anlAlleBlatt .anl-kachel").length, u: document.querySelectorAll("#anlAlleBlatt .anl-zeile.ungeoeffnet").length, menue: !$("chatBlatt").classList.contains("versteckt") }));
ok(fen.z === 3 && fen.k === 3 && /3 Fotos · 3 Dateien/.test(fen.t) && /Nachtrag\.pdf/.test(fen.t) && /Anne/.test(fen.t), `Fenster: ${fen.z} Dateien, ${fen.k} Fotos`);
ok(fen.u === 2 && !fen.menue, "Fenster: 2 ungeöffnet markiert, Menü zu");
ok(!(await ueberlauf()) && await seite.evaluate(() => { const i = document.querySelector("#anlAlleBlatt .blatt-innen"); return i.scrollWidth <= i.clientWidth + 1; }), "Fenster: kein Überlauf bei 390 px");
await bild("chat-anlagen-2-alle");
await seite.evaluate(() => [...document.querySelectorAll("#anlAlleBlatt .anl-zeile")].find((z) => /Plan\.docx/.test(z.textContent)).querySelector(".knopf").click()); await seite.waitForTimeout(500);
ok(await seite.evaluate(() => !$("anlAlleBlatt") && document.querySelector("#msg-m3").classList.contains("aufblitzen")), "„↪ zur Nachricht“ springt hin und lässt sie aufblitzen");
// 5) Chat-Liste: 📎 mit Zahl (A7 Plan.docx und A9 Nachtrag.pdf noch nicht geöffnet; A1 geöffnet, Fotos gesehen, eigene zählen nicht)
await seite.evaluate(() => zeige("nachrichten")); await seite.waitForTimeout(1200); await weg();
const m5 = await seite.evaluate(() => document.querySelector('#unterhListe .unterh[data-id="T-ANL"] .anl-marke')?.textContent || "");
ok(m5 === "📎2", "Chat-Liste: " + (m5 || "(keine Marke)"));
ok(!(await ueberlauf()), "Liste: kein Überlauf bei 390 px");
await bild("chat-anlagen-3-liste");
// 6) Dunkelmodus und „✨ Animierte Knöpfe“ aus
await seite.evaluate(() => { document.documentElement.classList.add("dunkel", "ohne-anim"); ANLS.gepulst.clear(); ANLS.ids.delete("T-ANL"); chatStand = ""; return chatOeffnen("T-ANL"); }); await seite.waitForTimeout(1200); await weg();
ok(await seite.evaluate(() => { const k = document.querySelector("#chat .anl-puls .anl-klammer"); return !k || getComputedStyle(k).animationName === "none"; }), "„✨ Animierte Knöpfe“ aus: kein Aufleuchten");
await seite.evaluate(() => { window.scrollTo(0, document.body.scrollHeight); }); await seite.waitForTimeout(300);
await bild("chat-anlagen-4-dunkel");
ok(!(await ueberlauf()), "Dunkel: kein Überlauf bei 390 px");
// KC-DB-SPARSAM: keine neuen Server-Aktionen
const aktionen = await seite.evaluate(() => [...new Set(__api.map((x) => x.a))].sort().join(","));
ok(!/anlagen_|anl_/.test(aktionen), "keine zusätzliche Server-Aktion: " + aktionen);
ok(!fehler.length, "keine Fehler auf der Seite" + (fehler.length ? " – " + fehler.join(" | ") : ""));
await browser.close(); srv.close();
console.log(process.exitCode ? "chat-anlagen-browser: ROT" : "chat-anlagen-browser: alle Prüfungen bestanden");
