// 2.869.0 KC-CLUB-ADVENT-2026 (Konzept docs/adventskalender-2026, Wunsch Hansi 06.11.2026): neuer Adventskalender.
// Aufruf: node tests/advent-2026.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";

const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const js = programmText(), seite = lies("index.html");
const block = js.slice(js.indexOf("const AK_NASCH = ["), js.indexOf("const AK_REIHE"));
const { AK_NASCH, AK_TUERCHEN, AK_ARTEN } = new Function(block + "; return { AK_NASCH, AK_TUERCHEN, AK_ARTEN };")();

// 24 Türchen, Rhythmus Nascherei → Basteln → Deko, Sonntage 6./13./20.12.2026 Kinderriegel, Tag 24 Einladung
assert.equal(AK_TUERCHEN.length, 24, "24 Türchen");
assert.equal(AK_TUERCHEN.map((T) => T.art[0]).join(""), "nbdnbrdnbdnbndnbdnbrdnbe", "Reihenfolge der Sorten (2.947.0: 13.12. Mandarinen-Licht statt Gutschein)");
AK_TUERCHEN.forEach((T, i) => {
  assert.equal([6, 20].includes(i + 1), T.art === "riegel", `Tag ${i + 1}: Preis-Türchen nur am 6.12. (Schoko-Nikolaus) und 20.12. (Kinderriegel)`);
  assert.ok(AK_ARTEN[T.art] && T.sym && T.t, `Tag ${i + 1}: Sorte, Symbol, Titel`);
});
assert.equal(AK_TUERCHEN[23].art, "einladung", "Türchen 24: Einladung");
assert.deepEqual(AK_TUERCHEN.filter((T) => T.art === "riegel").map((T) => T.preis), ["nikolaus", "kinderriegel"], "6.12. Schoko-Nikolaus, 20.12. ein Kinderriegel (Hansi 15.11.2026)");
assert.equal(AK_TUERCHEN.filter((T) => T.art === "naschen").length, 8, "8 Naschereien (13.12. Mandarinen-Licht)");
assert.equal(AK_TUERCHEN.filter((T) => T.art === "basteln").length, 7, "7 Bastelideen");
assert.equal(AK_TUERCHEN.filter((T) => T.art === "deko").length, 6, "6 Deko-Ideen");

