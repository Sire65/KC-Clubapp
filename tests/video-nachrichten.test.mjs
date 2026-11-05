// KC-CLUB-VIDEO-NACHRICHTEN (Wunsch Hansi 05.11.2026): Erklär-Video „Nachrichten – alles Schritt für Schritt“ mit Zeitansage.
// Reihenfolge wie gewünscht; Browser-Prüfung Schritt für Schritt: tools/hilfe/video-nachrichten-browser.mjs. Aufruf: node tests/video-nachrichten.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { programmText } from "./programm.mjs";
const app = programmText(), v = readFileSync(new URL("../teile/videos.js", import.meta.url), "utf8");
assert.match(app, /\{ id: "nachrichten_alles", stand: "1", zeit: "\d\d\.\d\d\.2026", sym: "📨", t: "Nachrichten – alles Schritt für Schritt", u: "[^"]*\(ca\. \d+ Min\.\)", st: \(\) => RG_NACHRICHTEN\(\) \}/, "im Katalog, geprüft (Zeitansage), mit ca. Dauer");
assert.match(v, /\{ id: "kontakt", sym: "💬", t: "Schreiben & Kontakt", videos: \["nachrichten_alles", /, "steht bei Schreiben & Kontakt ganz vorn");
const a = v.indexOf("const RG_NACHRICHTEN = () => ["), teil = v.slice(a, v.indexOf("].filter(Boolean);", a));
assert.ok(a > 0 && teil.length > 1000, "Schritte vorhanden");
const reihe = ["💬 Neue Nachricht", "⌨️ Kurz schreiben", "📝 Normal senden", "❗ Wichtig", "🏎️ Express – höchstens 5 am Tag", "📬 Express mit Bestätigung", "🧰 Die kleine Zeile",
  "𝐅 Fett, kursiv, Farbe und Marker", "👥 Nur die Nachrichten des anderen", "🟢 Vom Club nach WhatsApp", "📋 Von WhatsApp in den Club", "📸 Bildschirmfoto", "🖍️ Markieren in Farbe",
  "📂 Nachrichten gruppiert", "⋮ Die drei Punkte oben rechts", "ⓘ Die Info an jeder Nachricht", "🗂️ Übersicht gegliedert", "🔒 Schloss an", "🔑 Bequemer: der Schlüsselbund", "✅ Fertig"];
const pos = reihe.map((t) => teil.indexOf(`"${t}"`));
reihe.forEach((t, i) => { assert.ok(pos[i] > 0, "Schritt fehlt: " + t); if (i) assert.ok(pos[i] > pos[i - 1], "Reihenfolge: " + t); });
// übernommene Schritte gibt es in den Einzelvideos wirklich (sonst fielen sie still weg)
for (const [liste, t] of teil.matchAll(/rgAus\((RG_[A-Z]+), "([^"]+)"/g).map((m) => [m[1], m[2]])) {
  const s0 = v.indexOf(`const ${liste} = [`); assert.ok(s0 >= 0 && v.slice(s0, v.indexOf("\n];", s0)).includes(`t: "${t}"`), `${liste} hat „${t}“`);
}
// nichts senden: nur Beispiel-Chat, Geheim-Beispiel und Bilder; keine Sende-/Speicher-Aufrufe
assert.ok(!/\bapi\(\s*"(senden|nachricht_senden|speichern)/.test(teil) && !/sendenKlick\(|senden\(\)/.test(teil), "es wird nichts gesendet");
assert.ok(/nach: \(\) => \{ try \{ chatFilterSetzen\("alle", true\); \} catch \{\} \}/.test(teil) && /nach: \(\) => rgNaFormat\(false\)/.test(teil), "Ansicht und F-Leiste kommen zurück");
assert.ok(!/In (ein|zwei|drei|vier|fünf|\d+) Minuten/i.test(teil), "keine feste Minutenzahl im Text (Zeitansage rechnet selbst)");
console.log("video-nachrichten: alle Prüfungen bestanden");
