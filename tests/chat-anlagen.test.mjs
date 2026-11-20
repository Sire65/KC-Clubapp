// KC-CLUB-CHAT-ANLAGEN-SICHTBAR (19.11.2026, Wunsch Hansi „wenn dort eine Anlage drin liegt, muss die besser gekennzeichnet sein, z. B. durch eine blinkende Büroklammer“).
// Aufruf: node tests/chat-anlagen.test.mjs (offline). Rechnet die reinen Funktionen mit AUSGEDACHTEN Nachrichten nach (KC-CHATS-PRIVAT: keine echten Chats)
// und prüft die Stellen in App, Seite und CI: A Anlage-Leiste, B 📎 mit Zahl in der Chat-Liste ohne Server-Abfrage, C Aufleuchten, D „Alle Anlagen“.
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), seite = lies("index.html");
const funktion = (q, kopf) => { const a = q.indexOf(kopf); assert.ok(a >= 0, `${kopf} fehlt`); return q.slice(a, q.indexOf("\n}\n", a) + 2); };
const zeile = (q, kopf) => { const a = q.indexOf(kopf); assert.ok(a >= 0, `${kopf} fehlt`); return q.slice(a, q.indexOf("\n", a)); };
const quelle = [zeile(app, "const ANL_AUF_MAX = "), zeile(app, "const anlZaehlt = "), zeile(app, "const anlIstBild = "), zeile(app, "const anlSym = "),
  funktion(app, "function anlLeisteDaten("), funktion(app, "function anlPulsIds("), funktion(app, "function anlChatOffen("), funktion(app, "function anlListeZahl("), funktion(app, "function anlAlleListe(")].join("\n");
const F = new Function("VN_ANL_NAME", quelle + "\nreturn { anlZaehlt, anlLeisteDaten, anlPulsIds, anlChatOffen, anlListeZahl, anlAlleListe, ANL_AUF_MAX, ANL_TAGE };")("🔒 verschlüsselt.bin");
const { anlZaehlt: z } = F;

// ---- Beispieldaten (ausgedacht)
const pdf = { id: "A1", name: "Preisliste.pdf", mime: "application/pdf" }, foto = { id: "A2", name: "IMG_1.jpg", mime: "image/jpeg" }, foto2 = { id: "A3", name: "IMG_2.jpg", mime: "image/jpeg" };
const sprache = { id: "A4", name: "Sprachnachricht 0:12.webm", mime: "audio/webm" }, einmal = { id: "A5", name: "x.jpg", mime: "image/jpeg", einmal: true }, vn = { id: "A6", name: "🔒 verschlüsselt.bin", mime: "application/octet-stream" };
const h = (std) => new Date(Date.now() - std * 3600000).toISOString();
const N = [
  { id: "m1", eigen: false, von: "Erika Beispiel", zeit: h(50), text: "📎", anlagen: [pdf, foto] },
  { id: "m2", eigen: true, von: "Du", zeit: h(40), text: "Danke", anlagen: [{ id: "E1", name: "Meins.pdf", mime: "application/pdf" }] },
  { id: "m3", eigen: false, von: "Erika Beispiel", zeit: h(3), text: "Hörst du?", anlagen: [sprache] },
  { id: "m4", eigen: false, von: "Anne Muster", zeit: h(2), text: "Fotos", anlagen: [foto2, einmal, vn] },
  { id: "m5", eigen: false, von: "Anne Muster", zeit: h(1), text: "📎", anlagen: [{ id: "A7", name: "Plan.docx", mime: "application/msword" }] },
];

// ---- zählt als Anlage
assert.deepEqual([pdf, foto, sprache, einmal, vn, { name: "ohne id" }].map(z), [true, true, false, false, false, false], "Sprachnachricht, Einmal-Foto, 🔒-Anlage und Anlagen ohne Kennung zählen nicht");

// ---- A: Leiste
assert.equal(F.anlLeisteDaten([pdf, foto], z).text, "📎 2 Anlagen: Preisliste.pdf · Foto", "Beispiel aus dem Wunsch");
assert.equal(F.anlLeisteDaten([foto], z), null, "ein einzelnes Foto zeigt sich selbst – keine Leiste");
assert.equal(F.anlLeisteDaten([foto, foto2], z).text, "📎 2 Anlagen: 2 Fotos", "mehrere Fotos zusammengefasst");
assert.equal(F.anlLeisteDaten([pdf], z).text, "📎 1 Anlage: Preisliste.pdf", "Einzahl");
assert.equal(F.anlLeisteDaten([sprache], z), null, "Sprachnachricht: keine Leiste");
assert.equal(F.anlLeisteDaten(undefined, z), null, "ohne Anlagen");

