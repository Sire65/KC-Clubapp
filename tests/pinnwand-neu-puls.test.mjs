// 2.763.0 KC-CLUB-PINNWAND-NEU-PULS (Wunsch Hansi 29.10.2026 „nur wenn seit letzter Anmeldung ein neues Post-it an der Pinnwand ist, lass den Button
// auffällig pulsieren und zeige die Anzahl an“ + „ja“ zu Hilfe-Aufrufen): Zahl = ungelesene fremde Zettel + offene Hilfe-Aufrufe; pulsiert nur dann.
import assert from "node:assert/strict";
import fs from "node:fs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), html = lies("index.html"), server = lies("supabase/functions/kc-club/index.ts");

// Server: stilles Laden markiert nichts, Anzahl aller ungelesenen
const pw = server.slice(server.indexOf('case "pinnwand": {'), server.indexOf('case "pinnwand_anheften"'));
assert.match(pw, /const markiert = p\.markieren !== false;\s+if \(fremd\.length && !ich\.nurLesen && markiert\) await db\.from\("kc_club_pinnwand_gelesen"\)\.upsert/, "nur echtes Öffnen = gesehen");
assert.match(pw, /return json\(\{ markiert, max: PINNWAND_MAX/, "App erfährt, ob markiert wurde");
const neu = server.slice(server.indexOf('case "pinnwand_neu": {'), server.indexOf('case "pinnwand_gesehen"'));
assert.ok(/return json\(\{ neu: \[\], anzahl: 0 \}\)/.test(neu) && /alleNeu = fremd\.filter\(\(z: any\) => !gesehen\.has\(z\.id\)\), neu = alleNeu\.slice\(0, 10\)/.test(neu) && /anzahl: alleNeu\.length/.test(neu), "Anzahl über alle ungelesenen");
assert.ok(!/upsert/.test(neu), "Nachsehen markiert nichts");

// App: Funktionen nachgebaut und durchgespielt
const block = app.slice(app.indexOf("function pwUebernehmen(r) {"), app.indexOf("// Aufrufe, auf die ich noch nicht geantwortet habe"));
const hilfe = app.slice(app.indexOf("const pwAufrufAnPinnwand"), app.indexOf("\n", app.indexOf("const pwHilfeNeu")));
let gezeichnet = 0; const gesendet = [];
const ctx = new Function("api", "kachelnZeigen", "hlVoll", "S", `let PW = S.PW, aktuelleAnsicht = "start", kaBearb = false;\n${block}\n${hilfe}\nreturn { pwUebernehmen, pwZahl, pwGesehenMelden, PW };`)(
  (a, d) => { gesendet.push([a, d]); return Promise.resolve({}); }, () => gezeichnet++, () => false, { PW: { zettel: [], offen: 0, neu: 0, hilfe: null } });
ctx.PW.neu = 3; ctx.pwUebernehmen({ markiert: false, zettel: [{ id: "a", vonMir: false }], hilfe: { aufrufe: [{ id: "h1" }, { id: "h2", eigen: true }, { id: "h3", meine: true }] } });
assert.equal(ctx.PW.offen, 4, "3 ungelesene Zettel + 1 offener Hilfe-Aufruf (eigene/beantwortete nicht)");
ctx.pwGesehenMelden(["x", "y"]); assert.equal(ctx.PW.neu, 1); assert.equal(ctx.PW.offen, 2); assert.deepEqual(gesendet.at(-1), ["pinnwand_gesehen", { ids: ["x", "y"] }]);
ctx.pwUebernehmen({ markiert: true, zettel: [{ id: "a", vonMir: false }, { id: "b", vonMir: false }], hilfe: { aufrufe: [] } });
assert.equal(ctx.PW.offen, 0, "Pinnwand geöffnet → nichts mehr neu, auch wenn Zettel hängen (vorher stand hier 2)");
ctx.pwGesehenMelden(["z", "z2"]); assert.equal(ctx.PW.neu, 0, "nie unter 0");
assert.ok(gezeichnet >= 3, "Kachel wird neu gezeichnet");

assert.match(app, /const rn = await api\("pinnwand_neu"\), n = rn\.neu \|\| \[\]; PW\.neu = rn\.anzahl \?\? n\.length;/, "beim Start: Anzahl (auch bei offener Begrüßung)");
assert.match(app, /const r = await api\("pinnwand", \{ markieren: false \}\); pwUebernehmen\(r\);/, "stilles Laden beim Start");
assert.match(app, /PW\.neu = r\.anzahl \?\? \(r\.neu \|\| \[\]\)\.length; if \(PW\.neu !== alt\) pwZahl\(\);/, "Live-Takt hält die Zahl aktuell");
assert.equal((app.match(/api\("pinnwand", \{ markieren: false \}\)/g) || []).length, 1, "nur der Start lädt still");
assert.equal((app.match(/api\("pinnwand_gesehen"/g) || []).length, 1, "„gesehen“ nur über pwGesehenMelden (Zahl zieht mit)");
assert.match(app, /v: "pinnwand", zahl: \(\) => PW\.offen \|\| 0, klasse: \(\) => \(PW\.offen \? "pw-neu" : ""\) \}/, "Kachel: Zahl + Puls nur bei Neuem");
assert.ok(!/PW\.offen = PW\.zettel\.filter/.test(app), "alte Zählung (alle nicht erledigten) ist weg");

// Aussehen: pulsiert rot; ohne Effekte, reduzierte Bewegung und Ruhezeit ohne Bewegung
assert.match(html, /\.kachel\.pw-neu \{ box-shadow: 0 0 0 3px #c0392b inset, var\(--schatten\); animation: pwNeuPuls 1\.5s ease-in-out infinite; \}/);
assert.match(html, /:root\.ohne-anim \.kachel\.pw-neu, :root\.ohne-anim \.kachel\.pw-neu \.zahl \{ animation: none; \}/);
assert.match(html, /@media \(prefers-reduced-motion: reduce\) \{ \.kachel\.pw-neu, \.kachel\.pw-neu \.zahl \{ animation: none; \} \}/);
assert.match(html, /:root\.kc-ruhe \.pw-neu, :root\.kc-ruhe \.pw-neu \.zahl \{/);
assert.match(app, /id: "pinnwand_neu_puls", thema: "club", sym: "📌", t: "Die Pinnwand pulsiert bei neuen Zetteln"/, "Hilfe-Zentrum");
console.log("OK – KC-CLUB-PINNWAND-NEU-PULS (2.763.0)");
