// KC-CLUB-MAGAZIN-VORWORT + KC-CLUB-MAGAZIN-ARCHIV (Wunsch Hansi 07.11.2026): Vorwort mit festem Platz, alle Ausgaben als Kacheln, Drucken/Teilen/Ablegen, Startnachricht
import assert from "node:assert/strict";
import fs from "node:fs";
const m = fs.readFileSync("teile/magazin.js", "utf8"), app = fs.readFileSync("app.js", "utf8"), html = fs.readFileSync("index.html", "utf8");
// Vorwort: feste Seite 2 nach dem Titelblatt, im Inhaltsverzeichnis, Platzhalter ohne eigenes Vorwort; Nr. 1 hat eins
assert.ok(/register: "Vorwort", titel: "", html: magSeite\(`<h2 class="mag-h"><span>✒️<\/span> Vorwort<\/h2>\$\{heft\.vorwort \? magVorwortHtml\(heft\.vorwort\) : magPlatz\(/.test(m), "Vorwort-Seite");
assert.ok(m.indexOf('register: "Vorwort"') < m.indexOf('register: "Inhalt"') && /const start = 3; \/\/ 0 Titel, 1 Vorwort, 2 Inhalt/.test(m) && /onclick="blGehe\(1\)"><span class="mag-sym">✒️/.test(m), "Reihenfolge Titel, Vorwort, Inhalt");
assert.ok(/\["Titel", "Vorwort", "Inhalt", \.\.\.MAG_RUBRIKEN/.test(m), "Register im Blättern");
assert.ok(/vorwort: \{ anrede: "Liebe Köchinnen und Köche, liebe Mitglieder,"/.test(m) && /name: "Euer Hansi"/.test(m), "Vorwort Nr. 1");
assert.ok(!/Vorstand/.test(m.slice(m.indexOf("vorwort: {"), m.indexOf("schlagzeilen:"))), "kein „Vorstand“");
assert.ok(/const magFett = \(t\) => esc\(t\)\.replace/.test(m), "Vorwort nur als Text (escaped)");
// Erscheinen: Mitglieder nur Erschienenes, Admin alles
const erschienen = new Function("MAG_AUSGABEN", "heuteIso", m.match(/const magErschienen = (\(nr\) => \{[^\n]*\});/)[1].replace(/^/, "return "));
const AUS = { 1: { erscheint: "2027-01-01" }, 2: { schlagzeilen: [] } };
assert.equal(erschienen(AUS, () => "2026-12-31")(1), false); assert.equal(erschienen(AUS, () => "2027-01-01")(1), true); assert.equal(erschienen(AUS, () => "2030-01-01")(2), false);
assert.ok(/if \(!ICH\?\.admin && !magErschienen\(magNummer\(MAG\.jahr, MAG\.monat\)\)\)/.test(m), "Mitglieder sehen keine Entwürfe");
assert.ok(/erscheint: "2027-01-01"/.test(m), "Nr. 1 erscheint am 01.01.2027");
// Archiv: Kacheln, mindestens 12, Knöpfe
assert.ok(/bis = Math\.max\(12, magNeueste\(\), adm \? Math\.max\(\.\.\.Object\.keys\(MAG_AUSGABEN\)\.map\(Number\)\) : 0\)/.test(m) && /📚 Alle Ausgaben/.test(m) && /onclick="fensterZu\(\$\('magMenueBlatt'\)\);magArchiv\(\)"/.test(m), "Archiv im Menü, 12 Ausgaben (Admin: auch vorgebaute Entwürfe 2028, KC-CLUB-MAGAZIN-STAFFEL-2)");
assert.ok(/onclick="magDrucken\(\$\{nr\}\)"/.test(m) && /\$\{adm \? `<button class="knopf klein" onclick="magStartnachricht\(\$\{nr\}\)"/.test(m), "Drucken/Teilen für alle, Startnachricht nur Admin");
// Druck: gemeinsame Druckvorschau (CD), ohne Knöpfe/Platzhalter, Ablegen nur wo angeboten
assert.ok(/magazin: \{ ablegen: \{ register: \["Club-Magazin", "Club-Küche", "Sonstiges"\]/.test(app) && /bauen: \(o, p\) => magDruck\(p\)/.test(app), "Druckart magazin");
assert.ok(/replace\(\/<button\[\\s\\S\]\*\?<\\\/button>\/g, ""\)/.test(m), "keine Knöpfe im Ausdruck");
assert.ok(/id="druckVorschauAblegen" onclick="druckAblegen\(\)">🗄️ In meinem Ordner ablegen<\/button>/.test(html) && /\$\("druckVorschauAblegen"\)\?\.classList\.toggle\("versteckt", !DRUCKARTEN\[DRUCK\.art\]\?\.ablegen\)/.test(app), "Ablegen-Knopf nur bei passender Druckart");
assert.ok(/async function druckAblegen\(\) \{/.test(app) && /api\("archiv_hochladen", \{ ordner_id: o\.id, register, titel: DRUCK\.titel/.test(app), "Ablegen im eigenen Ordner");
// Startnachricht: vorbereiteter Text, Hinweis solange nur Admin
assert.ok(/await snStart\(\); const t = \$\("snText"\); if \(t\) \{ t\.value = text;/.test(m) && /if \(nurTest\("magazin"\) && !\(await frage\(/.test(m), "Startnachricht vorbereitet");
assert.ok(/"magArchiv", "magDruck"\]/.test(app), "Einstiege");
console.log("magazin-archiv: ok");
