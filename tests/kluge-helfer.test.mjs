// KC-CLUB-KLUGE-HELFER (16.11.2026, Wunsch Hansi „Baue alle Vorschläge, aber logisch, bedienerfreundlich, nicht überladen“):
// Regeln (Frage, Anrede, Schnellantworten, Frist, Aufgabe, „Für dich“, offene Frage nach 12 Std., Erinnerungszeiten, Fotos rund um einen Termin)
// im Sandkasten mit ausgedachten Nachrichten – dazu Vertrag App ↔ Server (Aktionen, Zugang, Push ohne Text, Migration, Schalter).
// Aufruf: node tests/kluge-helfer.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";

const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const programm = programmText(), server = lies("supabase/functions/kc-club/index.ts"), html = lies("index.html");
const von = programm.indexOf("// >>> KH-REGELN"), bis = programm.indexOf("// <<< KH-REGELN");
assert.ok(von > 0 && bis > von, "Regel-Block KH-REGELN vorhanden");
const R = new Function(programm.slice(von, bis) + "\nreturn { khIstFrage, khKopf, khAnrede, khChips, khFrist, khAufgabe, khAufgabeText, khNurText, khOffeneFrage, khFuerDich, khZeile, khFotoTreffen, khErinZeiten, khBerlin, KH_FRAGE_MS };")();

// --- Frage erkennen: „?“ in Links und Zitaten zählt nicht
for (const [t, f] of [["Kommst du morgen?", true], ["Wann? 19 Uhr", true], ["Hast du Zeit 😊?", false], ["Hast du Zeit ?", true], ["Alles klar.", false],
  ["Schau mal: https://koecheclub-werne.de/seite?id=3", false], ["Er sagte „Kommst du?“ und ging.", false], ['Sie fragte "Wer kocht?" – keine Ahnung.', false],
  ["Siehe www.beispiel.de/?q=1 – passt das?", true], ["", false]])
  assert.equal(R.khIstFrage(t), f, `Frage: ${t}`);

// --- Anrede in Gruppen
const N = ["Anne", "Dieter", "Hans"];
assert.deepEqual(R.khAnrede("Anne, kannst du helfen?", N), ["Anne"]);
assert.deepEqual(R.khAnrede("Hallo Anne und Dieter! Wer kommt?", N), ["Anne", "Dieter"]);
assert.deepEqual(R.khAnrede("Wer hat Zeit? @dieter bitte melden", N), ["Dieter"]);
assert.deepEqual(R.khAnrede("Ich komme morgen, ok?", N), []);
assert.deepEqual(R.khAnrede("Hallo zusammen, wer kommt?", N), []);
assert.deepEqual(R.khAnrede("Hansi, kommst du?", N), [], "Hansi ist nicht Hans");
assert.deepEqual(R.khAnrede("Mail an anne@beispiel.de geschickt", N), [], "E-Mail-Adresse ist keine Erwähnung");

// --- Schnellantworten (höchstens 3, nach Zusammenhang)
const c = (t) => R.khChips(t).map((x) => x.t);
assert.deepEqual(c("Kommst du heute Abend zum Grillen?"), ["✅ Bin dabei", "❌ Kann nicht", "🤔 Vielleicht"]);
assert.deepEqual(c("Termin: Freitag 19 Uhr Clubküche"), ["✅ Bin dabei", "❌ Kann nicht", "🤔 Vielleicht"]);
assert.deepEqual(c("Treffen am 20.11. um 18:30?"), ["✅ Bin dabei", "❌ Kann nicht", "🤔 Vielleicht"]);
assert.deepEqual(c("Kannst du bitte die Schürzen mitbringen?"), ["👍 Mach ich", "⏰ Später"]);
assert.deepEqual(c("Bitte denk an den Schlüssel."), ["👍 Mach ich", "⏰ Später"]);
assert.deepEqual(c("Danke für den schönen Abend!"), ["😊 Gern geschehen", "👍"]);
assert.deepEqual(c("Die Küche ist sauber, alles erledigt."), ["🙏 Danke!", "👍"]);
assert.deepEqual(c("Wie geht es dir?"), [], "offene Frage: keine Knöpfe");
assert.deepEqual(c("Ok"), [], "zu kurz");
assert.deepEqual(c("Er fragte „Kommst du?“ – ich weiß es noch nicht genau."), ["🙏 Danke!", "👍"], "Zitat zählt nicht als Einladung");
assert.deepEqual(c("Die neue Rezeptseite ist online: https://beispiel.de/termin?kommst-du=1"), ["🙏 Danke!", "👍"], "Link zählt nicht");
for (const t of ["Kommst du?", "Kannst du?", "Danke", "Lange Info ohne alles hier."]) assert.ok(R.khChips(t).length <= 3);
assert.equal(R.khChips("Kannst du bitte?")[1].text, "⏰ Mach ich später", "Knopf-Text ≠ gesendeter Text erlaubt");

