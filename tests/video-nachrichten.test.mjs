// KC-CLUB-VIDEO-NACHRICHTEN (Wunsch Hansi 05.11.2026): Erklär-Video „Nachrichten – alles Schritt für Schritt“ mit Zeitansage.
// Reihenfolge wie gewünscht; Browser-Prüfung Schritt für Schritt: tools/hilfe/video-nachrichten-browser.mjs. Aufruf: node tests/video-nachrichten.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { programmText } from "./programm.mjs";
const app = programmText(), v = readFileSync(new URL("../teile/videos.js", import.meta.url), "utf8");
for (const [id, f, name] of [["nachrichten_1", "1", "das Einfache"], ["nachrichten_2", "2", "Besonderheiten"]])
  assert.match(app, new RegExp(`\\{ id: "${id}", stand: "\\d", zeit: "\\d\\d\\.\\d\\d\\.2026", sym: "[^"]+", t: "Nachrichten – Folge ${f}: ${name}", u: "[^"]*\\(ca\\. \\d+ Min\\.\\)", st: \\(\\) => RG_NACHRICHTEN_${f}\\(\\) \\}`), `Folge ${f} im Katalog, geprüft (Zeitansage), mit ca. Dauer`);
assert.match(v, /\{ id: "kontakt", sym: "💬", t: "Schreiben & Kontakt", videos: \["nachrichten_1", "nachrichten_2", /, "beide Folgen bei Schreiben & Kontakt ganz vorn");
const folge = (f) => { const a = v.indexOf(`const RG_NACHRICHTEN_${f} = () => [`); return v.slice(a, v.indexOf("].filter(Boolean);", a)); };
const f1 = folge(1), f2 = folge(2), teil = f1 + f2;
assert.ok(f1.length > 1000 && f2.length > 1000, "beide Folgen haben Schritte");
const reihe = (txt, liste, wo) => { const pos = liste.map((t) => txt.indexOf(`"${t}"`)); liste.forEach((t, i) => { assert.ok(pos[i] > 0, `${wo}: Schritt fehlt: ${t}`); if (i) assert.ok(pos[i] > pos[i - 1], `${wo}: Reihenfolge: ${t}`); }); };
reihe(f1, ["💬 Nachrichten – Folge 1: das Einfache", "💬 Neue Nachricht", "⌨️ Kurz schreiben", "📝 Normal senden", "❗ Wichtig", "🏎️ Express – höchstens 5 am Tag", "📬 Express mit Bestätigung",
  "ⓘ Die Info an jeder Nachricht", "✔️ Was die Haken bedeuten", "👆 Nachricht antippen", "🗂️ Übersicht gegliedert", "👥 Gruppe, Favoriten, Gemerkt, Test", "✅ Fertig mit Folge 1"], "Folge 1");
reihe(f2, ["💬 Nachrichten – Folge 2: Besonderheiten", "🧰 Die kleine Zeile", "𝐅 Fett, kursiv, Farbe und Marker", "👥 Nur die Nachrichten des anderen", "🟢 Vom Club nach WhatsApp", "📋 Von WhatsApp in den Club",
  "📋 Einfügen und übernehmen", "📸 Bildschirmfoto", "🖍️ Markieren in Farbe", "📂 Nachrichten gruppiert", "⋮ Die drei Punkte oben rechts", "⋮ Farben, Selbstlöschen, Archivieren", "🎨 Dein Chat-Hintergrund", "🔒 Schloss an", "🔑 Bequemer: der Schlüsselbund", "✅ Fertig mit Folge 2"], "Folge 2");
assert.ok(!/"(🧰 Die kleine Zeile|🔒 Schloss an|📸 Bildschirmfoto)"/.test(f1) && !/"(📝 Normal senden|🏎️ Express – höchstens 5 am Tag)"/.test(f2), "Einfaches nur in Folge 1, Besonderheiten nur in Folge 2");
assert.ok(/video: "nachrichten_2", t: "✅ Fertig mit Folge 1"/.test(f1), "Folge 1 verweist am Ende auf Folge 2");
// übernommene Schritte gibt es in den Einzelvideos wirklich (sonst fielen sie still weg)
for (const [liste, t] of teil.matchAll(/rgAus\((RG_[A-Z]+), "([^"]+)"/g).map((m) => [m[1], m[2]])) {
  const s0 = v.indexOf(`const ${liste} = [`); assert.ok(s0 >= 0 && v.slice(s0, v.indexOf("\n];", s0)).includes(`t: "${t}"`), `${liste} hat „${t}“`);
}
// KC-CLUB-VIDEO-SATZPULS (Fund Hansi 05.11. „Text und Bild nicht synchron“): jede Station mit Knöpfen nennt die Sätze, in denen sie blinken –
// die Zahlen passen zum Text (Sätze wie im Video gezählt), jeder Knopf hat eine Satznummer, und es gibt keine Abkürzungen mit Punkt (zählten falsch).
const saetze = (t) => t.match(/[^.!?]+[.!?]*/g) || [t];
const eintraege = (q) => { let tiefe = 0, n = 1, in_ = ""; for (let i = 0; i < q.length; i++) { const c = q[i]; // oberste Ebene zählen, Zeichenketten überspringen
  if (in_) { if (c === "\\") i++; else if (c === in_) in_ = ""; continue; } if (c === '"' || c === "'" || c === "`") in_ = c; else if ("([{".includes(c)) tiefe++; else if (")]}".includes(c)) tiefe--; else if (c === "," && !tiefe) n++; } return n; };
for (const st of teil.split(/\n(?=  \{ v:|  rgAus\()/).slice(1)) {
  const titel = (st.match(/t: "([^"]+)"/) || st.match(/rgAus\(RG_[A-Z]+, "([^"]+)"/) || [])[1], x = (st.match(/x: "((?:[^"\\]|\\.)*)"/) || [])[1];
  const ps = st.match(/pulsSaetze: \[([0-9, ]+)\]/), puls = st.match(/puls: \[([\s\S]*?)\], pulsSaetze/);
  if (/puls: \[/.test(st)) assert.ok(ps, `${titel}: Knöpfe blinken satzweise (pulsSaetze)`);
  if (!ps || !x) continue;
  const n = ps[1].split(",").map(Number), s0 = saetze(x);
  assert.ok(Math.max(...n) < s0.length, `${titel}: Satznummer ${Math.max(...n)} gibt es nicht (${s0.length} Sätze)`);
  assert.ok(n.every((z, i) => !i || z >= n[i - 1]), `${titel}: Knöpfe in der Reihenfolge des Textes`);
  if (puls) assert.equal(eintraege(puls[1]), n.length, `${titel}: je Knopf eine Satznummer`);
  assert.ok(!/\b(z|u|ca|bzw|usw|Nr)\. /.test(x), `${titel}: keine Abkürzung mit Punkt im gesprochenen Text`);
}
assert.ok(/function rgSatzPuls\(s, n\)/.test(v) && /u\.onstart = \(\) => \{ if \(lauf === RG\.lauf\) rgSatz\(n\); \};/.test(v) && /try \{ beiSatz\?\.\(i\); \} catch \{\}/.test(v), "Sprecher meldet jeden Satz (Handy-Stimme und geladene Stimme)");
assert.ok(/if \(!RG\.ton && !rgpAktiv\(\)\) \{ \/\/ ohne Stimme: Sätze nach Lesezeit/.test(v), "ohne Ton: Sätze nach Lesezeit");
assert.ok(/"🎨 Dein Chat-Hintergrund"/.test(f2) && /\$\("cfBlatt"\)\?\.classList\.add\("rg-zeigen"\)/.test(v), "Folge 2 zeigt den Chat-Hintergrund (Fenster wird im Video angezeigt)");
// nichts senden: nur Beispiel-Chat, Geheim-Beispiel und Bilder; keine Sende-/Speicher-Aufrufe
assert.ok(!/\bapi\(\s*"(senden|nachricht_senden|speichern)/.test(teil) && !/sendenKlick\(|senden\(\)/.test(teil), "es wird nichts gesendet");
assert.ok(/nach: \(\) => \{ try \{ chatFilterSetzen\("alle", true\); \} catch \{\} \}/.test(teil) && /nach: \(\) => rgNaFormat\(false\)/.test(teil), "Ansicht und F-Leiste kommen zurück");
assert.ok(!/In (ein|zwei|drei|vier|fünf|\d+) Minuten/i.test(teil), "keine feste Minutenzahl im Text (Zeitansage rechnet selbst)");
console.log("video-nachrichten: alle Prüfungen bestanden");
