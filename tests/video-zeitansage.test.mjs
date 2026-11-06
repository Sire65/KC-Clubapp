// KC-CLUB-VIDEO-ZEITANSAGE (2.854.0, Wunsch Hansi 04.11.2026): geprüfte Erklär-Videos beginnen mit „Hallo <Vorname>! Dieses Video dauert etwa … Minuten.“
// Je Video ein Merkmal zeit: "<Prüfdatum>" in RUNDGAENGE (eins nach dem anderen geprüft). Aufruf: node tests/video-zeitansage.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { programmText } from "./programm.mjs";
const app = programmText(), v = readFileSync(new URL("../teile/videos.js", import.meta.url), "utf8");
const f0 = v.indexOf("const RG_ZAHLWORT"), code = v.slice(f0, v.indexOf("const rgOhneMin", f0));
const { rgDauerSprech, rgZeitAnsageDazu } = new Function("ICH", "rgDauerSek", "rgText", code + "\nreturn { rgDauerSprech, rgZeitAnsageDazu };")(
  { vorname: "Hansi" }, () => 235, (s) => (typeof s.x === "function" ? s.x() : s.x));
assert.equal(rgDauerSprech(0), ""); assert.equal(rgDauerSprech(40), "knapp eine Minute"); assert.equal(rgDauerSprech(60), "etwa eine Minute");
assert.equal(rgDauerSprech(90), "etwa anderthalb Minuten"); assert.equal(rgDauerSprech(150), "etwa zweieinhalb Minuten"); assert.equal(rgDauerSprech(240), "etwa vier Minuten");
assert.equal(rgDauerSprech(900), "etwa 15 Minuten");
const st = [{ nur: () => false, x: "nur einfach" }, { x: "Schön, dass du da bist!" }, { x: "zwei" }];
const neu = rgZeitAnsageDazu(st, {});
assert.equal(neu[1].x(), "Hallo Hansi! Dieses Video dauert etwa vier Minuten. Schön, dass du da bist!", "nach dem Hallo, im ersten sichtbaren Schritt");
assert.equal(st[1].x, "Schön, dass du da bist!", "Original bleibt unverändert"); assert.equal(neu[2], st[2]);
assert.ok(/if \(tour\.zeit && !\(startI \| 0\)\) RG\.st = rgZeitAnsageDazu\(RG\.st, tour\);/.test(v), "nur geprüfte Videos, nur beim Start von vorn");
// geprüfte Videos: Text nennt keine feste Dauer mehr (sonst doppelt / veraltet)
const R = app.slice(app.indexOf("const RUNDGAENGE = ["), app.indexOf("\n];", app.indexOf("const RUNDGAENGE = [")));
const geprueft = [...R.matchAll(/\{ id: "([a-z_0-9]+)", stand: "\d+", zeit: "(\d\d\.\d\d\.\d{4})"/g)].map((m) => m[1]);
assert.ok(geprueft.includes("warum"), "„Warum diese App?“ ist geprüft");
for (const id of geprueft) {
  const name = (R.match(new RegExp(`id: "${id}"[^\\n]*st: \\(\\) => (RG_[A-Z_0-9]+|RUNDGANG)\\b`)) || [])[1]; assert.ok(name, "Schritte von " + id);
  const s0 = v.indexOf(`const ${name} = [`), schritte = v.slice(s0, v.indexOf("\n];", s0));
  assert.ok(!/In (ein|zwei|drei|vier|fünf|ein paar|\d+) Minuten/i.test(schritte), `${id}: keine feste Minutenzahl mehr im Text`);
}
// 2.868.0: „Weiteres Gerät“ Schritt 2 öffnet die Seite „App-Installation“ über rgAuf (vorher wurde er still übersprungen)
{ assert.ok(/sel: \['#v-einstellungen \[onclick="kurzcodeBlatt\(\)"\]'\], mussSel: true/.test(v) && /vor: \(\) => \{ rgSimWeg\(\); rgAuf\("install"\); \}/.test(v), "inst_geraet: Code-Knopf über rgAuf erreichbar"); }
console.log(`video-zeitansage: alle Prüfungen bestanden (${geprueft.length} Video${geprueft.length === 1 ? "" : "s"} geprüft)`);