// --- Frist (Bezug Montag, 16.11.2026)
const B = "2026-11-16";
for (const [t, d] of [["bis Freitag", "2026-11-20"], ["Kannst du das bis zum 20.11. erledigen?", "2026-11-20"], ["bis 20.11.2026", "2026-11-20"], ["bis 20.11.26", "2026-11-20"],
  ["bis 3.1.", "2027-01-03"], ["bis morgen bitte", "2026-11-17"], ["spätestens übermorgen", "2026-11-18"], ["bis Montag", "2026-11-23"], ["spätestens Fr. Mittag", "2026-11-20"],
  ["bis Ende der Woche", "2026-11-20"], ["bis nächste Woche", "2026-11-23"], ["bis nächsten Mittwoch", "2026-11-18"], ["bis 31.02.", null], ["um 19 Uhr", null], ["bis so 5 Uhr", null],
  ["Link: https://beispiel.de/bis/20.11.", null], ["Er schrieb „bis Freitag“", null], ["Freitag geht", null]])
  assert.equal(R.khFrist(t, B), d, `Frist: ${t}`);

// --- Aufgabe aus Nachricht (Bitte + Frist) – nur Vorschlag
assert.deepEqual(R.khAufgabe("Hallo Hans, kannst du bitte bis Freitag die Grillkohle besorgen?", B), { text: "Die Grillkohle besorgen", bis: "2026-11-20" });
assert.deepEqual(R.khAufgabe("Bitte bis 20.11. die Liste schicken.", B), { text: "Die Liste schicken", bis: "2026-11-20" });
assert.deepEqual(R.khAufgabe("Anne, könntest du mal die Schürzen bis Montag waschen? Danke!", B), { text: "Die Schürzen waschen", bis: "2026-11-23" });
assert.equal(R.khAufgabe("Kannst du morgen kommen?", B), null, "ohne „bis“ keine Aufgabe");
assert.equal(R.khAufgabe("Bis Freitag ist der Club zu.", B), null, "ohne Bitte keine Aufgabe");

// --- Was die Regeln lesen
assert.equal(R.khNurText({ text: "🔒KCV1:abc" }), "", "verschlüsselt nie");
assert.equal(R.khNurText({ text: "🎤 Sprachnachricht (0:12)" }), "");
assert.equal(R.khNurText({ text: "🎤 Sprachnachricht (0:12)\n📝 Automatisch erkannt: Kommst du morgen?" }), "Kommst du morgen?");
assert.equal(R.khNurText({ text: "Frage?", umfrage: { frage: "x" } }), "");

// --- „Für dich“ und offene Frage (12-Stunden-Regel) mit ausgedachtem Chat
const J = Date.parse("2026-11-16T12:00:00Z"), vor = (h) => new Date(J - h * 3600000).toISOString();
const n = (id, h, x) => ({ id, zeit: vor(h), von: x.eigen ? "Du" : "Erika Beispiel", text: "", eigen: false, ...x });
const zweier = [n("a", 30, { text: "Kommst du Freitag zum Grillen?" }), n("b", 29, { eigen: true, text: "Ja!" }), n("c", 3, { text: "Wie geht es dir?" })];
assert.deepEqual(R.khFuerDich(zweier, { jetzt: J }).map((x) => [x.id, x.art]), [["c", "frage"]], "beantwortete Frage zählt nicht mehr");
const gruppe = [n("g1", 5, { text: "Wer hat Zeit?" }), n("g2", 4, { text: "Hans, kannst du bitte bis Freitag die Kohle besorgen?" }), n("g3", 3, { text: "Super gemacht", erwaehntMich: true }),
  n("g4", 2, { umfrage: { frage: "Essen?", optionen: [{ text: "Ja", meine: false }] } }), n("g5", 1, { umfrage: { frage: "Ort?", optionen: [{ text: "A", meine: true }] } }),
  n("g6", 200, { text: "Hans, kommst du?", erwaehntMich: true })];
