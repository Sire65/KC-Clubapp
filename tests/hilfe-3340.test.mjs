// KC-CLUB-HILFE-3340 (Hansi 26.11.2026: „neue Kachel unter Meins, Erstattung, Parkausweis … die musst du noch mit rein nehmen“):
// Hilfe, Twinkey, Lupe und Erklär-Video zu 🚗 Fahrten & Abrechnung (KICC-F-114) und 🅿️ Parkausweis (KC-CLUB-PARKAUSWEIS).
// Aufruf: node tests/hilfe-3340.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const lies = (f) => readFileSync(new URL("../" + f, import.meta.url), "utf8");
const app = lies("app.js"), hilfe = lies("teile/hilfe.js"), videos = lies("teile/videos.js"), fahrten = lies("teile/fahrten.js");
const h0 = app.indexOf("const HILFE = ["), HILFE = app.slice(h0, app.indexOf("\n];", h0));
const zeile = (id) => HILFE.split("\n").find((z) => z.includes(`{ id: "${id}",`)) || "";
for (const id of ["fahrten", "parkausweis", "fahrten_leitung"]) assert.ok(/seit: "3\.34\.0"/.test(zeile(id)), `Hilfe ${id} mit seit 3.34.0`);
for (const id of ["fahrten", "parkausweis"]) assert.ok(!/nur: /.test(zeile(id)) && !/\bAdmin\b/.test(zeile(id)), `Hilfe ${id} für alle, ohne Admin`);
assert.ok(zeile("fahrten_leitung").includes("nur: () => !!(ICH?.vorstand || ICH?.admin)") && !/\bAdmin\b/.test(zeile("fahrten_leitung").replace(/ICH\?\.admin/g, "")), "Clubleitungs-Hilfe nur mit Rolle, ohne Admin-Text");
for (const k of ["🚗 Eigenes Auto", "🚶 Keine Fahrtkosten", "✅ Abrechnung einreichen", "🅿️ Parkausweis", "🚚 Auf- und Abbau", "🅿️ Parken in der Marktzeit", "Wunsch speichern", "📄 Liste für die Stadt drucken", "⚙️ Preis und Ausgabe ändern", "📋 Sammel-Freigabe", "🚗 Fahrtprofile", "🅿️ Parkausweise", "über 300 km"])
  assert.ok(fahrten.includes(k), "Beschriftung in teile/fahrten.js: " + k);
assert.ok(app.includes("🚗 Sammel-Freigabe") && lies("supabase/functions/kc-club/index.ts").length > 0, "Sammel-Freigabe auf der Erstattungsseite");
for (const id of ["fahrten", "parkausweis", "fahrten_leitung"]) assert.ok(hilfe.includes(`hzZuEintrag("h:${id}")`), "Lupe/Twinkey führt zu " + id);
const f0 = hilfe.indexOf("const TW_FAQ = ["), FAQ = hilfe.slice(f0, hilfe.indexOf("\n];", f0)), faq = (id) => FAQ.split("\n").find((z) => z.includes(`{ id: "${id}",`)) || "";
assert.ok(faq("fahrtkosten") && !/nur: /.test(faq("fahrtkosten")) && faq("parkausweis") && !/nur: /.test(faq("parkausweis")), "Twinkey-Fragen für alle");
assert.ok(faq("fahrten-freigeben").includes("nur: () => !!(ICH?.vorstand || ICH?.admin)"), "Twinkey Freigabe nur Clubleitung");
assert.ok(/\["parkausweis", "parkausweise", "parkplatz", "kennzeichen"/.test(hilfe), "Wortgruppe Parkausweis");
assert.ok(/\.\.\.\(ICH\?\.vorstand \|\| ICH\?\.admin \? \[\["✅", "Sammel-Freigabe Fahrtkosten/.test(hilfe), "Lupe: Sammel-Freigabe nur Clubleitung");
const er0 = videos.indexOf("const RG_ERSTATTUNG = ["), ER = videos.slice(er0, videos.indexOf("\n];", er0));
assert.ok(/Fahrten und Abrechnung/.test(ER) && /Parkausweis/.test(ER) && /\{ id: "erstattung", stand: "2"/.test(app), "Erstattungs-Video nennt Fahrten & Parkausweis, Fassung 2");
assert.ok(/"h:fahrten": \["erstattung"\]/.test(app), "Video-Verweis Fahrtkosten");
assert.ok(/zwei Sorten/.test(zeile("parkausweis")) && /2 € je Tag/.test(zeile("parkausweis")), "Hilfe nennt beide Sorten und den Preis (3.35.0)");
console.log("hilfe-3340: ok");
