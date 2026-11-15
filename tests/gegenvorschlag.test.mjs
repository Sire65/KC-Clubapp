// KC-CLUB-GEGENVORSCHLAG (Wunschliste #93, Hansi 15.11.2026): Gegenvorschlag zu einem Thema – bis zu 3 (A, B, C), jedes Mitglied darf,
// keine Push an die Unterstützer, Knopf „Gegenvorschlag“; nur einen der Gruppe unterstützen; in der Tagesordnung EIN Punkt.
// Aufruf: node tests/gegenvorschlag.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const srv = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const mig = fs.readFileSync(new URL("../supabase/migrations/20261115_kc_club_vorschlag_gegen.sql", import.meta.url), "utf8");
const stueck = (t, a, e = "\n}\n") => { const i = t.indexOf(a); assert.ok(i >= 0, a); return t.slice(i, t.indexOf(e, i) + e.length); };

// Datenbank: eine Spalte an der bestehenden Tabelle
assert.ok(/add column if not exists gegen_zu uuid references public\.kc_club_vorschlaege\(id\) on delete set null/.test(mig), "Spalte gegen_zu");

// Server: Speichern
assert.ok(srv.includes("const GEGEN_MAX = 3;"), "bis zu 3");
const pr = stueck(srv, "async function gegenGruppePruefen(");
assert.ok(pr.includes('if (art !== "thema") throw') && pr.includes('z.art !== "thema" || z.status !== "offen"') && pr.includes("gruppe.length >= GEGEN_MAX"), "nur zu offenen Themen, höchstens 3");
assert.ok(pr.includes("const wurzel = (z.gegen_zu || z.id) as string;"), "Gruppe hängt am ersten");
const sp = stueck(srv, 'case "vorschlag_speichern": {', "\n      }\n");
assert.ok(sp.includes("const gegen = p.gegen_zu ? await gegenGruppePruefen(art, String(p.gegen_zu)) : null;"), "jedes Mitglied darf (keine Rollenprüfung)");
assert.ok(sp.includes("p.treffen_id && !gegen)") && sp.includes("gegen_zu: gegen.wurzel, treffen_id: gegen.z.treffen_id ?? null"), "Termin vom ersten, kein Anmeldeschluss-Weg");
assert.ok(/\} : gegen \? \{[^}]*titel: "↔️ Gegenvorschlag"/.test(sp) && sp.includes("await leitungIds()"), "Push nur an die Leitung (wie jeder Themenvorschlag)");
assert.ok(!/kc_club_stimmen[\s\S]{0,200}senden\(/.test(pr), "keine Push an Unterstützer");
// Server: abstimmen – nur einen der Gruppe
const st = stueck(srv, 'case "vorschlag_stimme": {', "\n      }\n");
assert.ok(/if \(p\.wahl && v\.art === "thema"\) \{\s*const andere = \(await gegenGruppeOffen\(\(v\.gegen_zu \|\| v\.id\) as string\)\)\.map\(\(x: any\) => x\.id\)\.filter\(\(id: string\) => id !== v\.id\);\s*if \(andere\.length\) await db\.from\("kc_club_stimmen"\)\.delete\(\)\.eq\("person_id", ich\.person_id\)\.in\("vorschlag_id", andere\);/.test(st), "Stimme wandert");
assert.ok(srv.includes("gegenZu: v.gegen_zu ?? null,"), "Liste liefert gegenZu");
// Server: Tagesordnung – ein Punkt je Gruppe
const gt = stueck(srv, "function gegenTops(");
const gegenTops = new Function(gt.replace(/: any\[\]/g, "").replace(/: any/g, "").replace(/new Map<string, any\[\]>\(\)/, "new Map()").replace(/new Set<string>\(\)/, "new Set()") + "\nreturn gegenTops;")();
const L = [
  { id: "a", art: "thema", status: "offen", gegen: null, text: "Grillfest", unterstuetzt: 3 },
  { id: "x", art: "thema", status: "offen", gegen: null, text: "Ausflug", unterstuetzt: 1 },
  { id: "b", art: "thema", status: "offen", gegen: "a", text: "Wurstbude", unterstuetzt: 2 },
  { id: "c", art: "thema", status: "offen", gegen: "a", text: "Picknick", unterstuetzt: 0 },
];
assert.deepEqual(gegenTops(L), [
  { t: "↔️ A: Grillfest (👍 3) oder B: Wurstbude (👍 2) oder C: Picknick (👍 0)", art: "vorschlag", id: "a" },
  { t: "Ausflug", art: "vorschlag", id: "x" },
], "Gruppe = ein Punkt am Platz des ersten, andere unverändert");
assert.deepEqual(gegenTops([L[0], L[1]]), [{ t: "Grillfest", art: "vorschlag", id: "a" }, { t: "Ausflug", art: "vorschlag", id: "x" }], "ohne Gegenvorschlag wie bisher");
assert.deepEqual(gegenTops([L[2], L[3]]).map((x) => x.t), ["↔️ A: Wurstbude (👍 2) oder B: Picknick (👍 0)"], "erster zurückgezogen (kommt nicht in die Liste) → B und C bleiben eine Gruppe");
assert.ok(srv.includes("...vertagt, ...gegenTops(vorschlaege.filter((v) => v.fuerDiese)), ...BUERO_TOP_HINTEN"), "in der Standard-Tagesordnung");
assert.ok(srv.includes("const fertig = await gegenErweitern(tops.filter((x) => !ist(x)).map((x) => String(x.id))), weiter = await gegenErweitern("), "behandelt/vertagt gilt für die ganze Gruppe");

// App
assert.ok(app.includes("const GEGEN_MAX = 3, GEGEN_BUCHST = [\"A\", \"B\", \"C\"];"), "App: bis zu 3");
assert.ok(/offen && v\.art === "thema" && vsGegenGruppe\(v\)\.length < GEGEN_MAX \? `<button class="knopf klein" onclick="vorschlagGegen\('\$\{esc\(v\.id\)\}'\)">↔️ Gegenvorschlag<\/button>`/.test(app), "Knopf „Gegenvorschlag“ auf jeder offenen Themen-Karte (bis 3)");
assert.ok(app.includes("${vsGegenKacheln(themen)}") && app.includes("if (vsGegenGruppe(v).length > 1) return vorschlagGegenInfo(vsGegenKey(v));"), "Gruppe als eine Kachel / ein Blatt");
assert.ok(app.includes('if (VF_GEGEN && vfArt === "thema") { daten.gegen_zu = VF_GEGEN; daten.treffen_id = null; delete daten.sitzung_nr; }'), "Formular schickt gegen_zu");
// Gruppenbildung nachspielen
const gg = stueck(app, "function vsGegenGruppe(v) {");
const MAP = new Map([["a", { id: "a", art: "thema", status: "offen", erstellt_am: "1" }], ["b", { id: "b", art: "thema", status: "offen", gegenZu: "a", erstellt_am: "2" }],
  ["s", { id: "s", art: "spende", status: "offen", erstellt_am: "3" }], ["c", { id: "c", art: "thema", status: "zurueckgezogen", gegenZu: "a", erstellt_am: "4" }]]);
const vsGegenKey = (v) => String(v?.gegenZu || v?.id || "");
const grp = new Function("VORSCHLAG_MAP", "vsGegenKey", gg + "\nreturn vsGegenGruppe;")(MAP, vsGegenKey);
assert.deepEqual(grp(MAP.get("b")).map((x) => x.id), ["a", "b"], "A und B (C zurückgezogen zählt nicht)");
assert.deepEqual(grp(MAP.get("s")).map((x) => x.id), ["s"], "Spende nie in einer Gruppe");
assert.ok(/\.vs-gegen \{ display: grid;[^}]*minmax\(240px, 1fr\)/.test(html), "nebeneinander, auf dem Handy untereinander");
console.log("✅ gegenvorschlag: alle Prüfungen bestanden");