assert.deepEqual(R.khFuerDich(gruppe, { jetzt: J, gruppe: true, ich: "Hans" }).map((x) => [x.id, x.art]), [["g2", "aufgabe"], ["g3", "erwaehnung"], ["g4", "umfrage"]],
  "Gruppe: nur an mich gerichtet, offene Umfrage, nichts älter als 7 Tage");
assert.equal(R.khFuerDich(gruppe, { jetzt: J, gruppe: true, ich: "Hans", weg: new Set(["a:g2"]) }).find((x) => x.id === "g2"), undefined, "übernommene/ausgeblendete Aufgabe weg");
const offen13 = [n("x", 20, { text: "Hallo" }), n("y", 13, { eigen: true, text: "Hast du am Samstag Zeit?" })];
assert.deepEqual(R.khFuerDich(offen13, { jetzt: J }).map((x) => x.art), ["offen"], "eigene Frage nach 13 Std. offen");
assert.deepEqual(R.khFuerDich([n("y", 11, { eigen: true, text: "Hast du Zeit?" })], { jetzt: J }), [], "nach 11 Std. noch nicht");
assert.deepEqual(R.khFuerDich([n("y", 13, { eigen: true, text: "Hast du Zeit?" }), n("z", 1, { text: "Ja" })], { jetzt: J }).map((x) => x.art), [], "Antwort da");
assert.deepEqual(R.khFuerDich([n("y", 13, { eigen: true, text: "Hast du Zeit?" })], { jetzt: J, offen: false }), [], "Schalter „offene Fragen“ aus");
assert.equal(R.khOffeneFrage([n("y", 13, { eigen: true, text: "Wer hat Zeit?" })], { gruppe: true, namen: N }), null, "Gruppe: ungerichtete Frage nicht");
assert.equal(R.khOffeneFrage([n("y", 13, { eigen: true, text: "@Anne hast du Zeit?" })], { gruppe: true, namen: N })?.id, "y");
assert.equal(R.khOffeneFrage([n("y", 13, { eigen: true, text: "Hast du Zeit?", erwaehnt: ["Anne"] }), n("y2", 12, { eigen: true, text: "Danke schon mal" })], { gruppe: true, namen: N })?.id, "y", "spätere eigene Nachricht ohne ? stört nicht");
assert.equal(R.KH_FRAGE_MS, 12 * 3600000);

// --- Zeile
assert.equal(R.khZeile([{ art: "frage" }, { art: "erwaehnung" }, { art: "umfrage" }]), "1 Frage · 1 Erwähnung · 1 Umfrage");
assert.equal(R.khZeile([{ art: "frage" }, { art: "frage" }, { art: "aufgabe" }, { art: "fotos", anzahl: 6 }, { art: "offen" }]), "2 Fragen · 1 Aufgabe · 📸 6 Fotos · ❓ deine Frage offen");

// --- Erinnerungszeiten (Berliner Uhr, Winter/Sommer)
let z = R.khErinZeiten(new Date("2026-11-16T10:00:00Z"));
assert.deepEqual(z.map((x) => [x.k, x.um.toISOString()]), [["abend", "2026-11-16T18:00:00.000Z"], ["morgen", "2026-11-17T08:00:00.000Z"]]);
z = R.khErinZeiten(new Date("2026-07-01T10:00:00Z"));
assert.deepEqual(z.map((x) => x.um.toISOString()), ["2026-07-01T17:00:00.000Z", "2026-07-02T07:00:00.000Z"], "Sommerzeit");
z = R.khErinZeiten(new Date("2026-11-16T18:45:00Z"));
assert.deepEqual(z.map((x) => x.k), ["stunde", "morgen"], "nach 19 Uhr: in 1 Stunde");
assert.equal(R.khBerlin("2026-03-29", 9).toISOString(), "2026-03-29T07:00:00.000Z", "Tag der Zeitumstellung");

