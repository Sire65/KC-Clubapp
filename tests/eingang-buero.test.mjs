// KC-CLUB-EINGANG-BUERO (30.10.2026, Wunsch Hansi „im Eingangskorb z. B. eine Preisliste – als Ablageort auch einen Ordner aus dem Büro wählen,
// z. B. Weihnachtsmarkt“). Aufruf: node tests/eingang-buero.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), server = lies("supabase/functions/kc-club/index.ts");

// App: Büro-Ordner nur für die Archiv-Pflege, „nur Vorstand“ nur für den Vorstand; zwei Gruppen im Auswahlfeld; Hinweis, dass es dann im Büro liegt
const w = app.slice(app.indexOf("function arWohin(x, o, fertig)"), app.indexOf("async function arEinreichungZurueck"));
assert.match(w, /const buero = AR\.daten\.darf \? \(AR\.daten\.ordner \|\| \[\]\)\.filter\(\(y\) => !y\.besitzer && !y\.geloescht_am && \(!y\.nur_vorstand \|\| AR\.daten\.vorstand\)\)/);
assert.match(w, /<optgroup label="👤 Meine Ordner">\$\{eigene\.map\(opt\)\.join\(""\)\}<\/optgroup><optgroup label="🏢 Büro">\$\{buero\.map\(opt\)\.join\(""\)\}<\/optgroup>/);
assert.match(w, /const regOpt = \(oid, wahl\) => \(\(alle\.find\(\(y\) => y\.id === oid\) \|\| o\)\.register/, "Register des gewählten Büro-Ordners");
assert.match(w, /🏢 Liegt dann im Büro/);
assert.match(w, /api\("archiv_pruefung", \{ id: x\.id, annehmen: true, ordner_id, register \}\)/);

// gleiche Auswahl wie die App, nachgebaut
const wahl = (daten) => daten.darf ? daten.ordner.filter((y) => !y.besitzer && !y.geloescht_am && (!y.nur_vorstand || daten.vorstand)).map((y) => y.titel) : [];
const ordner = [{ titel: "Weihnachtsmarkt", nur_vorstand: true }, { titel: "Rezepte", nur_vorstand: false }, { titel: "Alt", geloescht_am: "x" }, { titel: "Hansi", besitzer: "P1" }];
assert.deepEqual(wahl({ darf: true, vorstand: true, ordner }), ["Weihnachtsmarkt", "Rezepte"]);
assert.deepEqual(wahl({ darf: true, vorstand: false, ordner }), ["Rezepte"], "nur Vorstand bleibt verborgen");
assert.deepEqual(wahl({ darf: false, vorstand: true, ordner }), [], "ohne Archiv-Pflege keine Büro-Ordner");

// Server: Büro-Ordner nur mit Archiv-Pflege + Sichtrecht; Verschieben zwischen persönlich und Verein bleibt sonst verboten
const pr = server.slice(server.indexOf('case "archiv_pruefung":'), server.indexOf('case "archiv_pruefung":') + 4000);
assert.match(pr, /const buero = !!zo && !zo\.besitzer && darfArchivPflegen\(ich\) && darfOrdnerSehen\(ich, zo\);/);
assert.match(pr, /if \(!zo \|\| \(zo\.besitzer !== ich\.person_id && !buero\) \|\| zo\.geloescht_am\) throw/);
assert.match(pr, /select\("id,register,besitzer,geloescht_am,nur_vorstand"\)/, "nur_vorstand wird für die Prüfung gelesen");
assert.match(server, /nie zwischen persönlichem und Vereins-Archiv \(oder fremden Ordnern\) verschieben/, "archiv_aendern unverändert");
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/eingang-buero.test.mjs"), "läuft in der CI");
console.log("eingang-buero: ok");
