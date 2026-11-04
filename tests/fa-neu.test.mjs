// KC-CLUB-FA-NEU (2.855.0, Fund Hilfe-Nachtrag 6): „＋ Neu“ im Fotoalbum passt zum Modus (Fotos/Videos). Aufruf: node tests/fa-neu.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8"), html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(html.includes('<button class="knopf haupt klein" onclick="faNeu()">＋ Neu</button>') && !html.includes('onclick="fotoForm()">＋ Neu'), "Kopf-Knopf „＋ Neu“ ruft faNeu()");
const f = app.slice(app.indexOf("function faNeu() {"), app.indexOf("function faNeu() {") + 400);
assert.ok(/if \(VI\.art !== "videos"\) return fotoForm\(\);/.test(f) && /videoForm\(\);/.test(f) && /platz\?\.moeglich/.test(f), "Videos-Modus → Video-Formular (nur mit freiem Platz), sonst Fotos");
assert.ok(/function fotoForm\(\) \{\n  if \(VI\.art === "videos"\) faArt\("fotos"\);/.test(app), "Foto-Formular schaltet in den Foto-Modus (sonst unsichtbar wegen fa-aus)");
// Rosen-Karte (Admin) nennt die heutige Zeit (2.714.0: ≈ 5 s auf jeder Seite)
assert.ok(app.includes("Kommt nur einmal: nach etwa 5 Sekunden auf jeder Seite") && !app.includes("nach 20 Sekunden auf der Startseite"), "Rosen-Text aktuell");
// KC-CLUB-DREI-FELDER (2.855.0): die drei Felder im Kopf teilen sich die Breite fest – die Namen-Laufschrift schiebt „Clubtreffen“ nicht mehr hinaus
assert.ok(html.includes(".kacheln3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));") && html.includes(".kacheln3 > .mini { min-width: 0; }"), "drei Felder fest verteilt");
console.log("fa-neu: ok");
