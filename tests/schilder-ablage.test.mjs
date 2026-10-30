// KC-CLUB-SCHILDER-ABLAGE (2.777.0, 30.10.2026, Wunsch Hansi „Preisliste aus dem Eingangskorb in den Ordner Schilder“, Wahl „Ablage in der Druckerei“).
// Aufruf: node tests/schilder-ablage.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), mig = lies("supabase/migrations/20261030_kc_club_ordner_schilder.sql");
// Ordner: Club-Ordner (ohne Besitzer), nur Clubleitung, Register, nie doppelt
assert.match(mig, /'sonstiges', 2026, 'Schilder', 6, array\['Preislisten', 'Hinweise', 'Öffnungszeiten', 'Sonstiges'\], true,/);
assert.match(mig, /where not exists \(select 1 from public\.kc_club_archiv_ordner where titel = 'Schilder' and besitzer is null and geloescht_am is null\)/);
// Druckerei: Abschnitt, Dateien nur aus dem Club-Ordner „Schilder“, nur angenommene mit Datei; vorhandene Wege zum Ansehen/Drucken/Druckpaket
assert.match(app, /<h4 style="margin:14px 0 6px">📎 Abgelegte Dateien\$\{SDR\.dateien\?\.length \? ` \(\$\{SDR\.dateien\.length\}\)` : ""\}<\/h4>\$\{schDateienHtml\(\)\}/);
assert.match(app, /const ord = new Set\(\(r\.ordner \|\| \[\]\)\.filter\(\(o\) => !o\.besitzer && !o\.geloescht_am && o\.titel === SCH_ORDNER\)/);
assert.match(app, /\.filter\(\(d\) => ord\.has\(d\.ordner_id\) && d\.status === "ok" && d\.datei\)/);
assert.match(app, /function schDateiDrucken\(id\) \{ const x = schDatei\(id\); if \(x\) arDrucken\(x\); \}/);
assert.match(app, /if \(!SDR\.paket\.teile\.some\(\(t\) => t\.typ === "archiv" && t\.ref === x\.datei\)\) schPaketDazu\("archiv", x\.datei/, "➕ legt nur dazu");
assert.match(app, /Ablegen: 📥 Eingangskorb → ✔ Annehmen → 🏢 Büro → <b>Schilder<\/b>/, "Weg wird erklärt, solange nichts da ist");
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/schilder-ablage.test.mjs"), "läuft in der CI");
console.log("schilder-ablage: ok");
