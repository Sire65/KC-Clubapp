// KC-CLUB-SITZUNG-SCHRITTE + KC-CLUB-EINE-TAGESORDNUNG (2.749.0, Wunsch Hansi 29.10.2026: „Schritt für Schritt, damit der Clubsprecher
// durchgeführt wird, und nur eine Tagesordnung, die in allen Benachrichtigungen gleich ist“). Verhaltensprüfung (offline, nachgebaute Daten).
// Aufruf: node tests/sitzung-schritte.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8"), html = fs.readFileSync("index.html", "utf8");
const ts = (code) => code.replace(/\): Promise<[^>]+> \{/g, ") {").replace(/(\w+)\??: (string\[\] \| null|string|any|boolean|number)\b/g, "$1").replace(/ as unknown as Ich/g, "").replace(/new Set<string>/g, "new Set").replace(/ as any\[\]/g, "");

// --- 1) Schrittfolge: immer genau ein nächster Schritt, in der richtigen Reihenfolge
const sQ = app.slice(app.indexOf("const BU_SCHRITTE = ["), app.indexOf("// nächster Schritt fürs Büro"));
const H = 3600000, T = 86400000, jetzt = Date.now(), iso = (ms) => new Date(jetzt + ms).toISOString();
const mach = (vorstand) => new Function("ICH", "zeitKurz", "wann", "esc", "CA_VORHER_MIN", "CA_DAUER_STD", sQ + "\nreturn { buSchritteFuer, buNaechster, buSchritteHtml };")(
  { vorstand }, (x) => "am " + x.slice(0, 10), (x) => x, (x) => String(x), 120, 6);
const { buNaechster, buSchritteFuer, buSchritteHtml } = mach(true);
const sitzung = (x) => ({ id: "S1", titel: "Clubsitzung", beginn: iso(5 * T), vorbereitet: false, einladung_am: null, erinnerung_am: null, geaendert_nach_einladung: false, aktentasche: null, ohne: 3, ...x });
assert.equal(buNaechster(sitzung()), "vorbereiten", "1. Tagesordnung festlegen");
assert.equal(buNaechster(sitzung({ vorbereitet: true })), "einladung", "2. einladen");
const geaendert = sitzung({ vorbereitet: true, einladung_am: iso(-2 * T), geaendert_nach_einladung: true });
assert.equal(buNaechster(geaendert), "einladung", "geändert nach der Einladung → wieder Schritt 2");
assert.match(buSchritteFuer(geaendert)[1].knopf, /Geänderte Tagesordnung mitteilen/, "… als „Änderung mitteilen“");
assert.match(buSchritteFuer(geaendert)[1].los, /buEinladung\('S1', false, true\)/, "… öffnet die Änderungs-Nachricht");
assert.equal(buNaechster(sitzung({ vorbereitet: true, einladung_am: iso(-1 * H) })), "aktentasche", "3. Aktentasche (Clubleitung)");
assert.equal(mach(false).buNaechster(sitzung({ vorbereitet: true, einladung_am: iso(-1 * H) })), null, "ohne Clubleitung keine Aktentasche – und noch nichts fällig");
const gepackt = { status: "gepackt", gepackt_am: iso(-1 * H) };
assert.equal(buNaechster(sitzung({ vorbereitet: true, einladung_am: iso(-1 * H), aktentasche: gepackt, beginn: iso(2 * T) })), null, "direkt nach der Einladung noch NICHT erinnern (Fund Hansi 28.10.)");
assert.equal(buNaechster(sitzung({ vorbereitet: true, einladung_am: iso(-3 * T), aktentasche: gepackt, beginn: iso(6 * T) })), null, "eine Woche vorher noch nicht erinnern");
assert.equal(buNaechster(sitzung({ vorbereitet: true, einladung_am: iso(-3 * T), aktentasche: gepackt, beginn: iso(2 * T) })), "erinnerung", "4. erinnern: 2 Tage vorher, Einladung älter als 1 Tag");
assert.equal(buNaechster(sitzung({ vorbereitet: true, einladung_am: iso(-3 * T), aktentasche: gepackt, beginn: iso(2 * T), ohne: 0 })), null, "alle haben geantwortet → nichts zu erinnern");
assert.equal(buNaechster(sitzung({ vorbereitet: true, einladung_am: iso(-3 * T), erinnerung_am: iso(-T), aktentasche: gepackt, beginn: iso(1 * H) })), "clubabend", "5. am Abend selbst: Clubabend");
const karte = buSchritteHtml(sitzung({ vorbereitet: true }));
assert.match(karte, /✅<\/span><span><b>Tagesordnung festlegen/, "erledigt mit ✅") && assert.match(karte, /👉<\/span><span><b>Mitglieder einladen/, "jetzt dran mit 👉");
assert.match(karte, /onclick="buEinladung\('S1', false\)"/, "großer Knopf für den nächsten Schritt");
// Büro-Liste und Büro-Raum benutzen dieselbe Quelle
assert.ok(/const nt = S \? buNachherTipp\(\) : null, dr = S \? buDran\(t\) : null, dran = dr\?\.text;/.test(app) && /const dr = S \? buDran\(t\) : null, dran = dr\?\.text, dranFn = dr\?\.fn;/.test(app), "Liste und Raum: ein nächster Schritt");
assert.match(app, /if \(!t\.protokoll \|\| \(!t\.fotos && t\.protokoll\.status !== "veroeffentlicht"\)\)/, "kein Foto mehr verlangen, wenn veröffentlicht");

