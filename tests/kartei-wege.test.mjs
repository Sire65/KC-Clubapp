// KC-KARTEI-WEGE (22.11.2026, Wunsch Hansi „auf die Rollkartei oben rechts das Fragezeichen, wie auf dem Button, welche Wege jemand im Programm nimmt“):
// dasselbe „?“ wie auf der Mitglieder-Kachel (KC-CLUB-WAS-MACHT) oben rechts auf den Karteikarten (Chats- und Mitglieder-Kartei) –
// nur Admin, nur online (vorhandene Online-Daten, keine neue Abfrage), nicht bei mir; öffnet die Wege der Person. Quelltext + reine Funktion, offline.
// Aufruf: node tests/kartei-wege.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), html = lies("index.html");

const zeile = app.match(/const rkWasKnopf = \(m\) => [^\n]*/)?.[0];
assert.ok(zeile, "rkWasKnopf vorhanden");
assert.ok(/ICH\?\.admin && m\?\.person_id && m\.person_id !== ICH\.person_id && mgOn\(m\)/.test(zeile), "nur Admin, nicht ich, nur online (mgOn)");
assert.ok(/class="mg-was rk-was"/.test(zeile) && /mgWasMacht\('\$\{esc\(m\.person_id\)\}'\)/.test(zeile) && /event\.preventDefault\(\);event\.stopPropagation\(\)/.test(zeile), "gleiches „?“, öffnet die Wege, klappt die Karte nicht");
assert.ok(!/api\(/.test(zeile), "keine Server-Abfrage je Karte");
assert.ok(/function mgWasMacht\(pid\) \{ if \(!ICH\?\.admin\) return; spurAdmin\(heuteIso\(\), pid\); \}/.test(app), "Wege der Person (heute), nur Admin");
// in beiden Karteien, oben im Kartenkopf
assert.ok(/<summary>\$\{kreis\(m, m\.name, 30\)\}<span>\$\{esc\(m\.name\)\}<\/span>\$\{rkWasKnopf\(m\)/.test(app), "Mitglieder-Kartei");
assert.ok(/\$\{!u\.gruppe && u\.anzahl <= 2 \? rkWasKnopf\(MITGLIEDER\?\.find\(\(m\) => m\.name === u\.teilnehmer\[0\]\)\) : ""/.test(app), "Chats-Kartei: nur Einzelchats");
assert.ok(/:is\(\.uhk, \.mgk\) > summary > \.rk-was \{ position: static; flex: none; margin-left: auto; pointer-events: auto;/.test(html), "rechts im Kopf, antippbar");

// reine Prüfung mit Testdaten
const rk = (ich, on) => new Function("ICH", "mgOn", "esc", "mgWasMacht", zeile.replace("const rkWasKnopf =", "return"))(ich, (m) => on.has(m.person_id), (s) => String(s), () => {});
const anna = { person_id: "P2", name: "Anna Beispiel" };
assert.ok(rk({ admin: true, person_id: "P1" }, new Set(["P2"]))(anna).includes(">?</button>"), "Admin + online → ?");
assert.equal(rk({ admin: true, person_id: "P1" }, new Set())(anna), "", "offline → nichts");
assert.equal(rk({ admin: false, person_id: "P1" }, new Set(["P2"]))(anna), "", "kein Admin → nichts");
assert.equal(rk({ admin: true, person_id: "P2" }, new Set(["P2"]))(anna), "", "ich selbst → nichts");
assert.equal(rk({ admin: true, person_id: "P1" }, new Set(["P2"]))(undefined), "", "unbekannt → nichts");

assert.ok(fs.existsSync(new URL("../tools/hilfe/kartei-wege-browser.mjs", import.meta.url)), "Browser-Prüfung vorhanden");
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/kartei-wege.test.mjs"), "läuft in der CI");
console.log("kartei-wege: ok");