// ---- B: noch nicht geöffnete Dateien anderer
const offen = F.anlChatOffen(N, new Set(), Date.now(), z);
assert.deepEqual(offen, ["A1", "A7"], "nur Dateien anderer (keine Fotos, keine eigenen, keine Sprachnachrichten)");
assert.deepEqual(F.anlChatOffen(N, new Set(["A1"]), Date.now(), z), ["A7"], "geöffnete zählen nicht");
assert.deepEqual(F.anlChatOffen(N, new Set(), Date.now() + (F.ANL_TAGE + 1) * 86400000, z), [], "älter als 30 Tage zählt nicht");
const rec = { bis: h(1), offen };
assert.equal(F.anlListeZahl({ id: "C", ungelesen: 0, letzte: { von: "Anne", text: "📎", zeit: h(1) } }, rec, new Set()), 2, "📎2 aus dem gemerkten Stand");
assert.equal(F.anlListeZahl({ id: "C", ungelesen: 0, letzte: { von: "Anne", text: "📎", zeit: h(1) } }, rec, new Set(["A1", "A7"])), 0, "alles geöffnet → keine Zahl");
assert.equal(F.anlListeZahl({ id: "C", ungelesen: 1, letzte: { von: "Anne", text: "📎", zeit: h(0.1) } }, rec, new Set()), 3, "neue reine Anlage seit dem letzten Öffnen zählt mit");
assert.equal(F.anlListeZahl({ id: "C", ungelesen: 1, letzte: { von: "Du", text: "📎", zeit: h(0.1) } }, rec, new Set()), 2, "eigene Anlage zählt nie");
assert.equal(F.anlListeZahl({ id: "C", ungelesen: 1, letzte: { von: "Anne", text: "Hallo", zeit: h(0.1) } }, null, new Set()), 0, "ohne Anlage, nie geöffnet → nichts");
assert.equal(F.anlListeZahl({ id: "C", ungelesen: 2, letzte: { von: "Anne", text: "📎", zeit: h(0.1) } }, null, new Set()), 1, "nie geöffneter Chat mit neuer Anlage → 📎1");
assert.equal(F.anlListeZahl({ id: "C", ungelesen: 0, letzte: { von: "Anne", text: "📎", zeit: h(0.1) } }, null, new Set()), 0, "schon gelesen → nichts aus der letzten Nachricht");

// ---- C: Aufleuchten
assert.deepEqual([...F.anlPulsIds(N, undefined, h(2.5), new Set(), z)], ["m4", "m5"], "erstes Zeichnen: ungelesene Nachrichten anderer mit Anlage");
assert.deepEqual([...F.anlPulsIds(N, new Set(["m1", "m2", "m3", "m4"]), h(0), new Set(), z)], ["m5"], "danach: nur neu hinzugekommene");
assert.deepEqual([...F.anlPulsIds(N, new Set(["m1", "m2", "m3", "m4"]), h(0), new Set(["m5"]), z)], [], "jede nur einmal je Sitzung");
assert.deepEqual([...F.anlPulsIds(N, undefined, h(0), new Set(), z)], [], "alles gelesen → nichts");

// ---- D: Alle Anlagen
assert.deepEqual(F.anlAlleListe(N, z).map((x) => x.a.id), ["A7", "A3", "E1", "A2", "A1"], "neueste zuerst, ohne Sprach-/Einmal-/🔒-Anlagen, eigene dabei");

