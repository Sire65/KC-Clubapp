// KICC-F-107: stabile Teilgrenzen der Frankfurt-Sicherung (supabase/functions/kc-club/fra-teile.js).
// Aufruf: node tests/fra-teile.test.mjs (offline)
import assert from "node:assert/strict";
import { fraTeileNeu, fraTeileStabil } from "../supabase/functions/kc-club/fra-teile.js";

const T = 100;
const zeile = (block, nr, l = 30) => ({ code: block * 65536 + nr, l });
const liste = [];
for (let b = 0; b < 10; b++) for (let n = 1; n <= 2; n++) liste.push(zeile(b, n));
// lückenlos: erster Teil ab 0, jeder endet, wo der nächste beginnt, letzter offen
const lueckenlos = (t) => t[0].block_von === 0 && t[t.length - 1].block_bis === null && t.every((x, i) => i === 0 || t[i - 1].block_bis === x.block_von) && t.every((x, i) => x.teil === i);
const zuordnen = (t, l) => l.map((z) => t.findIndex((x) => z.code >= x.block_von && (x.block_bis === null || z.code < x.block_bis)));

// 1) neu teilen wie bisher (höchstens T Byte je Teil, ganze Zeilen)
const neu = fraTeileNeu(liste, T);
assert.ok(lueckenlos(neu) && neu.length === 7, JSON.stringify(neu));
assert.ok(zuordnen(neu, liste).every((i) => i >= 0));
// 2) Vortag gleich → gleiche Grenzen
const g = neu.map((x) => x.block_von);
assert.deepEqual(fraTeileStabil(liste, g, T).teile, neu);
// 3) alte Zeile gelöscht + neue angehängt: alte Grenzen bleiben, nur das Ende wird neu geteilt
const morgen = liste.slice(1).concat([zeile(10, 1), zeile(10, 2), zeile(11, 1), zeile(11, 2)]);
const s = fraTeileStabil(morgen, g, T);
assert.ok(lueckenlos(s.teile));
assert.equal(s.uebernommen, g.length - 1);
assert.deepEqual(s.teile.slice(0, g.length - 1).map((x) => x.block_von), g.slice(0, -1));
assert.ok(zuordnen(s.teile, morgen).every((i) => i >= 0));
assert.ok(s.teile.length > neu.length);
// 4) Bereich zu groß geworden (Tabelle umgeschichtet) → ganz neu teilen
const dicht = liste.map((z, i) => ({ code: i, l: 30 }));
const d = fraTeileStabil(dicht, g, T);
assert.equal(d.uebernommen, 0);
assert.deepEqual(d.teile, fraTeileNeu(dicht, T));
// 5) keine/ungültige alten Grenzen → neu teilen
assert.equal(fraTeileStabil(liste, [], T).uebernommen, 0);
assert.equal(fraTeileStabil(liste, [5, 9], T).uebernommen, 0);
assert.equal(fraTeileStabil(liste, [0, 9, 9], T).uebernommen, 0);
// 6) leere Tabelle → ein offener Teil
assert.deepEqual(fraTeileNeu([], T), [{ teil: 0, block_von: 0, block_bis: null }]);
console.log("fra-teile: 6 Prüfungen ok");
