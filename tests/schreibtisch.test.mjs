// KC-CLUB-BUERO-SCHREIBTISCH + KC-CLUB-RECHNER (2.811.0, 02.11.2026, Wunschliste #48). Aufruf: node tests/schreibtisch.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), html = lies("index.html"), bu = lies("teile/buero.js"), re = lies("teile/rechner.js");
// Schreibtisch: Pinnwand mit den 2 Zetteln, gezeichnete Dinge mit eigenen Wegen
assert.ok(bu.includes('<div class="bu-pinnwand" aria-label="Pinnwand">') && bu.includes('<div class="bu-zettelreihe">'), "Pinnwand mit 2 Pins");
for (const [d, fn] of [["tastatur", "buNachricht()"], ["telefon", "buTelefon()"], ["handy", "buHandy()"], ["rechner", "rechnerOeffnen()"], ["fueller", "buFueller()"], ["korb", "buEingang()"]])
  assert.ok(new RegExp(`ding\\("${d}", BU_SVG\\.${d}, "[^"]+", "${fn.replace(/[()]/g, "\\$&")}"`).test(bu), `${d} → ${fn}`);
assert.ok(bu.includes('onclick="buAnsichtWechseln()" aria-label="Bildschirm – Büro als Liste öffnen"'), "Bildschirm öffnet die Büro-Liste");
assert.ok(bu.includes('const auf = (INIT?.meineAufgaben || []).length;') && bu.includes("📅 ${esc(naechst.titel || \"Sitzung\")}"), "Bildschirm ohne neue Abfrage");
assert.ok(bu.includes('function buLampe() { const n = !istNacht(); modusWaehlen(n ? "nacht" : "tag");'), "Lampe schaltet Tag/Nacht von Hand");
assert.ok(bu.includes('if (w === "ton") anrufen(pid, false); else if (w === "video") anrufen(pid, true); else if (w === "wa") extern("whatsapp", handy);'), "Handy: App-Anruf, Video, WhatsApp");
assert.ok(!/\["👥", "Nachricht an Mitglieder"/.test(bu) && bu.includes('[L, "🪧", "Schild drucken", "Hinweis · Preisliste · Öffnungszeiten", "schStart()"]'), "Füller nur Handgeschriebenes, Schild beim Drucker");
assert.ok(html.includes('grid-template-areas: "lampe monitor monitor kalender" "korb monitor monitor drucker" "handy kaffee fueller telefon" "tastatur tastatur tastatur rechner";'));
// Rechner: eigener Teil, kein eval, Sprache, Sprachbefehl von überall
assert.ok(app.includes('rechner: { einstieg: ["rechnerOeffnen"], sri: "sha384-') && lies("sw.js").includes('"rechner"'));
assert.ok(!/\beval\(|new Function/.test(re), "kein eval");
assert.ok(app.includes('if (b.art === "rechnen") { sbStopp(); return rechnerOeffnen(b.was); }'));
const k = new Function(re.slice(re.indexOf("const RE_WORT"), re.indexOf("const reHuebsch")) + "; return { rechnerAusdruck, rechnerRechnen };")();
const r = (t, v = null) => k.rechnerRechnen(k.rechnerAusdruck(t, v));
assert.equal(r("rechne 5 x 22"), 110); assert.equal(r("rechne 5 mal 22"), 110); assert.equal(r("125 geteilt durch 4"), 31.25);
assert.equal(r("19 Prozent von 240"), 45.6); assert.equal(r("das Ergebnis plus 30", 110), 140); assert.equal(r("127,50 + 12,25"), 139.75);
assert.equal(r("1.250 mal 2"), 2500); assert.equal(r("fünf mal zwölf"), 60); assert.equal(r("(3+4)*2"), 14); assert.equal(r("was ist 7 minus 10"), -3);
assert.throws(() => k.rechnerRechnen("5 *"), "unvollständig");
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/schreibtisch.test.mjs"), "läuft in der CI");
console.log("schreibtisch: ok");
