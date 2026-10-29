// KC-CLUB-NACHRICHTEN-REIHE (2.752.0, Wunsch Hansi 29.10.2026: „in den Balken rechts einen Pfeil nach oben und einen nach unten, um die Chats zu
// verschieben – damit ich z. B. die Einzelchats oben als erstes habe“). Verhaltensprüfung (offline). Aufruf: node tests/nachrichten-reihe.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), html = fs.readFileSync("index.html", "utf8");
const q = app.slice(app.indexOf("function uhgReihenfolge("), app.indexOf("function uhgVerschieben("));
const uhgReihenfolge = new Function(q + "; return uhgReihenfolge;")();
const ab = (k, rang) => ({ k, rang });
const art = [ab("gruppen", 0), ab("runden", 1), ab("einzel", 2)];
assert.deepEqual(uhgReihenfolge(art, []).map((g) => g.k), ["gruppen", "runden", "einzel"], "ohne Merker: übliche Reihenfolge");
assert.deepEqual(uhgReihenfolge(art, ["einzel", "gruppen", "runden"]).map((g) => g.k), ["einzel", "gruppen", "runden"], "Einzelchats zuerst (Hansis Beispiel)");
assert.deepEqual(uhgReihenfolge(art.slice(0, 2), ["einzel", "runden", "gruppen"]).map((g) => g.k), ["runden", "gruppen"], "fehlender Abschnitt stört nicht");
// Zeit: ein neuer Abschnitt (z. B. „Heute“) erscheint an seinem üblichen Platz, die gemerkten tauschen nur untereinander
const zeit = [ab("heute", 0), ab("woche", 2), ab("m202609", 101), ab("m202608", 102)];
assert.deepEqual(uhgReihenfolge(zeit, ["m202608", "woche", "m202609"]).map((g) => g.k), ["heute", "m202608", "woche", "m202609"], "neuer Abschnitt bleibt an seinem Platz, die gemerkten in gemerkter Reihenfolge");
// Einbau: Pfeile in jedem Balken (eigene Knöpfe, nicht im Klapp-Knopf), je Gerät gemerkt, Ungelesen bleibt oben, A–Z ohne Balken
assert.match(app, /const liste = uhgReihenfolge\(\[\.\.\.gruppen\.values\(\)\]\.sort\(\(x, y\) => x\.rang - y\.rang\), art === "name" \? \[\] : uhgReihe\(\)\[art\] \|\| \[\]\);/);
assert.match(app, /onclick="uhgVerschieben\('\$\{g\.k\}', -1\)" aria-label="\$\{esc\(g\.t\)\} nach oben"/); assert.match(app, /onclick="uhgVerschieben\('\$\{g\.k\}', 1\)" aria-label="\$\{esc\(g\.t\)\} nach unten"/);
assert.match(app, /<section class="uhg\$\{auf \? " auf" : ""\}\$\{pfeile \? " mit-pfeilen" : ""\}">\$\{pfeile\}<button type="button" class="uhg-kopf"/, "Pfeile neben (nicht in) dem Klapp-Knopf");
assert.match(app, /try \{ localStorage\.setItem\(UHG_REIHE, JSON\.stringify\(r\)\); \} catch \{\}/, "je Gerät gemerkt");
assert.match(app, /return wahl\(\) \+ neuTeil\(\) \+ liste\.map\(abschnitt\)\.join\(""\);/, "🔴 Ungelesen bleibt vor allen Abschnitten");
assert.match(html, /\.uhg-pfeile \{ position: absolute;/);
console.log("nachrichten-reihe: alle Prüfungen bestanden");