// ---- App: Stellen
const lade = funktion(app, "async function chatLaden(");
assert.ok(/anlPulsIds\(u\.nachrichten, ANLS\.ids\.get\(fuer\)/.test(lade) && /merk \? new Set\(\)/.test(lade), "Aufleuchten nur mit frischen Daten");
assert.ok(/anlZaehlt\(a\) \? "" /.test(lade) && /anlLeisteHtml\(m, anlPuls\.has\(m\.id\), anlAuf\)/.test(lade), "Dateien stehen in der Leiste (nicht doppelt)");
assert.ok(/if \(!merk\) try \{ anlNachZeichnen\(fuer, u, anlPuls\)/.test(lade), "Liste merken nur mit frischen Daten");
assert.ok(/anlMarke\(u\)/.test(funktion(app, "function uhZeile(")) && /anlMarke\(u\)/.test(funktion(app, "function uhKarteiHtml(")), "📎 mit Zahl in Liste und Kartei");
assert.ok(/anlGeoeffnetMerken\(id\)/.test(funktion(app, "async function anlageOeffnen(")) && /anlGeoeffnetMerken\(id\)/.test(funktion(app, "function anlageAktion(")), "Öffnen merkt „geöffnet“");
const merkF = funktion(app, "function anlGeoeffnetMerken(") + funktion(app, "function anlNachZeichnen(");
assert.ok(/slice\(-ANL_AUF_MAX\)/.test(merkF) && /ANL_CHATS_MAX/.test(merkF) && F.ANL_AUF_MAX === 500, "Gerätespeicher begrenzt (500 Anlagen, 60 Chats)");
// KC-DB-SPARSAM: keine Server-Abfrage in den neuen Funktionen (außer dem Bild-Link, den bildLaden wie überall holt)
const neu = app.slice(app.indexOf("// ---------- KC-CLUB-CHAT-ANLAGEN-SICHTBAR"), app.indexOf("// 7 📸 Fotos ins Album", app.indexOf("// ---------- KC-CLUB-CHAT-ANLAGEN-SICHTBAR")));
assert.ok(neu.length > 2000 && !/\bapi\(/.test(neu), "keine zusätzliche Server-Abfrage (KC-DB-SPARSAM)");
assert.ok(/anl-puls/.test(neu) && /@keyframes anlPuls/.test(seite) && /prefers-reduced-motion: reduce\) \{ \.anl-puls \.anl-klammer \{ animation: none; \}/.test(seite) && /:root\.ohne-anim \.anl-puls \.anl-klammer/.test(seite), "Aufleuchten: CSS, weniger Bewegung, „✨ Animierte Knöpfe“ aus");
assert.ok(/animation: anlPuls \.5s ease-in-out 3;/.test(seite), "3× in ~1,5 s");
assert.ok(/id="chatAnlKnopf" onclick="anlAlleBlatt\(\)"/.test(seite), "„📎 Alle Anlagen“ im Chat-Menü");
assert.ok(/anlAlleBlatt: "📎 Alle Anlagen im Chat"/.test(app), "Fenster in FENSTER_NAMEN");
assert.ok(/:root\.dunkel \.anl-leiste/.test(seite) && /\.blase\.eigen \.anl-leiste/.test(seite), "Hell, Dunkel und eigene Blase");
assert.ok(/id: "chat_anlagen", thema: "nachrichten"/.test(app), "Hilfe-Tipp");
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/chat-anlagen.test.mjs"), "läuft in der CI");
const br = lies("tools/hilfe/chat-anlagen-browser.mjs");
assert.ok(/OHNE_ECHTSERVER/.test(br) && /--no-proxy-server/.test(br) && /r\.abort\(\)/.test(br), "Browser-Lauf abgeschirmt");
console.log("✅ chat-anlagen: alle Prüfungen bestanden");
// KC-CLUB-CHAT-ANLAGEN-BLINKEN (20.11.2026, Fund Hansi „Die Büroklammer hat nicht geblinkt“): blinkt, solange eine Datei ungeöffnet ist
{
  const { readFileSync } = await import("node:fs");
  const a = readFileSync(new URL("../app.js", import.meta.url), "utf8"), h = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  if (!/const blink = d\.dateien\.some\(neu\);/.test(a) || !/blink \? " anl-blink" : puls \? " anl-puls" : ""/.test(a)) throw new Error("📎 blinkt bei ungeöffneten Dateien");
  if (!/l\.querySelector\("\.anl-teil\.ungeoeffnet"\)\) l\.classList\.remove\("anl-blink"\)/.test(a)) throw new Error("nach dem Öffnen hört das Blinken auf");
  if (!/\.anl-blink \.anl-klammer \{ animation: anlBlink 1\.4s ease-in-out infinite;/.test(h) || /\.ohne-anim[^{]*\.anl-blink/.test(h)) throw new Error("Blinken dauerhaft, auch bei Animationen aus");
  if (!/prefers-reduced-motion: reduce\) \{ \.anl-blink \.anl-klammer \{ animation: none; box-shadow:/.test(h)) throw new Error("weniger Bewegung: roter Ring statt Blinken");
  console.log("chat-anlagen (Blinken): ok");
}
