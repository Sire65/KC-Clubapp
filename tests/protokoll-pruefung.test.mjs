// KC-CLUB-PROTOKOLL-PRUEFUNG (2.818.0, Wunsch #57 Hansi): Schriftführer prüft vor dem Veröffentlichen.
// Aufruf: node tests/protokoll-pruefung.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync("index.html", "utf8"), server = fs.readFileSync("supabase/functions/kc-club/index.ts", "utf8");
const mig = fs.readFileSync("supabase/migrations/20261102_kc_club_protokoll_pruefung.sql", "utf8");
assert.ok(/add column if not exists pruefung jsonb/.test(mig), "eine Spalte, keine neue Tabelle");
// Server-Regeln echt ausführen
const h = server.slice(server.indexOf("const PRUEF_WARTE_TAGE = 3;"), server.indexOf("function pruefVerlauf("));
const R = new Function("jetzt", h.replace(/function pruefInfo[\s\S]*?\n\}\n/, "").replace(/: (Ich|any|Record<string, unknown>|string)/g, "").replace(/\(id\)/g, "(id)") + "\nreturn { pruefungNoetig, pruefWartetLange, pruefStand, pruefGleich };")(() => new Date().toISOString());
assert.equal(R.pruefungNoetig({ person_id: "H" }, { verfasser: "R" }), true, "jemand anderes ist Schriftführer → Prüfung (Wahl A)");
assert.equal(R.pruefungNoetig({ person_id: "R" }, { verfasser: "R" }), false, "Schriftführer schreibt selbst → keine Prüfung");
assert.equal(R.pruefungNoetig({ person_id: "H" }, { verfasser: "R", verfasser_offen: true }), false, "Schriftführer offen → erst eintragen");
assert.equal(R.pruefWartetLange({ stand: "bei_pruefer", gesendet_am: new Date(Date.now() - 4 * 864e5).toISOString() }), true, "nach 3 Tagen trotzdem (Wahl C)");
assert.equal(R.pruefWartetLange({ stand: "bei_pruefer", gesendet_am: new Date(Date.now() - 2 * 864e5).toISOString() }), false);
assert.equal(R.pruefWartetLange({ stand: "aenderung", gesendet_am: "2020-01-01T00:00:00Z" }), false, "bei Änderungswünschen nie „trotzdem“");
assert.ok(R.pruefGleich(R.pruefStand({ titel: "A", tagesordnung: ["x"] }), R.pruefStand({ titel: "A", tagesordnung: ["x"], id: 1 })), "nur Inhalt zählt");
// Server-Abläufe
const ver = server.slice(server.indexOf('case "protokoll_veroeffentlichen"'), server.indexOf('case "protokoll_korrigieren"'));
assert.ok(/if \(pruefungNoetig\(ich, pr\) && pg\?\.stand !== "freigegeben"\)/.test(ver) && /p\.ohneFreigabe === true && pruefWartetLange\(pg\)/.test(ver) && /ohne_freigabe: true/.test(ver), "Veröffentlichen nur nach Freigabe oder nach 3 Tagen mit Vermerk");
const sp = server.slice(server.indexOf('case "protokoll_speichern"'), server.indexOf('case "protokoll_anlage"'));
assert.ok(/pr\.pruefung\.pruefer === ich\.person_id\)\s*throw new Fehler\("Du prüfst dieses Protokoll/.test(sp), "wer prüft, ändert nicht selbst (Wahl B)");
assert.ok(/stand: "geaendert"/.test(sp), "nach der Freigabe geändert → neu prüfen");
for (const a of ["protokoll_pruefung_senden", "protokoll_pruefung_antwort", "protokoll_pruefung_wunsch", "protokoll_pruefung_erinnern"]) {
  assert.ok(server.includes(`case "${a}": {`), a); assert.ok(app.includes(`api("${a}"`), "App nutzt " + a);
}
const an = server.slice(server.indexOf('case "protokoll_pruefung_antwort"'), server.indexOf('case "protokoll_pruefung_wunsch"'));
assert.ok(/pg\.pruefer !== ich\.person_id\) throw/.test(an) && /\.eq\("pruefung->>stand", "bei_pruefer"\)/.test(an), "nur der Prüfer, nur einmal je Runde");
assert.ok(/Erinnern geht höchstens einmal am Tag/.test(server), "Erinnern gebremst");
assert.ok(/!\(pr\.pruefung\?\.von && pr\.pruefung\.von !== ich\.person_id\)/.test(server), "Prüfer löscht keinen fremden Entwurf");
assert.ok(/protokollPruefen, \/\* 2\.818\.0 KC-CLUB-PROTOKOLL-PRUEFUNG \*\/ naechstesTreffen/.test(server), "Start: was ich prüfen soll");
// App
assert.ok(/if \(PR\.pruefung\?\.ichPruefe\) protokollPruefen\(\);/.test(app), "Prüfer bekommt die Prüf-Ansicht");
assert.ok(/✅ Stimmt so – freigeben/.test(app) && /✏️ Änderung wünschen/.test(app) && /📨 \$\{g\.runde \? "Nochmal zur Prüfung" : "Zur Prüfung"\} an/.test(app), "Knöpfe wie im Konzept");
assert.ok(/📢 Trotzdem veröffentlichen \(ohne Freigabe\)/.test(app) && /📢 Veröffentlichen \(nach Freigabe\)/.test(app), "Veröffentlichen erst nach Freigabe");
assert.ok(/Protokoll <b>\$\{esc\(pp\.titel\)\}<\/b> vom \$\{esc\(tagKurz\(pp\.datum\)\)\} bitte prüfen/.test(app), "Hinweis auf der Startseite");
assert.ok(/\.pr-neu \{ background: #fff3a8;/.test(html), "gelb = geändert");
console.log("protokoll-pruefung: alle Prüfungen bestanden");
