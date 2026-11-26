// KC-CLUB-HILFE-3330 (Wunsch Hansi 26.11.2026 „Checke die Änderungen in der Club App und passe die Hilfetexte, die Videos, die Lupe und Twinkey an“).
// Prüft (offline): neue/geänderte Hilfetexte zu 2.955.0–3.32.0, Clubleitungs-/Admin-Hilfen nur mit Rolle, die genannten Knöpfe gibt es wirklich,
// Erklär-Videos (Texte, neue Stationen, Fassungen), Lupe, Twinkey und Video-Verweise.
// Aufruf: node tests/hilfe-3330.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { programmText } from "./programm.mjs";
const lies = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const app = lies("app.js"), videos = lies("teile/videos.js"), hilfe = lies("teile/hilfe.js");
const programm = programmText() + lies("index.html") + lies("antwort.html");

// --- HILFE: Einträge als Zeilen ---
const h0 = app.indexOf("const HILFE = ["), HILFE = app.slice(h0, app.indexOf("\n];", h0));
const zeile = (id) => HILFE.split("\n").find((z) => z.includes(`{ id: "${id}",`)) || "";
const ids = new Set([...HILFE.matchAll(/\{ id: "([a-z_0-9]+)",/g)].map((m) => m[1]));
const themen = new Set([...app.slice(app.indexOf("const HILFE_THEMEN = ["), app.indexOf("const HILFE_TIPP_THEMA")).matchAll(/\{ id: "([a-z]+)"/g)].map((m) => m[1]));

const alle = ["karten_baukasten", "karte_gemeinsam", "kluge_helfer", "kh_erinnern", "autoantwort", "wa_lieber", "wa_holen", "chat_vorhanden", "chatfoto_speichern", "aufgaben_stand",
  "laufband_liste", "mitfahrt_laufband", "rollkartei", "dp_plaene", "dp_gruss", "ta_andere_zeit", "aenderung_bitte", "push_zeichen", "start_warum", "fehler_id", "lese_schreibtest"];
const freigabe = { dienst_stempeln: 'frei("dienst_stempel")', tippspiel: 'frei("tippspiel")', gemeinschaftsgericht: 'frei("gemeinschaftsgericht")', advent_gadget: "akSichtbar()" };
const leitung = ["sendebericht", "kundenpreisliste", "karte_starten"];
const admin = ["zusage_link", "admin_qr", "admin_verborgen", "notaus_knopf", "dp_druck_admin", "stempel_wer", "aenderung_erbitten", "fehlerkatalog", "gericht_admin"];
for (const id of [...alle, ...Object.keys(freigabe), ...leitung, ...admin]) {
  const z = zeile(id);
  assert.ok(z, `Hilfe ${id} vorhanden`);
  assert.ok(/seit: "3\.33\.0"/.test(z), `Hilfe ${id} mit seit 3.33.0 (🆕 / Tipp des Tages)`);
  assert.ok(themen.has((z.match(/thema: "([a-z]+)"/) || [])[1]), `Hilfe ${id} hat ein gültiges Thema`);
}
for (const id of alle) assert.ok(!/nur: /.test(zeile(id)), `Hilfe ${id} für alle Mitglieder`);
for (const [id, f] of Object.entries(freigabe)) assert.ok(zeile(id).includes(`nur: () => ${f}`), `Hilfe ${id} nur mit ${f}`);
for (const id of leitung) assert.ok(zeile(id).includes("nur: () => !!(ICH?.vorstand || ICH?.admin)"), `Hilfe ${id} nur für die Clubleitung`);
for (const id of admin) assert.ok(zeile(id).includes("nur: () => !!ICH?.admin") && /\(Admin\)/.test(zeile(id)), `Hilfe ${id} nur für den Admin`);
for (const id of alle) assert.ok(!/\bAdmin\b|\(Clubleitung\)/.test(zeile(id).replace(/Gruppen-Admin/g, "")), `Hilfe ${id}: für Mitglieder kein Admin-Text`);

// geänderte Einträge
assert.ok(/freiwillig/.test(zeile("protokoll_aufgaben")) && /erledigt am … von …/.test(zeile("protokoll_aufgaben")) && /📝 Stand melden/.test(zeile("protokoll_aufgaben")), "protokoll_aufgaben: Bemerkung freiwillig, erledigt am … von …, Stand melden");
assert.ok(/🕐 Ja, aber zu anderer Zeit/.test(zeile("anfrage_status")) && /hatte … vorgeschlagen/.test(zeile("anfrage_status")) && /roten <b>✕<\/b>/.test(zeile("anfrage_status")), "anfrage_status: andere Zeit, Vorschlag bleibt, ✕ herausnehmen");
assert.ok(/5 Sekunden je Name/.test(zeile("online_namen")), "online_namen: langsame Laufschrift mit Zoom");
assert.ok(/Buchstabe für Buchstabe/.test(zeile("schreibt_hinweis")), "schreibt_hinweis: Stift schreibt Buchstaben");
assert.ok(/Ich lese lieber WhatsApp/.test(zeile("whatsapp")), "whatsapp: verweist auf „Ich lese lieber WhatsApp“");
assert.ok(/Stand des Dienstplans/.test(zeile("mein_dienst")) && /Pläne Weihnachtsmarkt/.test(zeile("mein_dienst")) && /seit: "3\.33\.0"/.test(zeile("mein_dienst")), "mein_dienst: Stand und Pläne");
assert.ok(/Verlosung/.test(zeile("adventskalender")) && /Aushilfen/.test(zeile("adventskalender")), "adventskalender: Verlosung, auch Aushilfen");
assert.ok(/rot<\/b> und schwillt/.test(zeile("autoantwort")) && !/blau/.test(zeile("autoantwort")), "autoantwort: Knopf rot (3.11.0), nicht mehr blau");
for (const id of ["schlafmodus", "mitfahrt_gast", "notaus"]) assert.ok(/seit: "3\.33\.0"/.test(zeile(id)), `Neuheit ${id} als 🆕 markiert`);

// die genannten Knöpfe gibt es wirklich
for (const k of ["Karte schicken", "Ja, zur Karte", "Hier tippen – mit Name und Gesicht unterschreiben", "Freundlich nachfragen", "Kurz erinnern", "⏰ Erinnern", "Heute Abend, 19 Uhr", "Morgen früh, 9 Uhr",
  "Als Aufgabe übernehmen", "Text anzeigen", "Ich lese lieber WhatsApp", "WhatsApp automatisch öffnen", "Aus WhatsApp", "In einen Club-Chat", "Ja, dort schreiben", "weitere Empfänger",
  "Anlage bereit – du kannst jetzt senden", "Auf dem Gerät speichern", "Ja, erledigt", "Stand melden", "Stand der Aufgaben", "keine Rückmeldung", "Pläne Weihnachtsmarkt", "Stand des Dienstplans",
  "Ja, aber zu anderer Zeit", "Heute zu gewinnen", "Ich mache mit", "Gewonnen hat", "Ja, ich tippe mit", "Eigene Zutat", "Diesmal nicht", "Sofort erledigen", "Hat sich nichts geändert",
  "Lese- und Schreibtest", "Neue Rolle", "Karte groß", "Rastgeräusch", "Sendebericht der letzten Einladung", "Kundenpreisliste", "Als gemeinsame Karte starten", "Zusage-Link mailen",
  "Antwort abschicken", "QR-Codes", "Probe-NOT-AUS", "Entriegeln", "Alle jetzt senden", "Alle verwerfen", "Angehalten lassen", "Wunschplan – alle Tage", "Dienstplan – alle Tage",
  "Diesen Stand für alle Mitglieder freigeben", "An DP2 übergeben", "Festgeschrieben", "Wer darf stempeln", "nutzt es nicht", "Änderung erbitten", "Fehlerkatalog", "Datenverkehr-Anzeige im Kopf",
  "Rezept finden & verschicken", "Andere bitte", "Dienst beginnen", "Dienst beenden", "Nur, wenn ich gerade nicht in der App bin", "Autoantwort"])
  assert.ok(programm.includes(k), "Knopf im Programm: " + k);
for (const id of ["setKhFuerDich", "setWaLieber", "setRkRolle", "schlafWahl", "naAaKnopf"]) assert.ok(programm.includes(`id="${id}"`), "Ziel vorhanden: #" + id);

// --- Erklär-Videos ---
const block = (n) => { const a = videos.indexOf(`const ${n} = [`); return videos.slice(a, videos.indexOf("\n];", a)); };
const CP = block("RG_CHATPROFI"), TD = block("RG_TODO"), DI = block("RG_DIENST"), MG = block("RG_MITGLIEDER");
assert.ok(/sel: \["#naAaKnopf"\], t: "🤖 Autoantwort"/.test(CP) && /t: "✨ Kluge Helfer"/.test(CP) && /Ich schalte hier nichts ein/.test(CP), "Chat-Video: Autoantwort (nur zeigen) und Kluge Helfer");
assert.ok(/genau diesen Personen/.test(CP), "Chat-Video: vorhandene Gruppe");
assert.ok(/freiwillig/.test(TD) && /Stand melden/.test(TD) && /Wie steht's mit deiner Aufgabe/.test(TD), "To-do-Video: Bemerkung freiwillig, Stand melden");
assert.ok(/Pläne Weihnachtsmarkt/.test(DI) && /Stand des Dienstplans/.test(DI), "Dienst-Video: Stand und Pläne");
assert.ok(/Kontaktkarte/.test(MG) && /Karte schicken/.test(MG) && /Glocke/.test(MG), "Mitglieder-Video: Kontaktkarte, Karte schicken, Push-Glocke");
for (const [id, st] of [["todo", "2"], ["dienst", "3"], ["mitglieder", "3"], ["chatprofi", "5"]])
  assert.ok(new RegExp(`\\{ id: "${id}", stand: "${st}"`).test(app), `Video ${id}: neue Fassung ${st} (Bewertungen getrennt)`);
const tv0 = app.indexOf("const TW_VIDEOS = {"), TV = app.slice(tv0, app.indexOf("\n};", tv0));
const rg = new Set([...app.matchAll(/\{ id: "([a-z0-9_]+)", stand: "\d+"/g)].map((m) => m[1]));
for (const m of TV.matchAll(/"([hf]):([a-z0-9_-]+)": \[([^\]]+)\]/g)) for (const v of m[3].match(/"([a-z0-9_]+)"/g).map((x) => x.slice(1, -1))) assert.ok(rg.has(v), `TW_VIDEOS ${m[1]}:${m[2]} → Video ${v} gibt es`);
for (const k of ["h:kluge_helfer", "h:autoantwort", "h:aufgaben_stand", "h:dp_plaene", "h:push_zeichen", "h:ta_andere_zeit"]) assert.ok(TV.includes(`"${k}":`), "Video-Verweis " + k);

// --- Lupe und Twinkey ---
for (const id of [...alle.filter((x) => !["kluge_helfer", "wa_lieber", "rollkartei", "lese_schreibtest", "autoantwort"].includes(x)), "dienst_stempeln", "advent_gadget", "gemeinschaftsgericht", ...leitung, ...admin])
  assert.ok(hilfe.includes(`hzZuEintrag("h:${id}")`), "Lupe/Twinkey führt zu " + id);
for (const m of hilfe.matchAll(/hzZuEintrag\("h:([a-z_0-9]+)"\)/g)) assert.ok(ids.has(m[1]), "Lupe/Twinkey: Hilfe h:" + m[1] + " gibt es");
const f0 = hilfe.indexOf("const TW_FAQ = ["), FAQ = hilfe.slice(f0, hilfe.indexOf("\n];", f0));
const faq = (id) => FAQ.split("\n").find((z) => z.includes(`{ id: "${id}",`)) || "";
for (const id of ["karte-schicken", "karte-unterschreiben", "fuer-dich", "nachricht-erinnern", "lieber-whatsapp", "whatsapp-holen", "gruppe-vorhanden", "foto-speichern", "aufgabe-stand", "laufband-liste",
  "mitfahrt-laufband", "rollkartei", "dienstplan-drucken", "dienst-nachricht", "andere-zeit", "aenderung-bitte", "push-glocke", "start-dauert", "fehler-id", "lese-schreibtest", "schlafmodus"])
  assert.ok(faq(id) && !/nur: /.test(faq(id)), "Twinkey-Frage für alle: " + id);
for (const [id, f] of [["dienst-stempeln", 'frei("dienst_stempel")'], ["advent-verlosung", "akSichtbar()"], ["tippspiel", 'frei("tippspiel")'], ["gemeinschaftsgericht", 'frei("gemeinschaftsgericht")']])
  assert.ok(faq(id).includes(`nur: () => ${f}`), `Twinkey ${id} nur mit ${f}`);
for (const id of ["sendebericht", "kundenpreisliste"]) assert.ok(faq(id).includes("nur: () => !!(ICH?.vorstand || ICH?.admin)"), "Twinkey nur Clubleitung: " + id);
for (const id of ["zusage-link", "qr-codes", "notaus", "plaene-freigeben"]) assert.ok(faq(id).includes("nur: () => !!ICH?.admin"), "Twinkey nur Admin: " + id);
assert.ok(/rot und pulsierend = an/.test(faq("autoantwort")) && !/blau/.test(faq("autoantwort")), "Twinkey Autoantwort: rot statt blau");
const faqIds = [...FAQ.matchAll(/\{ id: "([a-z0-9-]+)",/g)].map((m) => m[1]);
assert.equal(faqIds.length, new Set(faqIds).size, "Twinkey-Fragen ohne doppelte Kennung");
for (const g of ["grusskarte", "rollkartei", "tippspiel", "gemeinschaftsgericht", "stempeluhr", "verlosung", "schlafmodus", "sendebericht"]) assert.ok(new RegExp(`\\[[^\\]]*"${g}"`).test(hilfe), "Wortgruppe " + g);
assert.ok(!/\["grusskarte"[^\]]*"karte"/.test(hilfe), "„karte“ bleibt bei Standort (keine Doppel-Gruppe)");
assert.ok(/\.\.\.\(ICH\?\.admin \? \[\["✉️", "Zusage-Link mailen"/.test(hilfe), "Lupe: Admin-Einträge nur für Admin");
assert.ok(/\.\.\.\(ICH\?\.vorstand \|\| ICH\?\.admin \? \[\["📊", "Sendebericht/.test(hilfe), "Lupe: Clubleitungs-Einträge nur mit Rolle");
assert.ok(/\.\.\.\(frei\("tippspiel"\) \? \[\["⚽"/.test(hilfe) && /\.\.\.\(frei\("gemeinschaftsgericht"\) \? \[\["🍲"/.test(hilfe), "Lupe: Tippspiel/Gemeinschaftsgericht nur mit Freigabe");

// --- Prüfwerkzeug für alle Videos: abgeschirmt, App bleibt wach ---
const pw = lies("tools/hilfe/alle-videos-browser.mjs");
assert.ok(/SCHLAF\.bedient = Date\.now\(\)/.test(pw) && /RUNDGAENGE/.test(pw), "alle-videos-browser: spielt alle Videos, App schläft dabei nicht ein");
console.log("hilfe-3330: ok");
