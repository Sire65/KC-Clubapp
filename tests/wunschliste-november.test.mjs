// Wunschliste 01.11.2026 (2.799.0): #52 Grußformel, #59 Video-Verweis erst am Ende, #56 Runder Tisch wieder öffnen, #60 Runder Tisch einklappbar,
// #53 Schrift auf den Lamellen, #51 Protokoll „Info an Mitglieder“, #57 (Teil) Protokoll-Liste nach Jahren/Monaten. Aufruf: node tests/wunschliste-november.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
import { rtGastgeberPruefen } from "../supabase/functions/kc-club/runder-tisch.js";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), html = lies("index.html"), server = lies("supabase/functions/kc-club/index.ts");
// #52 Grußformel: ✍️ in der kleinen Zeile, vier Formeln mit eigenem Vornamen, eingesetzt an der Schreibstelle
const griffe = html.slice(html.indexOf('<div class="eg-griffe">'), html.indexOf("</div>", html.indexOf('<div class="eg-griffe">')));
assert.ok(griffe.includes('id="grussKnopf"') && griffe.includes('onclick="grussUmschalten()"'), "✍️ in der kleinen Zeile");
assert.ok(html.includes('<div class="gruss-leiste versteckt" id="grussListe"'));
assert.ok(app.includes('const GRUSS_FORMELN = ["Danke und Gruß", "Liebe Grüße", "Bis bald mal wieder", "Freundliche Grüße"];'));
assert.ok(app.includes('t.dispatchEvent(new Event("input", { bubbles: true }))'), "wie getippt (Entwurf, Höhe, ✕)");
// #59 Verweis: unterwegs nur merken, auf der Schlusskarte anbieten
assert.ok(app.includes("RGV.gefragt.add(id); RG.verweise = [...(RG.verweise || []), id];\n  return false;"), "kein Halt mitten im Video");
assert.ok(app.includes("${rgVerweiseHtml()}${rgNaechstesHtml()}"), "Verweis auf der Schlusskarte");
assert.ok(app.includes("RG.verweise = []; // 2.799.0"), "je Video neu");
// #56 Wieder öffnen: Regel rein geprüft
const jetzt = Date.parse("2026-11-01T18:00:00Z"), vorbei = { status: "geplant", beginn: "2026-11-01T15:00:00Z", dauer_min: 60, verlaengert_min: 0 };
assert.equal(rtGastgeberPruefen(vorbei, "wieder", jetzt, true), null);
assert.match(rtGastgeberPruefen({ ...vorbei, art: "seminar" }, "wieder", jetzt, true), /Seminar/);
assert.match(rtGastgeberPruefen({ ...vorbei, text_geloescht_am: "2026-11-01" }, "wieder", jetzt, true), /gelöscht/);
assert.match(rtGastgeberPruefen({ ...vorbei, beginn: "2026-11-01T17:30:00Z" }, "wieder", jetzt, true), /erst, wenn der Tisch vorbei ist/);
assert.match(rtGastgeberPruefen(vorbei, "wieder", jetzt, false), /Das darf nur/);
assert.ok(server.includes('else if (aktion === "wieder") {') && server.includes("const von = t, bis = t + (Number(x.dauer_min) || RT.dauern[0]) * 60000, zl = await rtZeitLage(ich, von, bis, x.id);"), "Zeitcheck beim Wieder öffnen");
assert.ok(app.includes("rundLeiten(${id}, 'wieder')`, \"🔁 Wieder öffnen\""));
// #60 einklappbar: Demnächst je Woche, Vorbei je Monat
assert.ok(app.includes('rundGruppenHtml(bald, "woche")') && app.includes('rundGruppenHtml(vorbei, "monat")'));
// #53 Lamellen: 15 Zeichen mittig auf 28 Lamellen
assert.ok(app.includes('const BU_SCHRANK_SCHRIFT = "Köcheclub Werne";') && app.includes("ab = Math.floor((BU_SCHRANK_LAMELLEN - w.length) / 2)"));
// #51 Info an Mitglieder: im Entwurf ausgegraut, Server nur bei veröffentlicht, nur an Protokoll-Leser, Bremse
assert.ok(app.includes('<button class="knopf" disabled title="Geht erst, wenn das Protokoll veröffentlicht ist">📣 Info an Mitglieder</button>'));
assert.ok(server.includes('if (pr.status !== "veroeffentlicht") throw new Fehler("Die Info geht erst, wenn das Protokoll veröffentlicht ist.", 409);'));
assert.ok(server.includes("filter((id) => leser.has(id) && id !== ich.person_id)") && server.includes('if ((count ?? 0) > 3) throw new Fehler("Zu diesem Protokoll gingen gerade schon mehrere Infos raus'));
assert.ok(app.includes('if (!(await frage(`📣 Info jetzt an ${an.length}'), "erst nach Bestätigung");
// #57 (Teil) Gruppen in der Protokoll-Liste
assert.ok(app.includes('data-klappe="pr_jahr_${esc(j)}"') && app.includes('document.querySelectorAll("#protokollListe .pr-monat, #protokollListe .pr-jahr")'));
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/wunschliste-november.test.mjs"), "läuft in der CI");
console.log("wunschliste-november: ok");
