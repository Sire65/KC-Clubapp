// KC-CLUB-VM-STIER (27.10.2026, Wunsch Hansi „Stier mit großen Hörnern und Ring durch die Nase, schnaubend – daraus wird der Username“): statische Prüfung (offline).
// Aufruf: node tests/vm-stier.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs"; // 2.726.0 KC-CLUB-TEILE: app.js + teile/*.js
const app = programmText();
assert.ok(/const JZB_VM_DAUER = 115;/.test(app) && /const JZB_VM_STIER = 87,/.test(app), "Stier nach Feierabend, Lauf 115 s");
const m = app.slice(app.indexOf("function jzbVmStierMalen("), app.indexOf("function jzbVmStierNameMalen("));
assert.ok(/Nasenring/.test(m) && /zwei große Hörner/.test(m) && /Nüstern \(geweitet beim Schnauben\)/.test(m), "Hörner, Nasenring, schnaubende Nüstern");
const n = app.slice(app.indexOf("function jzbVmStierNameMalen("), app.indexOf("function jzbVmPlatz("));
assert.ok(/const J = JZB, z = jzbWwNameText\(\)/.test(n), "Name wie bei der Friedenspfeife (Vorname, sonst „Köcheclub“)");
assert.ok(/const S = jzbVmStierLage\(t\);/.test(app) && /if \(t >= JZB_VM_STIER\) jzbVmStierNameMalen\(c, t, k, T, S, boden\);/.test(app), "in der Viehmarkt-Szene gemalt");
assert.ok(!/api\(/.test(m + n), "nur Bild, nichts gesendet");
console.log("vm-stier: alle Prüfungen bestanden");
