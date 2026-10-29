// KC-CLUB-EINLADUNG-BRIEF (2.740.0, Wunsch Hansi „die Einladung muss wirklich wie eine Einladung aufgebaut sein“): Brief je Empfänger.
// Aufruf: node tests/einladung-brief.test.mjs – führt die Brief-Funktion von Server und App aus und vergleicht sie.
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");

// Server-Funktion (TypeScript-Typen entfernen) und App-Funktion laden
const sStart = server.indexOf("const BRIEF_AMT_RE"), sEnde = server.indexOf("const einladungZiel");
const sCode = server.slice(sStart, sEnde).replace(/\(d: \{[^)]*?\}\)/, "(d)").replace(/\(iso: string\)/g, "(iso)");
const serverBrief = new Function("TZ", sCode + "; return einladungBrief;")("Europe/Berlin");
const aStart = app.indexOf("const BRIEF_AMT_RE"), aEnde = app.indexOf("function buBriefZeigen()");
const fZeit = new Intl.DateTimeFormat("de-DE", { timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit" });
const appBrief = new Function("TZ", "fZeit", app.slice(aStart, aEnde) + "; return einladungBrief;")("Europe/Berlin", fZeit);

const d = { vorname: "Marianne", titel: "Clubsitzung November", beginn: "2026-10-30T18:00:00Z", ort: "Gartenhütte bei Anne",
  top: ["1. Begrüßung", "2. Bericht des Kassenwarts", "3. Verschiedenes"], zusatz: "Bitte Kassenbuch mitbringen", url: "https://x/#termine", von: "Klaus", amt: "Clubsprecher", erinnerung: false };
// 2.751.0 KC-CLUB-SITZUNG-ABLAUF: neuer Satz „Dringende Vorschläge oder Änderungen können bis zur Sitzung noch dazukommen.“ (Wunsch Hansi 29.10.)
const brief = serverBrief(d);
assert.equal(brief, `Hallo Marianne,

hiermit laden wir dich herzlich zu unserer Clubsitzung ein:

📅 am Freitag, den 30.10.2026, um 19:00 Uhr
📍 Gartenhütte bei Anne

Folgende Punkte stehen auf der Tagesordnung:
1. Begrüßung
2. Bericht des Kassenwarts
3. Verschiedenes

Dringende Vorschläge oder Änderungen können bis zur Sitzung noch dazukommen.

Bitte Kassenbuch mitbringen

Wir freuen uns auf eine schöne, konstruktive Sitzung.
Bitte sag kurz in der Club-App zu oder ab:
https://x/#termine

Liebe Grüße
Klaus
Clubsprecher
Köcheclub Werne`);
assert.equal(appBrief(d), brief, "Vorschau in der App = Brief vom Server");
const er = serverBrief({ ...d, erinnerung: true, zusatz: "" });
assert.ok(er.startsWith("Hallo Marianne,\n\nkleine Erinnerung: am Freitag, den 30.10.2026, um 19:00 Uhr ist unsere Clubsitzung – Gartenhütte bei Anne.") && er.endsWith("Liebe Grüße\nKlaus\nClubsprecher\nKöcheclub Werne"), "Erinnerung als Brief");
assert.equal(appBrief({ ...d, erinnerung: true, zusatz: "" }), er);
assert.ok(serverBrief({ ...d, titel: "Jahreshauptversammlung", amt: "" }).includes("zu unserer Sitzung „Jahreshauptversammlung“ ein") && !serverBrief({ ...d, amt: "" }).includes("\n\nKöcheclub Werne\n"), "anderer Titel, ohne Amt");

// Versand: je Empfänger eigener Vorname, im Hintergrund; Gastgeber-Hinweis nach der Anrede
const sv = server.slice(server.indexOf('case "buero_einladung"'), server.indexOf('case "buero_nachher"'));
assert.ok(/sendenGewaehlt\("club_treffen", \[id\], wege, \{ \.\.\.vars, text: brief\(vorname\(leute\.get\(id\) \?\? null\)\) \}/.test(sv), "Brief je Empfänger");
assert.ok(/nebenbei\(versenden\(\)/.test(sv) && /k \+= 4/.test(sv), "im Hintergrund, je 4");
assert.ok(/replace\(\/\^\(Hallo\[\^\\n\]\*,\)\\n\\n\/, \(_, h\) => `\$\{h\}\\n\\n\$\{vorn\}\\n\\n`\)/.test(server), "Gastgeber-Hinweis nach „Hallo Anne,“");
assert.ok(/id="buBrief"/.test(app) && /oninput="buBriefZeigen\(\)"/.test(app), "Vorschau im Büro, ändert sich mit");
console.log("einladung-brief: alle Prüfungen bestanden");
