// KC-CLUB-VORSCHLAG-ORDNER (2.820.0, Wunsch #69 Hansi): Vorschläge, Spenden, Abstimmungen „🗄️ In Ordner“ – Ordner und Register wählen.
// Aufruf: node tests/vorschlag-ordner.test.mjs
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const k = app.slice(app.indexOf("function vorschlagKarte(v)"), app.indexOf("async function stimme(id, wahl)"));
assert.ok(/onclick="einmal\(this, \(\) => vorschlagInOrdner\('\$\{esc\(v\.id\)\}'\)\)">🗄️ In Ordner<\/button>/.test(k), "Knopf an jedem Vorschlag, jeder Spende, jeder Abstimmung");
assert.ok(/vorschlag: \{ sym: "💡", register: \["Vorschläge", "Abstimmungen", "Sonstiges"\], stichworte: "Vorschlag" \}/.test(app), "Ablage-Art in der Registry");
assert.ok(/await archivAblageFragen\("vorschlag", \{/.test(k), "vorhandene Ablage (Ordner + Register wählen) – kein zweiter Weg");
// Text echt erzeugen: geheime Abstimmung ohne Namen
const t0 = k.indexOf("function vorschlagText(v)"), code = k.slice(t0, k.indexOf("async function vorschlagInOrdner", t0));
const vt = new Function("zeitKurz", "wann", "spEuro", "TZ", code + "\nreturn vorschlagText;")(() => "20.10. 12:00", () => "x", (n) => n + " €", "Europe/Berlin");
const geheim = vt({ art: "abstimmung", geheim: true, status: "abgeschlossen", titel: "Frage", von: { name: "Klaus" }, erstellt_am: "2026-10-20T10:00:00Z", ergebnis: [{ option: "Ja", anzahl: 3, namen: ["Hansi"] }], stimmen: 3, berechtigt: 9, anlagen: [] });
assert.ok(/• Ja: 3$/m.test(geheim) && !/Hansi/.test(geheim), "geheim: nur Zahlen, keine Namen");
const offen = vt({ art: "thema", status: "offen", titel: "Grillabend", von: { name: "Klaus" }, erstellt_am: "2026-10-20T10:00:00Z", beschreibung: "Im Juni", ergebnis: [{ option: "dafuer", anzahl: 2, namen: ["A", "B"] }], anlagen: [{ name: "Plan.pdf" }] });
assert.ok(/Thema \/ Vorschlag/.test(offen) && /Im Juni/.test(offen) && /👍: 2 \(A, B\)/.test(offen) && /Anlagen: Plan\.pdf/.test(offen), "Thema mit Unterstützern und Anlagen");
console.log("vorschlag-ordner: alle Prüfungen bestanden");
