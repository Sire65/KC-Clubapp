// KC-CLUB-LESE-SCHREIBTEST (16.11.2026, Wunsch Hansi „LEDs antippen … ein Testbutton, der Lese- und Schreibtest macht“ – „bauen, für alle, mit Push-Test,
// (Admin) mit Neon“). Aufruf: node tests/lese-schreibtest.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), srv = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const c = srv.slice(srv.indexOf('case "rw_test": {'), srv.indexOf('case "push_test": {'));
assert.ok(c.length > 200, "Server-Aktion da");
assert.ok(/upsert\(\{ person_id: ich\.person_id, schluessel: "rw_test", wert: \{ z, am: jetzt\(\) \}/.test(c), "schreibt nur einen eigenen Testeintrag");
assert.ok(c.includes('if (data?.wert?.z !== z) throw new Error("Gelesener Wert passt nicht zum geschriebenen");'), "liest zurück und vergleicht");
assert.ok(c.includes('.delete().eq("person_id", ich.person_id).eq("schluessel", "rw_test")'), "räumt auf");
assert.ok(c.includes("if (ich.nurLesen)"), "Nur-Lese-Zugang schreibt nicht");
assert.ok(c.includes('if (p.push !== false) await schritt("push"') && c.includes('routerSenden("club_nachricht_push", [ich.person_id]'), "Test-Push nur an mich");
assert.ok(c.includes('if (p.neon && ich.admin) await schritt("neon"') && c.includes("neonVerbrauch()") && !/new Client|postgres\(/.test(c), "Neon nur für Admin, ohne die Spiegel-Datenbank zu wecken");
assert.ok(srv.includes("const RW_NEON_MAX_STD = 10;"), "Spiegelung höchstens 10 Std. alt");
assert.ok(/"push_test", "rw_test",/.test(srv) && /"push_test", "rw_test",/.test(app), "für alle freigegeben (App und Server gleich)");
// App: Knopf in beiden Fenstern, Ergebnis im Bericht
assert.ok(app.includes("api(\"rw_test\", { push: true, neon: !!ICH?.admin })"), "App fragt Neon nur als Admin");
const einfach = app.slice(app.indexOf("function vbEinfachZeigen()"), app.indexOf("async function communicatorPruefen()"));
const gross = app.slice(app.indexOf("function vbBlattZeigen()"), app.indexOf("async function verbindungTesten()"));
assert.ok(einfach.includes("${rwKnopfHtml()}") && gross.includes("${rwKnopfHtml()}"), "Knopf für Mitglieder und Admin");
assert.ok(app.includes('["Lese- und Schreibtest", rwBerichtWert()]'), "geht mit „An Admin senden“ und Ausdruck mit");
// Anzeige nachspielen
const esc = (s) => String(s).replace(/[&<>"]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[x]);
const rwHtml = new Function("esc", "zeitKurz", "RW_NAMEN", app.slice(app.indexOf("function rwHtml(r)"), app.indexOf("\n}\n", app.indexOf("function rwHtml(r)")) + 2) + "return rwHtml;")(esc, () => "21:30",
  { schreiben: "✍️ Schreiben", lesen: "📖 Lesen und vergleichen", aufraeumen: "🧹 Aufräumen", push: "🔔 Test-Push an dich", neon: "🗄️ Sicherungskopie (Neon)" });
const gut = rwHtml({ ok: true, zeit: "x", schritte: [{ k: "schreiben", ok: true, ms: 38 }, { k: "lesen", ok: true, ms: 12 }, { k: "aufraeumen", ok: true, ms: 9 }, { k: "push", ok: true, ms: 400, info: "an 4 Geräte" }] });
assert.ok(gut.includes("✅ Alles in Ordnung") && gut.includes("38 ms") && gut.includes("an 4 Geräte") && gut.includes("<b>einmal</b>"));
const schlecht = rwHtml({ ok: false, zeit: "x", schritte: [{ k: "schreiben", ok: false, ms: 5, info: "permission denied <x>" }] });
assert.ok(schlecht.includes("⚠️ Nicht alles in Ordnung") && schlecht.includes("rw-nein") && schlecht.includes("&lt;x&gt;"), "Fehler rot, maskiert");
assert.match(html, /\.rw-nein \{ color: var\(--rot\);/);
console.log("✅ lese-schreibtest: alle Prüfungen bestanden");
