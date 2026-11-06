// KC-CLUB-MAGAZIN-GERUEST + KC-CLUB-WM-PROSPEKT (03.11.2026). Aufruf: node tests/magazin-geruest.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), teil = lies("teile/magazin.js"), server = lies("supabase/functions/kc-club/index.ts");
// nur Admin bis zur Freigabe
assert.ok(/magazin: \{ t: "📰 Club-Küche \(Magazin\)"[^}]*standard: "admin" \}/.test(server) && /wm_prospekt: \{ t: "🎄 Weihnachtsmarkt-Prospekt"[^}]*standard: "admin" \}/.test(server), "Freigabe-Schalter, Standard Admin");
assert.ok(app.includes('aktion: "magMenue()", nur: () => frei("magazin") }') && app.includes('aktion: "wmProspekt()", nur: () => frei("wm_prospekt") }'), "Kacheln nur mit Freigabe");
assert.ok(teil.includes('if (!frei("magazin")) return') && teil.includes('if (!frei("wm_prospekt")) return'));
// Gerüst: Titel, Kopf mit Ausgabe-Nr., Inhaltsverzeichnis mit Sprung, Rubriken, Impressum, Blättern
const f = new Function(teil.slice(teil.indexOf("const MAG_START"), teil.indexOf("const MAG_RUBRIKEN")) + "; return magNummer;")();
assert.equal(f(2027, 1), 1); assert.equal(f(2027, 2), 2); assert.equal(f(2027, 12), 12); assert.equal(f(2026, 12), 1, "vor dem Start: Nr. 1");
assert.ok(teil.includes("Ausgabe Nr. ${nr}") && teil.includes('class="mag-titelfoto"') && teil.includes('onclick="blGehe(${start + i})"') && teil.includes("§ Impressum"), "Titelblatt, Inhalt, Impressum");
for (const r of ["rezept", "backstube", "saison", "tipp", "rueckblick", "portraet", "termine", "hobby", "links"]) assert.ok(teil.includes(`{ id: "${r}"`), "Rubrik " + r);
assert.ok(teil.includes("blOeffnen(`📰 Club-Küche Nr.") && teil.includes("blOeffnen(`🎄 Weihnachtsmarkt-Prospekt"), "Blättern mit dem gemeinsamen Baustein");
assert.equal(new Function(teil.slice(teil.indexOf("const MAG_SAISON"), teil.indexOf("const MAG = {")) + "; return MAG_SAISON.length;")(), 12, "Saisonkalender für 12 Monate");
assert.ok(/prospekt\/i\.test\(x\.register/.test(teil), "Prospekt-Seiten aus dem Ordner Weihnachtsmarkt");
assert.ok(!/\|\|=/.test(teil));
console.log("magazin-geruest: ok");
