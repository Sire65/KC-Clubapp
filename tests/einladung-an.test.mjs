// KC-CLUB-EINLADUNG-AN + KC-CLUB-SAMMEL-ANSAGE (2.739.0, Wunsch Hansi): statische Prüfung (offline).
// Aufruf: node tests/einladung-an.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");

// --- Einladung: An wen? (Alle · Gruppe · Auswahl)
const bl = app.slice(app.indexOf("async function buEinladung("), app.indexOf("function buWeg(w) {"));
assert.ok(/An wen\?<\/div><div id="buAn"><\/div>/.test(bl) && bl.indexOf('id="buAn"') < bl.indexOf("Wie benachrichtigen?"), "„An wen?“ vor „Wie benachrichtigen?“");
assert.ok(/chip\("alle", "👥 Alle"\)\}\$\{chip\("gruppe", "🧑‍🤝‍🧑 Gruppe"\)\}\$\{chip\("auswahl", "☑️ Auswahl"\)\}/.test(bl), "drei Wahlmöglichkeiten");
assert.ok(/an: \{ art: "alle"/.test(bl), "Alle ist vorgewählt (wie bisher)");
assert.ok(/✅ Zugesagt/.test(bl) && /❓ Noch ohne Antwort/.test(bl) && /AEMTER/.test(bl) && /MG_GRUPPEN/.test(bl), "Gruppen: Zugesagt, ohne Antwort, Ämter, eigene Gruppen");
assert.ok(/zielAuswahl\("☑️ Wer bekommt die Einladung\?"/.test(bl), "Auswahl über das gemeinsame Fenster");
const se = app.slice(app.indexOf("async function buSenden(knopf)"), app.indexOf("// ---------- KC-CLUB-BUERO-EINGANG"));
assert.ok(/A\.art === "alle" \? \{\} : \{ ziel: \{ art: A\.art, name: A\.name \|\| "", ids: A\.ids \} \}/.test(se), "Ziel geht an den Server, „Alle“ unverändert");
assert.ok(/Bitte Mitglieder auswählen\./.test(se) && /Bitte eine Gruppe antippen\./.test(se), "ohne Auswahl wird nichts gesendet");
// Abstimmung nutzt weiter dasselbe Fenster
assert.ok(/async function vfAuswahl\(\) \{ VF_ZIEL\.art = "auswahl"; vfZielZeigen\(\); zielAuswahl\("☑️ Wer soll abstimmen\?"/.test(app), "Abstimmung unverändert");

// Server: nur Schnittmenge mit den sonst berechtigten Empfängern
const sv = server.slice(server.indexOf('case "buero_einladung"'), server.indexOf('case "buero_nachher"'));
assert.ok(/const an = einladungZiel\(p\.ziel\);/.test(sv) && /\(!an \|\| an\.ids\.has\(id\)\)/.test(sv), "Server filtert auf die Auswahl");
assert.ok(/ids: new Set<string>\(z\.ids\.map\(String\)\.slice\(0, 500\)\)/.test(server) && /z\.art === "gruppe" \|\| z\.art === "auswahl"/.test(server), "Ziel geprüft und begrenzt");

// --- Sammelnachricht: Titel vom Server → Ansage in der App (echte Funktionen ausführen)
const st = server.match(/const sammelTitel = \(empfaenger: number\) => (.+);/)[1];
const sammelTitel = new Function("empfaenger", "return " + st);
assert.equal(sammelTitel(1), "", "nur an mich: Titel unverändert");
assert.ok(/\$\{sammelTitel\(\(tn \?\? \[\]\)\.length\)\}/.test(server) && /grp \? `\$\{grp\.symbol\} \$\{grp\.name\}: \$\{ich\.vorname\}` : `💬 \$\{ich\.name\}\$\{sammelTitel/.test(server), "nur ohne Gruppe");
const i = app.indexOf("function ansageDeuten("), fn = app.slice(i, app.indexOf("\nfunction ansageAusPush", i));
const ansage = new Function("chatId", "aktuelleAnsicht", "document", fn + "; return ansageDeuten;")("x", "start", { hidden: false });
const sag = (titel) => ansage(titel, "Hallo", "https://x/#nachricht=abc")?.text;
assert.equal(sag("💬 Christina Muster"), "Christina Muster hat dir eine Nachricht geschickt.");
assert.equal(sag("💬 Christina Muster" + sammelTitel(6)), "Christina Muster hat dir und 5 anderen Personen eine Sammelnachricht geschickt.");
assert.equal(sag("💬 Christina Muster" + sammelTitel(2)), "Christina Muster hat dir und einer anderen Person eine Sammelnachricht geschickt.");
assert.equal(sag("❗ Wichtig – 💬 Christina Muster" + sammelTitel(3)), "Wichtig! Christina Muster hat dir und 2 anderen Personen eine Sammelnachricht geschickt.");
assert.equal(sag("🍳 Küchenteam: Christina"), "Christina hat in der Gruppe Küchenteam geschrieben.");
console.log("einladung-an: alle Prüfungen bestanden");
