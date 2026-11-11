// KC-CLUB-MAGAZIN-TERMINE (11.11.2026, Wunsch Hansi „Bei Termine im Januar: voraussichtliches Clubessen …, Nachbesprechung Weihnachtsmarkt,
// nächste Clubsitzung, Geburtstage Mitglieder im Januar“). Aufruf: node tests/magazin-termine.test.mjs (offline)
// Prüft: feste Termine in Heft 1, Rubrik zeigt nur Club-Termine + freigegebene Geburtstage des Heftmonats – nie eigene Dienste, private Termine
// oder Terminanfragen des Lesers (das Heft wird gedruckt und geteilt).
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const teil = lies("teile/magazin.js");
const daten = new Function("esc", teil.slice(teil.indexOf("const MAG_START"), teil.indexOf("// Bausteine für die Heftseiten")) + "; return { MAG_AUSGABEN };")((t) => String(t));
const fest = daten.MAG_AUSGABEN[1].termine_fest;
assert.deepEqual(fest.map((x) => x.text), ["Clubessen", "Nachbesprechung Weihnachtsmarkt", "Nächste Clubsitzung"]);
assert.ok(/voraussichtlich/.test(fest[0].wann) && /Termin und Ort werden noch abgestimmt/.test(fest[0].info), "Clubessen: Termin und Ort offen");
// magTermine
const quelle = teil.slice(teil.indexOf("function magTermine"), teil.indexOf("async function magDaten"));
const berlinIso = (iso) => iso.slice(0, 10), fZeit = { format: (d) => d.toISOString().slice(11, 16) };
const magTermine = new Function("berlinIso", "fZeit", quelle + "; return magTermine;")(berlinIso, fZeit);
const k = {
  treffen: [{ beginn: "2027-01-15T18:00:00Z", titel: "Clubsitzung", ort: "Vereinsheim", status: "geplant" }, { beginn: "2027-01-20T18:00:00Z", titel: "Abgesagt", status: "abgesagt" }, { beginn: "2027-02-03T18:00:00Z", titel: "Februar", status: "geplant" }],
  aktionen: [{ von: "2027-01-10", titel: "Ausflug" }],
  geburtstage: [{ md: "01-07", name: "Anna Beispiel" }, { md: "03-02", name: "März Kind" }],
  dienste: [{ datum: "2027-01-05", start: "10:00", bereich: "Küche" }], privat: [{ beginn: "2027-01-06T10:00:00Z", titel: "Zahnarzt" }],
  anfragen: [{ beginn: "2027-01-08T10:00:00Z", anlass: "Treffen", von: { vorname: "X" } }],
};
const t = magTermine(k, "2027-01-01", "2027-01-31");
assert.deepEqual(t.map((x) => x.text), ["Anna Beispiel", "Ausflug", "Clubsitzung · Vereinsheim"], "nur Club-Termine und Geburtstage im Januar, sortiert");
assert.ok(t[0].geburtstag && t[0].tag === "2027-01-07");
assert.ok(!/Mein Dienst|Zahnarzt|Treffen \(/.test(JSON.stringify(t)), "keine eigenen Dienste, privaten Termine oder Anfragen");
assert.ok(!/demnaechstListe/.test(teil.slice(teil.indexOf("async function magDaten"), teil.indexOf("async function magStart"))), "Heft nutzt nicht die persönliche Demnächst-Liste");
console.log("magazin-termine: ok");