// --- 2) Eine Tagesordnung: alle Stellen lesen sitzungTagesordnung
const eine = ts(server.slice(server.indexOf("async function sitzungTagesordnung("), server.indexOf("async function bueroSitzung(")));
const to = new Function("bueroSitzung", eine + "\nreturn sitzungTagesordnung;")(async () => ({ vorbereitung: null, standard: { tagesordnung: [{ t: "Begrüßung" }] } }));
assert.deepEqual((await to("S1", { vorbereitung: { tagesordnung: [{ t: "A" }, { t: "B" }] }, standard: { tagesordnung: [{ t: "X" }] } })).map((x) => x.t), ["A", "B"], "gespeichert gilt");
assert.deepEqual((await to("S1", { vorbereitung: { tagesordnung: [] }, standard: { tagesordnung: [{ t: "X" }] } })).map((x) => x.t), ["X"], "leer gespeichert → Vorschlag");
assert.deepEqual((await to("S1")).map((x) => x.t), ["Begrüßung"], "ohne Vorbereitung → Vorschlag der App");
for (const [wo, re] of [["Aktentasche", /const top = \(await sitzungTagesordnung\(t\.id, b\)\)\.map\(\(x: any\) => String\(x\.t \|\| ""\)\)/],
  ["Clubabend", /const top = \(await sitzungTagesordnung\(t\.id, b\)\) \/\/ 2.749.0/], ["Erinnerung am Vortag", /return \(await sitzungTagesordnung\(treffenId\)\)\.map/],
  ["Termin-Ansicht", /tos\.set\(t\.id, \{ punkte: \(await sitzungTagesordnung\(t\.id, b\)\)/]]) assert.match(server, re, `${wo} liest die eine Tagesordnung`);
assert.match(app, /x\.t\.tagesordnung\?\.length \? `<div class="karte" style="margin-top:6px"><b>📋 Tagesordnung<\/b>/, "Termin-Ansicht zeigt sie");
assert.match(app, /<b>💡 Eingereichte Themen<\/b>/, "Themen ohne Tagesordnung heißen nicht „Tagesordnung“");
assert.match(server, /if \(!nurOffen && !top\.length\) throw new Fehler\("Bitte zuerst die Tagesordnung festlegen und speichern/, "Einladung nur mit festgelegter Tagesordnung (Server)");
assert.match(app, /if \(!nurOffen && !top\.length\) return buWeiterFragen\("📝 Zuerst die Tagesordnung festlegen"/, "… und die App führt dorthin");

// --- 3) Brief „geänderte Tagesordnung“: App-Vorschau = Versand
const sB = server.slice(server.indexOf("const BRIEF_AMT_RE"), server.indexOf("const einladungZiel")).replace(/\(d: \{[^)]*?\}\)/, "(d)").replace(/\(iso: string\)/g, "(iso)");
const serverBrief = new Function("TZ", sB + "; return einladungBrief;")("Europe/Berlin");
const fZeit = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
const appBrief = new Function("TZ", "fZeit", app.slice(app.indexOf("const BRIEF_AMT_RE"), app.indexOf("function buBriefZeigen()")) + "; return einladungBrief;")("Europe/Berlin", fZeit);
const d = { vorname: "Klaus", titel: "Clubsitzung November", beginn: "2026-11-12T18:00:00Z", ort: "Kolpinghaus", top: ["1. Begrüßung", "2. Grillfest", "3. Verschiedenes"], zusatz: "", url: "https://x", von: "Hansi", amt: "Clubsprecher", erinnerung: false, aenderung: true };
assert.equal(appBrief(d), serverBrief(d), "Vorschau und Versand gleich");
assert.match(serverBrief(d), /hat sich die Tagesordnung geändert\. So sieht sie jetzt aus:\n1\. Begrüßung\n2\. Grillfest\n3\. Verschiedenes/);
assert.match(server, /if \(!an\) await db\.from\("kc_club_buero_sitzung"\)\.upsert/, "„eingeladen“ zählt nur, wenn es an alle ging");
assert.match(server, /const gast = !nurOffen && !aenderung && \(!t\.gastgeber_person_id \|\| ziel\.includes\(t\.gastgeber_person_id\)\)/, "Gastgeber nur, wenn ausgewählt");

// --- 4) Zusage/Absage nach dem Vorbereiten: Büro-Anwesenheit und Protokoll-Entwurf gleichziehen (nachgebaute Datenbank)
const abgl = ts(server.slice(server.indexOf("async function sitzungAntwortAbgleich("), server.indexOf("async function sitzungTagesordnung(")));
const lauf = async (beginnMs, antwort) => {
  const daten = { kc_club_treffen: { beginn: iso(beginnMs), art: "treffen" }, kc_club_buero_sitzung: { anwesend: ["P1", "P2"], tagesordnung: [{ t: "A" }] }, kc_club_sitzungsprotokolle: { id: "PR", anwesend: ["P1", "P2"], entschuldigt: [] } }, upd = {};
  const db = { from: (tab) => { const q = { select: () => q, eq: () => q, maybeSingle: async () => ({ data: daten[tab] }), update: (x) => { upd[tab] = x; return q; } }; return q; } };
  await new Function("db", abgl + "\nreturn sitzungAntwortAbgleich;")(db)("S1", "P2", antwort); return upd;
};
let u = await lauf(2 * T, "nein");
assert.deepEqual(u.kc_club_buero_sitzung.anwesend, ["P1"], "Absage → im Büro nicht mehr angehakt");
assert.deepEqual(u.kc_club_sitzungsprotokolle, { anwesend: ["P1"], entschuldigt: ["P2"] }, "… und im Protokoll-Entwurf entschuldigt");
u = await lauf(2 * T, "ja"); assert.ok(u.kc_club_buero_sitzung.anwesend.includes("P2"), "Zusage → angehakt");
assert.deepEqual(await lauf(-H, "nein"), {}, "nach Sitzungsbeginn nichts mehr ändern");
assert.deepEqual(await lauf(2 * T, "vielleicht"), {}, "„vielleicht“ ändert nichts");
assert.equal((server.match(/await sitzungAntwortAbgleich\(/g) || []).length, 2, "beide Antwort-Wege (selbst + aus der Nachricht eingetragen)");
// App: alte Fassung beim Laden abgleichen und sagen
const lQ = app.slice(app.indexOf("async function buSitzungLaden("), app.indexOf("async function buSitzungOeffnen("));
const BU = {}; await new Function("BU", "api", "buSchreiben", lQ + "\nreturn buSitzungLaden;")(BU, async () => ({ standard: { anwesend: [], tagesordnung: [{ t: "X" }], zeilen: 5 }, anmerkungVorschlag: "",
  mitglieder: [{ person_id: "P1", name: "Klaus", antwort: "nein", antwort_am: iso(-H) }, { person_id: "P3", name: "Anna", antwort: "ja", antwort_am: iso(-H) }],
  vorschlaege: [{ id: "V9", fuerDiese: true }], vorbereitung: { anwesend: ["P1"], tagesordnung: [{ t: "A" }], zeilen: 5, anmerkung: "", geaendert_am: iso(-T) } }), () => true)("S1");
assert.deepEqual([...BU.f.anwesend], ["P3"], "Klaus abgesagt → raus, Anna neu zugesagt → rein");
assert.equal(BU.hinweise.length, 3, "Absage, Zusage und neuer Vorschlag werden genannt");
assert.equal(BU.stand, iso(-T), "Stand für den Zusammenstoß-Schutz");

// --- 5) Zwei Leute gleichzeitig: nicht still überschreiben
assert.match(server, /if \(vorher && \(vorher\.tagesordnung \?\? \[\]\)\.length && !p\.ueberschreiben && Date\.parse\(String\(p\.stand \|\| ""\)\) !== Date\.parse\(vorher\.geaendert_am\)\)/, "Server erkennt den Zusammenstoß");
assert.match(server, /update\(\{ tagesordnung: l, geaendert_am: jetzt\(\), geaendert_von: ich\.person_id \}\)/, "dringender Punkt zählt als Änderung");
assert.match(app, /if \(r\.zusammenstoss\) return buWeiterFragen\("⚠️ Inzwischen geändert"/, "App fragt: neu laden oder eigene Fassung");

// --- 6) Bedienung
assert.match(app, /onkeydown="if\(event\.key==='Enter'\)\{event\.preventDefault\(\);buTopNeu\(\)\}"/, "Eingabetaste fügt den eigenen Punkt hinzu");
assert.match(app, /const offen = \(f\.neu \|\| ""\)\.trim\(\); if \(offen\) \{ f\.neu = ""; buTopEinfuegen/, "vergessener eigener Punkt wird beim Speichern mitgenommen");
assert.match(app, /async function buTopWeg\(i\) \{ const t = BU\.f\.tagesordnung\[i\]; if \(!t \|\| !\(await frage\(/, "✕ fragt vor dem Streichen");
assert.match(app, /window\.scrollBy\(0, b\.getBoundingClientRect\(\)\.top - y\)/, "▲▼: der Punkt bleibt unter dem Finger");
assert.match(app, /if \(buGeaendert\(\)\) return buWeiterFragen\("💾 Änderungen speichern\?"/, "Verlassen mit ungespeicherten Änderungen fragt nach");
assert.match(html, /@media \(max-width: 1023px\) \{ \.bu-leiste \{ bottom: calc\(136px \+ env\(safe-area-inset-bottom\)\); \} \}/, "„Fertig – speichern“ liegt über den runden Hilfe-Knöpfen");
assert.match(server, /update\(\{ treffen_id: nx\?\.id \?\? null \}\)\.eq\("treffen_id", t\.id\)\.eq\("status", "offen"\)/, "abgesagte Sitzung: Vorschläge wandern zur nächsten");
assert.match(server, /or\(`beginn\.lt\.\$\{jetzt\(\)\},status\.eq\.abgesagt`\)/, "Tasche einer abgesagten Sitzung gleich unter „Frühere Taschen“");

console.log("sitzung-schritte: alle Prüfungen bestanden");
