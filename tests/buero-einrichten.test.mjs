// KC-CLUB-BUERO-EINRICHTEN (2.840.0, Wunschliste #77): Schreibtisch-Teile verschieben/tauschen, Katalog (max. 4), gespeichert je Person.
// Aufruf: node tests/buero-einrichten.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const b = readFileSync(new URL("../teile/buero.js", import.meta.url), "utf8"), srv = readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8"), html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
// Server: Einstellung nur mit kurzen Kennungen, höchstens 4 Teile
const e0 = srv.indexOf("  buero_einrichtung: (w) => ({"), ecode = srv.slice(e0, srv.indexOf("\n  }),", e0) + 6);
const pruef = new Function("return {" + ecode.replace(/\(x: unknown\)/g, "(x)") + "}")().buero_einrichtung;
const w = pruef({ plaetze: { rechner: "lampe", "<b>": "x1", uhr: "x1; drop", lampe: 5 }, dinge: ["uhr", "uhr", "rolodex", "a", "b", "c", "<x>"] });
assert.deepEqual(w.plaetze, { rechner: "lampe" }, "nur gültige Kennungen");
assert.deepEqual(w.dinge, ["uhr", "rolodex", "a", "b"], "doppelt raus, höchstens 4");
assert.deepEqual(pruef(null), { plaetze: {}, dinge: [] }, "leer ist erlaubt");
// App: Plätze verteilen (gewünscht → Grundplatz → freier Zusatzplatz), nie doppelt
const r0 = b.indexOf("function buePlaetzeRechnen("), rcode = b.slice(r0, b.indexOf("\nfunction bueVerteilen", r0));
const rechne = new Function("BUE_EXTRA", rcode + "\nreturn buePlaetzeRechnen;")(["x1", "x2", "x3", "x4"]);
const frei = ["lampe", "monitor", "rechner", "x1", "x2", "x3", "x4"];
const p = rechne(["lampe", "monitor", "rechner", "uhr"], frei, { rechner: "lampe", lampe: "lampe", monitor: "gibtsnicht", uhr: "x3" });
assert.deepEqual(p, { lampe: "lampe", monitor: "monitor", rechner: "rechner", uhr: "x3" }, "erster Wunsch gewinnt, Rest auf den eigenen Grundplatz");
assert.deepEqual(rechne(["lampe", "rechner"], frei, { lampe: "rechner", rechner: "rechner" }), { lampe: "rechner", rechner: "x1" }, "Grundplatz besetzt → freier Zusatzplatz");
assert.equal(new Set(Object.values(p)).size, 4, "kein Platz doppelt");
assert.deepEqual(rechne(["lampe", "rechner"], frei, { lampe: "rechner", rechner: "lampe" }), { lampe: "rechner", rechner: "lampe" }, "Tausch");
// Katalog: Registry, Rechte, höchstens 4
assert.ok(/const BUE_EXTRA = \["x1", "x2", "x3", "x4"\], BUE_MAX = BUE_EXTRA\.length;/.test(b), "4 Zusatzplätze");
for (const id of ["uhr", "rolodex", "kopierer", "pflanze", "foto", "locher"]) assert.ok(new RegExp(`\\{ id: "${id}", t: `).test(b), "Katalog: " + id);
assert.ok(/\{ id: "rolodex"[^\n]*recht: "L", fn: \(\) => "adbStart\(\)"/.test(b), "Adressregister nur Clubleitung (wie das Adressbuch)");
assert.ok(/fn: \(S\) => \(S \? "buEinlesen\(\)" : "buDrucker\(\)"\)/.test(b), "Kopierer: Einlesen nur mit Schreibrecht");
assert.ok(/else if \(BUE\.dinge\.length < BUE_MAX\)/.test(b), "nie mehr als 4");
// Einrichten: Antippen öffnet nichts, Ziehen und Tippen tauschen, Fertig speichert je Person
assert.ok(/pl\.addEventListener\("click", \(e\) => \{[^]{0,120}if \(!BUE\.an\) return; e\.preventDefault\(\); e\.stopPropagation\(\);[^]{0,200}\}, true\);/.test(b), "beim Einrichten öffnet nichts");
assert.ok(/await einstSpeichern\("buero_einrichtung", wert\)/.test(b), "gespeichert als Einstellung (alle Geräte)");
assert.ok(/raum \? buIkon\("✏️", "Einrichten", "bueStart\(\)"/.test(b), "Knopf in der Büro-Kopfreihe");
// Gestaltung: Zusatzreihe in allen vier Rastern
assert.equal((html.match(/\.bu-extra \{ grid-template-areas: [^}]*"x1 x2 x3 x4"/g) || []).length + (html.match(/\.bu-extra \{ grid-template-areas: [^}]*"\. x1 x2 x3 x4 \."/g) || []).length, 4, "Zusatzreihe Handy/PC, Leitung/Mitglied");
assert.ok(/@media \(prefers-reduced-motion: reduce\) \{ \.bu-einrichten \[data-ding\] \{ animation: none; \} \}/.test(html), "kein Wackeln bei „Bewegung verringern“");
assert.ok(/\.bu-einrichten \[data-ding\] \{[^}]*touch-action: none/.test(html), "Ziehen mit dem Finger scrollt nicht die Seite");
assert.ok(/\{ id: "buero_einrichten", thema: "club"/.test(app), "Hilfe-Eintrag");
console.log("buero-einrichten: alle Prüfungen bestanden");
