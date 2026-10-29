// 2.755.0 KC-CLUB-SPUR-VOLL (Wunsch Hansi 29.10.2026 „einige Schritte werden mir nicht angezeigt; wichtig, ob sie Hilfetexte lesen oder Erklär-Videos ansehen;
// alles soll aufgezeichnet werden, damit ich sehe, was jeder nutzt“): Fenster, Hilfe, Videos/Filme, Handlungen, Übersicht, fehlende Schritte behoben.
import assert from "node:assert/strict";
import fs from "node:fs";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const videos = fs.readFileSync(new URL("../teile/videos.js", import.meta.url), "utf8");
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const teile = fs.readdirSync(new URL("../teile/", import.meta.url)).filter((f) => f.endsWith(".js")).map((f) => fs.readFileSync(new URL("../teile/" + f, import.meta.url), "utf8")).join("\n");
const block = app.slice(app.indexOf("// ---------- 2.755.0 KC-CLUB-SPUR-VOLL"), app.indexOf("const SPW = {"));
assert.ok(block.length > 2000, "Baustein gefunden");

// 1) Registry FENSTER_NAMEN: jedes Fenster (blattAuf in app.js und teile/, feste Fenster in index.html) hat einen Namen
const FENSTER_NAMEN = new Function(block.slice(block.indexOf("const FENSTER_NAMEN"), block.indexOf("Object.assign(SPUR_WAS")) + "\nreturn FENSTER_NAMEN;")();
const dyn = [...(app + "\n" + teile).matchAll(/blattAuf\("([A-Za-z0-9]+)"/g)].map((m) => m[1]);
const fest = [...html.matchAll(/<div class="blatt[^"]*" id="([A-Za-z0-9]+)"/g)].map((m) => m[1]);
const fehlt = [...new Set([...dyn, ...fest])].filter((id) => !FENSTER_NAMEN[id]);
assert.deepEqual(fehlt, [], "Fenster ohne Namen in FENSTER_NAMEN: " + fehlt.join(", "));
assert.ok(Object.values(FENSTER_NAMEN).every((n) => n.length >= 4 && !/[…`$]/.test(n)), "Namen ohne Platzhalter");

// 2) Server: Kennungen erlaubt, freier Text nie; unbekanntes „mit“ → Schritt bleibt ohne „mit“
const zeile = (n) => server.slice(server.indexOf(n), server.indexOf("\n", server.indexOf(n)));
const SPUR_WAS = eval(zeile("const SPUR_WAS = ").replace(/^const SPUR_WAS = /, "").replace(/;$/, ""));
const SPUR_MIT = eval(zeile("const SPUR_MIT = ").replace(/^const SPUR_MIT = /, "").replace(/;$/, ""));
const SPUR_KENNUNG = eval(zeile("const SPUR_KENNUNG = ").replace(/^const SPUR_KENNUNG = /, "").replace(/;$/, ""));
const ok = (m) => SPUR_MIT.test(m) || SPUR_KENNUNG.test(m);
for (const k of ["buAufgabeBlatt", "h:uhr_wecker", "f:wecker-stumm", "inst_chrome", "clubsitzungablauf", "KC-P-M0002", "968c95d3-dce0-49ea-a375-af24fe9b7308"]) assert.ok(ok(k), "erlaubt: " + k);
for (const k of ["Hallo Klaus", "3", "<b>", "a b", "x".repeat(61), "ü"]) assert.ok(!ok(k), "abgelehnt: " + k);
const melden = server.slice(server.indexOf('case "spur_melden"'), server.indexOf('case "start_melden"'));
assert.match(melden, /x\[2\] == null \|\| !spurMitOk\(String\(x\[2\]\)\) \? \[Math\.round\(Number\(x\[0\]\)\), String\(x\[1\]\)\]/, "unbekanntes mit: Schritt bleibt (vorher fiel er weg)");
assert.match(melden, /protokollPlatz\(ich\.person_id, "spur", 240\)/, "mehr Sendungen je Stunde");

// 3) Server: seitenweise (vorher höchstens 1000 Zeilen), Übersicht nur Admin, nie Inhalte
assert.match(server, /async function spurZeilen\([\s\S]{0,600}\.range\(seite \* 1000, seite \* 1000 \+ 999\)/, "seitenweise");
const liste = server.slice(server.indexOf('case "spur_liste"'), server.indexOf("// ----- KC-CLUB-NUTZUNG (0.99.0)"));
assert.ok(/const data = await spurZeilen\(t0 - 86400000, t0 \+ 3 \* 86400000, pid\);/.test(liste) && !/\.limit\(5000\)/.test(liste), "Wege-Liste ohne 1000er-Grenze");
const ueb = server.slice(server.indexOf('case "spur_uebersicht"'), server.indexOf("// ----- KC-CLUB-NUTZUNG (0.99.0)"));
assert.match(ueb, /^case "spur_uebersicht": \{\s+nurAdmin\(ich\);/, "Übersicht nur Admin");
assert.ok(!/body|text|content/.test(ueb.replace(/Fehler\([^)]*\)/g, "")), "keine Inhalte");
assert.match(liste, /k: x\.mit && !SPUR_MIT\.test\(x\.mit\) \? x\.mit : null/, "Kennung als k (Name macht die App), Unterhaltung nur bei echter ID");

// 4) App: Namen der neuen Schritte, Handlungen (Registry) passen zum Server
const SPUR_WAS_APP = {}; new Function("SPUR_WAS", block.slice(block.indexOf("Object.assign(SPUR_WAS"), block.indexOf("// Registry SPUR_TATEN")))(SPUR_WAS_APP);
const SPUR_TATEN = new Function("SPUR_WAS", block.slice(block.indexOf("const SPUR_TATEN"), block.indexOf("function spurTat")) + "\nreturn SPUR_TATEN;")(SPUR_WAS_APP);
const aktionen = new Set([...(app + teile).matchAll(/api\("([a-z_]+)"/g)].map((m) => m[1]));
for (const [a, f] of Object.entries(SPUR_TATEN)) {
  assert.ok(aktionen.has(a), "Handlung gibt es in der App: " + a);
  for (const d of [{}, { antwort: "ja" }, { antwort: "nein" }, { antwort: "vielleicht" }, { nur_offen: true }, { aenderung: true }, { an: true }, { op: "packen" }, { op: "mitnehmen" }, { op: "gibtsnicht" }, { wert: 1, id: "h:x" }, { wert: -1, id: "h:x" }, { wert: 0, id: "h:x" }]) {
    const [w] = f(d); assert.ok(SPUR_WAS.test(w) && SPUR_WAS_APP[w], `Schritt ${w} (${a}) passt zum Server und hat einen Namen`);
  }
}
for (const w of Object.keys(SPUR_WAS_APP)) assert.ok(SPUR_WAS.test(w), "Server nimmt an: " + w);
assert.match(app, /NOT\.fehler = 0; spurTat\(action, daten\); return r;/, "zentral in api(), nur nach Erfolg");

// 5) Hilfe, Filme, Videos
assert.ok(app.includes('spur("hz_kapitel", t)') && app.includes('spur("hz_zeig", id)') && app.includes('spur("hz_eintrag", id)') && app.includes('spur("hz_frage", v)')
  && app.includes('spur(k?.dataset?.hz ? "hz_vorlesen" : "vorlesen", k?.dataset?.hz || null)') && /HZ\.gesucht = true; spur\("hz_suche"\);/.test(app), "Hilfe-Schritte");
assert.ok(!/spur\("hz_suche", /.test(app), "nie das Suchwort");
assert.ok(app.includes('spur("film_start", f.id)') && app.includes('spur(bis ? "film_ende" : `film_ab_${m}_${d}`, f.id)') && app.includes('spur("film_frage_" + (["an", "nein"].includes(wahl) ? wahl : "spaeter"), f.id)'), "Filme");
assert.ok(videos.includes('spur("rg_start", tour.id)') && videos.includes('spur(RG.frage ? "rg_ende" : `rg_ab_${(RG.i | 0) + 1}_${RG.st?.length || 1}`, RG.tour)'), "Erklär-Videos");
assert.match(app, /if \(!\/\^\(rg\|tat\)_\/\.test\(w\) && document\.body\?\.classList\.contains\("rg-an"\)\) return;/, "Vorführung im Video zählt nicht");
for (const w of ["rg_ab_12_120", "film_ab_14_15", "tat_tasche_uebernehmen", "film_frage_spaeter"]) assert.ok(SPUR_WAS.test(w), "lang genug erlaubt: " + w);

// 6) spurWas: Fortschritt lesbar; Beobachter für Fenster (Neu-Zeichnen zählt nicht doppelt)
const was = new Function("SPUR_WAS", "NZ_NAMEN", app.slice(app.indexOf("const spurWas = "), app.indexOf("\nlet SPUR_HINTER_AB")) + "\nreturn spurWas;")(SPUR_WAS_APP, {});
assert.equal(was("rg_ab_3_12"), "⏹️ Erklär-Video abgebrochen bei Schritt 3 von 12:");
assert.equal(was("film_ab_4_15"), "⏹️ Anleitungsfilm geschlossen nach 4 von 15 Min.:");
assert.equal(was("wieder_33"), "📲 wieder geöffnet (war 33 Min. im Hintergrund)");
assert.match(block, /m\.addedNodes\.forEach\(\(n\) => \{ if \(n\.nodeType === 1 && n\.id && !\(jetzt - \(SPUR_FZU\.get\(n\.id\) \|\| 0\) < 1500\)\) spurFenster\(n\); \}\);\s+m\.removedNodes/, "neu gezeichnet zählt nicht (der Reihe nach)");
assert.match(block, /beob\.observe\(document\.body, \{ childList: true \}\)/, "nur direkte Kinder von body (billig)");

// 7) Übersicht: Gruppen richtig sortiert/zugeordnet
const g = new Function("spurMitName", "spurZeile", "$", "NZ_NAMEN", app.slice(app.indexOf("function spuGruppen("), app.indexOf("async function spurUebersicht(")) + "\nreturn spuGruppen;")(
  (w, k) => "N:" + k, (x) => x.w + (x.k ? " " + x.k : ""), (id) => (id === "v-termine" || id === "v-start" ? {} : null), { termine: "📅 Termine", start: "🏠 Startseite" });
const r = g({ start: 5, termine: 2, "fenster|atBlatt": 3, "hz_kapitel|club": 1, "rg_start|ueberblick": 2, "rg_ende|ueberblick": 1, "rg_ab|ueberblick": 1, "film_frage_spaeter|clubsitzungablauf": 1, tat_termin_ja: 1, wieder: 4, geoeffnet: 3 }, { "rg_ab|ueberblick": "3/12" });
assert.deepEqual(r.seiten.map((x) => x[2]), ["start", "termine"]);
assert.deepEqual(r.videos.ueberblick, { name: "N:ueberblick", start: 2, ende: 1, ab: 1, weit: "3/12" });
assert.equal(Object.keys(r.filme).length, 0, "Film-Angebot ist keine Film-Ansicht");
assert.equal(r.taten.length, 2); assert.equal(r.fenster[0][1], 3); assert.equal(r.sonst.length, 0, "wieder/geöffnet nicht als Weiteres");
assert.ok(app.includes('onclick="spurUebersicht(30, null)">📊 Was nutzt jeder?</button>'), "Knopf in 👥 Nutzung");
// 8) jeder feste Schritt-Name im Programm hat einen lesbaren Namen in den Wegen (sonst stünde dort z. B. „klopf_verpasst“)
{
  const alt = app.slice(app.indexOf("const SPUR_WAS = {"), app.indexOf("\nconst SPW = {")), nz = app.slice(app.indexOf("const NZ_NAMEN = {"), app.indexOf("};", app.indexOf("const NZ_NAMEN = {")));
  const fest = [...new Set([...(app + teile).matchAll(/spur\??\.?\(\s*["']([a-z][a-z0-9_]*[a-z0-9])["']/g)].map((m) => m[1]))];
  const ohne = fest.filter((n) => !new RegExp(`[\\s,{]${n}:`).test(alt) && !new RegExp(`[\\s,{]${n}:`).test(nz));
  assert.deepEqual(ohne, [], "Schritte ohne Namen: " + ohne.join(", "));
}
console.log("OK – KC-CLUB-SPUR-VOLL (2.755.0)");
