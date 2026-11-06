// KC-CLUB-MARIENKAEFER + KC-CLUB-GLUECKSKLEE (Wunsch Hansi 06.11.2026): 🐞 jeder 50. Start, 🍀 jeder 25. – immer nur eine Überraschung.
// Browser-Prüfung (abgeschirmt): tools/hilfe/glueck-browser.mjs. Aufruf: node tests/glueck.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { programmText } from "./programm.mjs";
const app = programmText(), srv = readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8"), teil = readFileSync(new URL("../teile/glueck.js", import.meta.url), "utf8"), sw = readFileSync(new URL("../sw.js", import.meta.url), "utf8");
// Server: Reihenfolge Keks > Käfer > Klee > Fee, gleicher Zähler
const m = /const kaefer = anmeldungen % 50 === 0, klee = !kaefer && anmeldungen % 25 === 0;\s*return json\(\{ ok: true, anmeldungen, kaefer, klee, fee: !kaefer && !klee && anmeldungen % 20 === 0 \}\);/.exec(srv);
assert.ok(m, "Server entscheidet: Käfer, sonst Klee, sonst Fee");
const wahl = (n) => { const kaefer = n % 50 === 0, klee = !kaefer && n % 25 === 0, fee = !kaefer && !klee && n % 20 === 0; return kaefer ? "kaefer" : klee ? "klee" : fee ? "fee" : "-"; };
assert.deepEqual([20, 25, 40, 50, 60, 75, 80, 100, 120, 125, 150, 200].map(wahl), ["fee", "klee", "fee", "kaefer", "fee", "klee", "fee", "kaefer", "fee", "klee", "kaefer", "kaefer"], "100. Start: nur der Käfer");
assert.ok(/fee: false, kaefer: false, klee: false, keks: \{ n: tage, von: von \|\| null \}/.test(srv), "Glückskeks geht vor");
// App: Aufruf, Teil, Einstellungen, Sprüche, Wege, Hilfe
assert.ok(/else if \(r\?\.kaefer\) setTimeout\(\(\) => kaeferKommt\(\), 1500\); else if \(r\?\.klee\) setTimeout\(\(\) => kleeKommt\(\), 1500\); else if \(r\?\.fee\)/.test(app), "App ruft Käfer bzw. Klee");
assert.ok(/glueck: \{ einstieg: \["kaeferKommt", "kleeKommt"\], sri: "sha384-/.test(app) && /glueck: "[A-Za-z0-9_-]{16}"/.test(sw), "eigener Programmteil, wird erst bei Bedarf geladen");
assert.ok(/id="setKaefer"[^>]*onchange="einstellung\('kaefer', this\.checked\)"/.test(html) && /id="setKlee"[^>]*onchange="einstellung\('klee', this\.checked\)"/.test(html) && /onclick="kaeferKommt\(true\)">🐞 Marienkäfer ansehen/.test(html) && /onclick="kleeKommt\(true\)">🍀 Kleeblatt ansehen/.test(html), "abschaltbar und ansehen (⚙️ → ✨ Effekte)");
assert.ok(/if \(vorschau !== true && !einst\(schluessel, true\)\) return false;/.test(teil) && /glAus\(\) \|\| document\.hidden \|\| aktuelleAnsicht !== "start" \|\| document\.querySelector\(FENSTER_OFFEN\)/.test(teil) && /prefers-reduced-motion: reduce/.test(teil), "nur auf der Startseite, nicht abgeschaltet, nicht bei weniger Bewegung");
assert.ok(/const KAEFER_SPRUECHE = \[/.test(app) && /const KLEE_SPRUECHE = \[/.test(app) && /kaeferBlatt: "🐞 Der Marienkäfer", kleeBlatt: "🍀 Der Glücksklee"/.test(app), "Sprüche und Fensternamen im Hauptprogramm");
assert.ok(/spur\("fenster", `\$\{id\}:\$\{nr\}`\)/.test(teil), "Wege: nur die Nummer des Spruchs");
const kennung = new RegExp(/const SPUR_KENNUNG = \/(.+)\/;/.exec(srv)[1]); assert.ok(kennung.test("kaeferBlatt:7") && kennung.test("kleeBlatt:14"), "Server nimmt die Kennungen");
assert.ok(/\{ id: "kaefer", thema: "darstellung", sym: "🐞"/.test(app) && /\{ id: "klee", thema: "darstellung", sym: "🍀"/.test(app), "Hilfe-Einträge");
// Ablauf: Käfer bleibt in der Mitte stehen, dreht sich zum Mitglied und lächelt; Klee: Windstoß, liegt, zweiter Windstoß
assert.ok(/mitte = \[bw \/ 2 - W \/ 2, Math\.round\(bh \* 0\.5\)\]/.test(teil) && /k\.classList\.add\("vorn", "lacht"\)/.test(teil), "Käfer: Mitte, Kopf zum Mitglied, Lächeln");
assert.ok(/glWindstoss\(0, bh \* 0\.4, true\)/.test(teil) && /glWindstoss\(landeY - 80, 160, true\)/.test(teil) && /liegen = 8000/.test(teil), "Klee: Windstoß, 8 s liegen, zweiter Windstoß");
assert.ok(!/api\(/.test(teil), "Glücksbringer speichern nichts");
console.log("glueck: alle Prüfungen bestanden");
