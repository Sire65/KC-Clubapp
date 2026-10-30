// KC-CLUB-UPDATE-DW-SCHUTZ (2.788.0, Fund Hansi 30.10.: „beim Eintragen der Zeiten ohne Assistent mehrmals rausgeflogen“): statische Prüfung (offline).
// Aufruf: node tests/update-dw-schutz.test.mjs
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
// offene Dienstwünsche (eigenes Vollbild-Fenster mit iframe, kein .blatt) und Fokus in einer eingebetteten Seite zählen als angefangene Arbeit
assert.ok(/const UPDATE_SPERRE_SEL = \["#dwFenster"\];/.test(app), "Dienstwunsch-Fenster sperrt das Selbst-Update");
assert.ok(/const eingebettetOffen = \(\) => UPDATE_SPERRE_SEL\.some\(\(s\) => document\.querySelector\(s\)\) \|\| document\.activeElement\?\.tagName === "IFRAME";/.test(app), "Fokus im iframe");
assert.ok(/const arbeitOffen = \(\) => \{ try \{ return etwasGetippt\(\) \|\| eingebettetOffen\(\) \|\|/.test(app), "arbeitOffen prüft beides");
// beide Wege des Selbst-Updates (direkt nach dem Öffnen und mitten in der Benutzung) fragen arbeitOffen
const u = app.slice(app.indexOf("function updateSelbst()"), app.indexOf("fpNeu(frisch ?", app.indexOf("function updateSelbst()")));
assert.ok(/if \(frisch \? arbeitOffen\(\) : \(!updateRuhig\(\) \|\| !ICH \|\| aktuelleAnsicht !== "start" \|\| chatId \|\| RUF \|\| arbeitOffen\(\)\)\) return;/.test(u), "beide Wege geschützt");
assert.ok(/id = "dwFenster"/.test(app), "Fenster-Kennung passt");
console.log("update-dw-schutz: alle Prüfungen bestanden");
