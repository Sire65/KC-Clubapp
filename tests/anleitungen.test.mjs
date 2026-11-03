// KC-CLUB-ANLEITUNGEN (Wunschliste #68), 2.822.0. Aufruf: node tests/anleitungen.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), bu = lies("teile/buero.js"), server = lies("supabase/functions/kc-club/index.ts");
// #68 eingebaute Blätter: Liste + PDFs vorhanden, aus den App-Texten erzeugt
const liste = JSON.parse(lies("dokumente/anleitungen/liste.json"));
assert.ok(liste.blaetter.length >= 8, "mindestens 8 Blätter");
for (const b of liste.blaetter) { assert.ok(fs.existsSync(new URL("../dokumente/anleitungen/" + b.datei, import.meta.url)), "PDF fehlt: " + b.datei); assert.match(b.datei, /^[a-z0-9-]+\.pdf$/); }
for (const n of ["Chrome", "Samsung", "Edge", "Firefox", "Opera", "iPhone"]) assert.ok(liste.blaetter.some((b) => b.register === "Installieren" && b.titel.includes(n)), "Installieren: " + n);
assert.ok(lies("tools/anleitungen-pdf.mjs").includes("einrichtenSchritteRoh(g, S)"), "Blätter aus den Texten der App");
// einheitliches Design: jedes Blatt mit Zweck und „Gut zu wissen“, Fußzeile links Köcheclub Werne, Mitte Seite x/y, rechts Autor (Wunsch Hansi 02.11.2026)
const gen = lies("tools/anleitungen-pdf.mjs"), blk = gen.slice(gen.indexOf("const BLAETTER = ["), gen.indexOf("];", gen.indexOf("const BLAETTER = [")));
assert.equal((blk.match(/\{ id: "/g) || []).length, (blk.match(/zweck: "/g) || []).length, "jedes Blatt hat „Darum geht's“");
assert.equal((blk.match(/\{ id: "/g) || []).length, (blk.match(/gut: "/g) || []).length, "jedes Blatt hat „Gut zu wissen“");
assert.ok(gen.includes('const AUTOR = "Hans-Joachim Koch";') && gen.includes('>Köcheclub Werne</span>') && gen.includes('Seite <span class="pageNumber"></span>/<span class="totalPages"></span>') && gen.includes("Autor: ${AUTOR}"), "Fußzeile");
assert.ok(gen.includes("displayHeaderFooter: true"), "Fußzeile auf jeder Seite");
// automatisch aktuell: beim Veröffentlichen neu erzeugt (Fehler hält das Veröffentlichen nicht auf), Version und Stand im Kopf
const wf = lies(".github/workflows/seite-veroeffentlichen.yml");
assert.ok(wf.indexOf("node tools/anleitungen-pdf.mjs") > 0 && wf.indexOf("node tools/anleitungen-pdf.mjs") < wf.indexOf("jekyll-build-pages"), "vor dem Bauen neu erzeugt");
assert.ok(/name: Anleitungen neu erzeugen\n\s+continue-on-error: true/.test(wf), "Fehler hält das Veröffentlichen nicht auf");
assert.ok(gen.includes('<div class="stand">Version ${esc(version)}<br>Stand ${stand}</div>'), "Version im Kopf");
// Ordner nur Clubleitung, Wege, Name bei einer Person
assert.ok(bu.includes('{ id: "anleitungen", sym: "📚", t: "Anleitungen", farbe: "#4f6d7a", fn: "anlStart()", recht: "L" }'));
assert.ok(bu.includes('const ANL_WEGE = [["mail", "✉️", "E-Mail mit Anhang"], ["eingang", "📥", "In den Eingangskorb"], ["push", "🔔", "Benachrichtigung mit Link"], ["wa", "🟢", "WhatsApp"], ["druck", "🖨️", "Drucken"]];'));
assert.ok(bu.includes('x.art === "blatt" || !["push", "wa"].includes(w)'), "Link-Wege nur für eingebaute Blätter");
assert.ok(bu.includes("return vn ? t.replace(/^Hallo\\s*,/, `Hallo ${vn},`) : t;"), "Vorname bei einer Person");
// Server: nur Clubleitung, nur Blätter der App, Bremse
const sv = server.slice(server.indexOf('case "anleitung_senden"'), server.indexOf('case "protokoll_info"'));
assert.ok(sv.includes("nurLeitung(ich);") && sv.includes('const basis = APP_URL + "dokumente/anleitungen/"') && sv.includes("if ((count ?? 0) > 3)"));
assert.match(lies("supabase/migrations/20261102_kc_club_ordner_anleitungen.sql"), /'Anleitungen', 3, array\['Push & E-Mail', 'Installieren', 'Link & Anmelden', 'Sonstiges'\], true/);
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/anleitungen.test.mjs"), "läuft in der CI");


// KC-CLUB-ANLAGE-UEBER-FENSTER (Fund Hansi 02.11.2026): Anlage aus offenem Fenster (z. B. Abstimmung) liegt nicht dahinter, Zurück holt das Fenster wieder
assert.ok(/\.blatt:not\(\.versteckt\)"\)\]; offen\.forEach\(\(b\) => b\.classList\.add\("versteckt"\)\)/.test(app), "offene Fenster treten beiseite");
assert.ok(/function zeige\(v, ausHistorie\) \{\n  if \(v !== "dokansicht" && DOKA\.zurueck\) dokFensterZurueck\(\);/.test(app), "zeige() holt die Fenster zurück");
assert.equal((app.match(/blattAuf\("anlBlatt"/g) || []).length, 1, "anlBlatt nur einmal vergeben");
// 2.833.0 KC-CLUB-ANLEITUNG-VERTRETUNG (Wunsch Hansi 03.11.2026): Blatt „Für ein anderes Mitglied handeln“ im Register Sonstiges
assert.ok(liste.blaetter.some((b) => b.id === "fuer-andere-handeln" && b.register === "Sonstiges"), "Blatt Vertretung");
assert.ok(gen.includes('hilfeVertretung: ["vertretung"].map(hilfe)') && gen.includes("vtAdminKarte({ person_id:"), "Text aus der App");
console.log("anleitungen: ok");