// Anleitungen: Material, 4 Schritte, Tipp; Basteln/Deko mit Dauer, Kinder-Hinweis und Link
for (const T of AK_TUERCHEN.filter((x) => ["naschen", "basteln", "deko"].includes(x.art))) {
  assert.ok(T.z?.length >= 3 && T.z.length <= 5, "3–5 Zutaten/Materialien: " + T.t);
  assert.ok(T.s?.length === 4 || T.t === "Engel aus Nudeln (Baumschmuck)", "4 Schritte: " + T.t);
  assert.ok(T.tipp, "Tipp: " + T.t);
  if (T.art !== "naschen") assert.ok(T.dauer && (T.kinder === true || T.kinder === "mit Hilfe"), "Dauer + Kinder-Hinweis: " + T.t);
  if (T.art !== "naschen") assert.match(T.link, /^https:\/\/[a-z0-9.-]+\.[a-z]{2,}\//, "Link zur echten Anleitung: " + T.t);
  if (T.link) assert.doesNotMatch(T.link, /selbst\.de|wunderweib\.de|rossmann\.de|tutkit\.com|lusini\.com/, "keine Seite mit Bezahl-/Einwilligungs-Sperre: " + T.t);
}
assert.ok(/href="\$\{esc\(T\.link\)\}" target="_blank" rel="noopener"/.test(js), "Link öffnet neues Fenster mit noopener");

// Keine Anleitung geht verloren: alle 22 Naschereien + Engel bleiben, Kalender-Naschereien kommen aus AK_NASCH
assert.equal(AK_NASCH.length, 23, "alle bisherigen Anleitungen bleiben");
for (const t of ["Lokomotive aus Dominosteinen", "Schneemann aus Pfeffernüssen", "Lebkuchen-Kerze mit Mandel-Flamme", "Hexenhaus aus Butterkeksen", "Mandarinen-Licht (Luciatag)", "Obst-Tannenbaum"]) assert.ok(AK_NASCH.some((x) => x.t === t), "bleibt: " + t);
for (const T of AK_TUERCHEN.filter((x) => x.art === "naschen")) assert.ok(AK_NASCH.some((x) => x.t === T.t), "Kalender-Nascherei stammt aus AK_NASCH: " + T.t);
assert.ok(/function akNaschFach\(\)/.test(js) && /onclick="akNaschFach\(\)">📖 Alle Naschereien</.test(js), "Fach „Alle Naschereien“");

// Preis-Türchen: Gutschein fürs Weihnachtsessen im Januar; seit 2.947.0 (Wunsch #89, Hansi 15.11.2026) „🎁 Ja, den nehme ich“ → Hansis Liste.
// Nur die drei eigenen Server-Wege, kein „Eingelöst“-Abhaken.
const riegel = js.slice(js.indexOf("function akRiegelKarte"), js.indexOf("const AK_FRUEHSTUECK"));
assert.ok(/Weihnachtsessen im Januar/.test(riegel) && !/Eingelöst/.test(riegel), "Gutschein fürs Weihnachtsessen");
assert.deepEqual([...new Set((riegel.match(/api\("([a-z_]+)"/g) || []).map((x) => x.slice(5, -1)))].sort(), ["advent_preis_melden", "advent_preise_liste", "advent_preise_meine"], "nur die Advent-Preis-Wege");
assert.ok(!/KINDERRIEGEL[^<]*<img|ferrero/i.test(riegel), "kein Markenlogo");

// Türchen 24: Termin folgt, Antwort über die vorhandene Abstimmung (kein neuer Server-Weg)
const einl = js.slice(js.indexOf("function akEinladungKarte"), js.indexOf("function akTuer("));
assert.ok(/Termin wird noch bekannt gegeben/.test(einl) && /frohe Weihnachten/.test(einl), "Einladung mit Gruß, ohne Terminauswahl");
assert.ok(/api\("vorschlaege_liste"\)/.test(einl) && /vorschlagInfo\(/.test(einl) && (einl.match(/api\("/g) || []).length === 1, "nur vorhandene Abstimmung");

// Nur Mitglieder; Hintergrundbild klein und vorhanden
assert.ok(/const akSichtbar = \(\) => zugang\(\) === "mitglied" &&/.test(js) && /function akZeigen\(\) \{\n  if \(!akSichtbar\(\)\) return;/.test(js), "kein Kalender für Gäste/Aushilfen");
const bild = fs.statSync(new URL("../advent/rathaus.webp", import.meta.url));
assert.ok(bild.size > 10_000 && bild.size <= 150_000, "Rathaus-Bild ≤ 150 KB");
assert.ok(/\.ak-blatt \.blatt-innen \{ background: #1b1815 url\(advent\/rathaus\.webp\)/.test(seite) && /Bild: Altes Rathaus Werne im Advent – Hansi/.test(js), "Hintergrund + Bildnachweis");
assert.ok(/body\.grosseschrift \.ak-raster \{ grid-template-columns: repeat\(3, 1fr\); \}/.test(seite), "große Schrift: 3 Spalten");
// Hansi 06.11.: Türchen 24 immer größer (2 × 2), Text: Grillen im August ausgefallen
assert.ok(/\.ak-tuer\.ak-24 \{ grid-column: span 2; grid-row: span 2;/.test(seite) && /\$\{n === 24 \? " ak-24" : ""\}/.test(js), "Türchen 24 doppelt so groß");
assert.ok(/Grillen im August<\/b> bei mir leider ausgefallen/.test(js) && !/tolles Clubjahr/.test(js), "Einladungstext");
console.log("advent-2026: ok");
