// KC-CLUB-ML-ALLE (27.10.2026, Wunsch Hansi „eine Übersicht aller Mitgliederdaten mit Telefon und Adresse“): statische Prüfung (offline).
// Aufruf: node tests/ml-alle-daten.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs"; // 2.727.0 KC-CLUB-TEILE: app.js + teile/*.js
const app = programmText();
assert.ok(/alle: \{ sym: "📋", t: "Alle Daten", u: "[^"]+", spalten: \["nr", "name", "handy", "festnetz", "mail", "adresse"\], quer: true \}/.test(app), "Art „Alle Daten“ mit allen Kontaktspalten, quer");
assert.ok(/\["telefon", "adressen", "alle"\]\.includes\(ML\.art\) \? `<p class="hinweis">🔒/.test(app), "Hinweis auf nicht freigegebene Angaben auch bei „Alle Daten“");
assert.ok(/const privat = \["telefon", "adressen", "alle"\]\.includes\(ML\.art\);/.test(app), "Fuß „Vertraulich“ auch bei „Alle Daten“");
assert.ok(/quer: !!a\.quer \};/.test(app), "Querformat wird an den Druck übergeben");
console.log("ml-alle-daten: alle Prüfungen bestanden");