// --- Fotos rund um einen Clubtermin (±1 Tag, mindestens 3)
const T = [{ id: "t1", titel: "Grillabend", tag: "2026-11-14" }, { id: "t2", titel: "Sitzung", tag: "2026-11-01" }];
assert.deepEqual(R.khFotoTreffen(["2026-11-14", "2026-11-15", "2026-11-15", "2026-11-13"], T), { treffen: T[0], anzahl: 4 });
assert.equal(R.khFotoTreffen(["2026-11-14", "2026-11-15"], T), null, "zu wenige");
assert.equal(R.khFotoTreffen(["2026-11-17", "2026-11-17", "2026-11-17"], T), null, "kein Termin nah genug");

// --- Vertrag App ↔ Server
const AKT = ["nachricht_erinnerung_setzen", "nachricht_erinnerung_liste", "nachricht_erinnerung_loeschen"];
const basis = (q) => { const i = q.indexOf("const ZUGANG_AKTIONEN"), t = q.slice(i, q.indexOf("aushilfe:", i)); return t; };
for (const a of AKT) {
  assert.ok(basis(server).includes(`"${a}"`) && basis(programm).includes(`"${a}"`), `Zugang (basis) in App und Server: ${a}`);
  assert.ok(server.includes(`case "${a}": {`), `Server-Aktion ${a}`);
}
const fall = server.slice(server.indexOf('case "nachricht_erinnerung_setzen": {'), server.indexOf('case "wecker_setzen": {'));
assert.ok(/await binTeilnehmer\(m\.thread_id, ich\.person_id\);/.test(fall), "nur in eigenen Chats");
assert.ok((fall.match(/\.eq\("person_id", ich\.person_id\)/g) || []).length >= 4, "immer nur die eigenen Erinnerungen");
assert.ok(/NA_ERIN_MAX/.test(fall) && /NA_ERIN_TAGE/.test(fall), "begrenzt");
assert.ok(/text: txt\(`Nachricht von \$\{von\}`, 120\)/.test(fall) && !/m\.body|select\("[^"]*body/.test(fall), "gespeichert wird nie der Nachrichtentext");
const lauf = server.slice(server.indexOf("async function weckerFaelligLauf"), server.indexOf("async function privatListe("));
assert.ok(/kurz: nachricht \? "Nachricht ansehen"/.test(lauf) && /#naerin=\$\{w\.thread_id\}:\$\{w\.message_id\}/.test(lauf), "Push nur Absender + „Nachricht ansehen“, Link springt zur Nachricht");
assert.ok(/else if \(h\.startsWith\("#naerin="\)\) \{ const \[t, m\] = h\.slice\(8\)\.split\(":"\); if \(t && m\) gemerktOeffnen\(t, m\); \}/.test(programm), "App öffnet Chat und springt");
assert.ok(/\.neq\("art", "nachricht"\)/.test(server.slice(server.indexOf('case "wecker_setzen": {'), server.indexOf('case "wecker_loeschen": {'))), "Erinnerungen nehmen den Weckern keinen Platz weg");
assert.ok(/api\("nachricht_erinnerung_setzen", \{ id, um \}/.test(programm), "App schickt nur Kennung und Zeit");
assert.ok(/nichtGelesen: andere\.filter\(/.test(server) && /eigen && andere\.length > 1 && gelesenVon\.length < andere\.length && Date\.now\(\) - Date\.parse\(m\.created_at\) >= 2 \* 3600000/.test(server), "„Noch nicht gelesen“: nur eigene Gruppen-Nachrichten ab 2 Std.");
// Migration: keine neue Tabelle, Rechte nur für den Server
const mig = lies("supabase/migrations/20261116_kc_club_kluge_helfer_erinnerung.sql");
assert.ok(/check \(art in \('wecker','timer','nachricht'\)\)/.test(mig) && /add column if not exists thread_id text/.test(mig) && /add column if not exists message_id text/.test(mig), "Migration: Art „nachricht“");
assert.ok(/revoke all on public\.kc_club_wecker from public, anon, authenticated;/.test(mig) && /grant select, insert, update, delete on public\.kc_club_wecker to service_role;/.test(mig) && /enable row level security/.test(mig), "Migration: Rechte");
assert.ok(!/create table/i.test(mig), "keine neue Tabelle");
assert.ok(fs.existsSync(new URL("../tools/db-test/115_nachricht_erinnerung_test.sql", import.meta.url)) && /nachricht_ok=t/.test(lies("tools/db-test/115_erwartet.txt")), "Probelauf vorhanden");
// Oberfläche: eine Zeile, Menü-Einträge, Schalter ab Werk an
assert.equal((html.match(/id="khFuerDich"/g) || []).length, 1, "genau eine „Für dich“-Zeile");
for (const [id, k] of [["setKhFuerDich", "khFuerDich"], ["setKhChips", "khChips"], ["setKhFragen", "khFragen"], ["setKhSprachText", "khSprachText"]]) {
  assert.ok(html.includes(`id="${id}"`) && html.includes(`einstellung('${k}', this.checked)`), `Schalter ${id}`);
  assert.ok(programm.includes(`["${id}", "${k}"]`), `Schalter ${id} wird mit „an“ vorbelegt (einst(k, true))`);
}
assert.ok(/<summary>✨ Kluge Helfer<\/summary>/.test(html), "Einstellungsgruppe „✨ Kluge Helfer“");
assert.ok(/khErinnern\('\$\{id\}'\)">⏰ Erinnern …<\/button>/.test(programm) && /khAufgabeStart\('\$\{id\}'\)">📋 Als Aufgabe übernehmen/.test(programm), "Menü: ⏰ Erinnern und 📋 Aufgabe");
assert.ok(/const m = u\.nachrichten\[u\.nachrichten\.length - 1\];\s*if \(!m \|\| m\.eigen/.test(programm), "Schnellantworten nur unter der neuesten Nachricht, wenn sie nicht von mir ist");
assert.ok(/KH_RUECK_MS = 5000/.test(programm) && /↩️ Rückgängig/.test(programm.slice(programm.indexOf("async function khChipSenden"))), "Schnellantwort mit Rückgängig");
assert.ok(/try \{ khNachZeichnen\(u, andere\); \} catch/.test(programm), "Helfer stören das Zeichnen des Chats nie");
assert.ok(!/api\("nachricht_senden"[^;]*khNachfragen|function khNachfragen[\s\S]{0,900}api\("nachricht_senden"/.test(programm) && !/function khKurzErinnern[\s\S]{0,600}api\(/.test(programm), "Nachfragen/Erinnern nur vorschreiben, nie selbst senden");
assert.ok(/khMitschreiben\(SPR\);/.test(programm) && /const erkannt = await khMitschreibenEnde\(s\), dazu = erkannt/.test(programm), "Sprachnachricht: Text läuft mit");
for (const id of ["khBlatt", "khErinBlatt", "khAufgabeBlatt"]) assert.ok(new RegExp(`${id}: "`).test(programm), `Fenstername ${id}`);
// localStorage: nur Kennungen/Zeiten, Schlüssel mit kc_club_ (beim Abmelden gelöscht)
assert.ok(/localStorage\.getItem\("kc_club_" \+ k\)/.test(programm.slice(programm.indexOf("const khLesen"))), "Speicher mit kc_club_-Präfix");
console.log("kluge-helfer: alle Prüfungen bestanden");
// 17.11.2026: Text zu Sprachnachrichten auf Android ab Werk aus (noch nicht am echten Gerät geprüft), sonst an
{
  const kh = new Function("IST_ANDROID", programm.slice(programm.indexOf("function khStandard(k)"), programm.indexOf("\n", programm.indexOf("function khStandard(k)"))) + "\nreturn khStandard;");
  assert.equal(kh(true)("khSprachText"), false, "Android: Sprachtext aus");
  assert.equal(kh(false)("khSprachText"), true, "sonst an");
  assert.equal(kh(true)("khChips"), true, "andere Schalter an");
  assert.ok(programm.includes("$(id).checked = einst(k, khStandard(k));") && programm.includes("const khAn = (k) => einst(k, khStandard(k));"), "Anzeige und Wirkung gleich");
}
console.log("kluge-helfer Android-Standard: ok");
