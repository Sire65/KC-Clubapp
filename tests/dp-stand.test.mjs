// 3.19.0 KC-CLUB-DP-STAND (Wunschliste #102): Mein Dienst und Club → Dienstpläne zeigen, von wann der Dienstplan ist. Aufruf: node tests/dp-stand.test.mjs (offline)
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), html = lies("index.html"), server = lies("supabase/functions/kc-club/index.ts");
let ok = 0; const p = (b, t) => { assert.ok(b, t); ok++; };

// Server: mein_dienst liefert den Stand (letzte Veröffentlichung), wie „dienste“
const md = server.slice(server.indexOf('case "mein_dienst"'), server.indexOf("sonder: {", server.indexOf('case "mein_dienst"')));
p(/\{ data: sollLetzte \} = await db\.from\("kc_dp_plan_published"\)\.select\("published_at"\)\.eq\("org_id", ORG\)\.eq\("status", "published"\)\.order\("published_at", \{ ascending: false \}\)\.limit\(1\)/.test(md), "mein_dienst liest den letzten Veröffentlichungs-Zeitpunkt");
p(/stand: sollLetzte\?\.\[0\]\?\.published_at \?\? null/.test(md), "soll.stand wird geliefert");

// Client: eine Zeile für beide Stellen
p(/\$\{dpStandZeile\(so\.stand\)\}/.test(app), "Mein Dienst zeigt den Stand beim Sollplan");
p(/\$\("dpStandOben"\)/.test(app) && /<div id="dpStandOben"><\/div>\s*<div id="dpListe"><\/div>/.test(html), "Dienstpläne: Stand oben über der Liste");
p(/id="dpStand"/.test(html) && /Stand des Dienstplans: veröffentlicht/.test(app), "bisherige Stand-Zeile unten bleibt");

// Verhalten der Zeile
const code = app.match(/const dpStandZeile = \(stand\) => \{[\s\S]*?\n\};/)[0];
const ctx = { Date, Math, esc: (s) => String(s) };
vm.createContext(ctx); vm.runInContext(code + ";this.f=dpStandZeile;", ctx);
p(/Noch kein Dienstplan veröffentlicht/.test(ctx.f(null)), "ohne Stand: klarer Hinweis (nie wie OK)");
const frisch = ctx.f(new Date(Date.now() - 86400000).toISOString());
p(/Stand des Dienstplans: <b>/.test(frisch) && !/dp-stand-alt/.test(frisch) && !/⚠️/.test(frisch), "frischer Stand: normal");
const alt = ctx.f(new Date(Date.now() - 9 * 86400000).toISOString());
p(/dp-stand-alt/.test(alt) && /⚠️ vor 9 Tagen – vielleicht nicht mehr aktuell/.test(alt), "alter Stand (ab 7 Tagen) sichtbar markiert");
p(/\.dp-stand-alt \{[^}]*color:/.test(html), "Markierung hat eine Farbe");
console.log(`OK – dp-stand: ${ok} Prüfungen`);
