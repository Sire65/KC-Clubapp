// 3.49.0 KC-CLUB-ZUGANG-EINZELN (Wunsch Hansi 27.11.2026): je Aushilfe/Gast einzelne Funktionen zusätzlich erlauben oder wegnehmen.
// Aufruf: node tests/zugang-einzeln.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (f) => fs.readFileSync(new URL("../" + f, import.meta.url), "utf8");
const app = lies("app.js"), server = lies("supabase/functions/kc-club/index.ts");
const block = (t, start) => { const i = t.indexOf(start), j = t.indexOf("\n};", i); return t.slice(t.indexOf("= {", i) + 2, j + 2); };
const sv = new Function("return " + block(server, "const ZUGANG_EXTRA:").replace(/as const/g, ""))();
const ap = new Function("return " + block(app, "const ZUGANG_EXTRA = {"))();
assert.deepEqual(Object.keys(ap), Object.keys(sv), "gleiche Gruppen in App und Server");
for (const k of Object.keys(sv)) { assert.equal(ap[k].art, sv[k].art, k + ": art"); assert.deepEqual(ap[k].aktionen, sv[k].aktionen, k + ": gleiche Aktionen"); }
for (const g of Object.values(sv)) for (const a of g.aktionen) assert.ok(server.includes(`case "${a}":`), "Aktion gibt es im Server: " + a);
for (const k of ["fahrten", "fotos_hoch", "rezepte", "protokolle", "kontakte", "vorschlaege"]) assert.equal(sv[k]?.art, "plus", "Vorschlag plus: " + k);
for (const k of ["spiele", "fotos_sehen", "tausch", "tippspiel"]) assert.equal(sv[k]?.art, "minus", "Vorschlag minus: " + k);
// Server-Prüfung nachspielen
const zp = server.slice(server.indexOf("function zugangPruefen("), server.indexOf("// Person + Rollen → angemeldetes Mitglied"));
class Fehler extends Error {}
const ERL = { aushilfe: new Set(["spiele_liste", "fotos_liste", "mein_dienst"]), gast: new Set(["spiele_liste"]) };
const zpJs = zp.replace("function zugangPruefen(a: string, ich: Ich)", "function zugangPruefen(a, ich)");
const pruef = new Function("ZUGANG_EXTRA", "ZUGANG_ERLAUBT", "Fehler", zpJs + "; return zugangPruefen;")(sv, ERL, Fehler);
const aus = { person_id: "x", zugang: "aushilfe", extra: { plus: ["fahrten"], minus: ["spiele"] } };
assert.doesNotThrow(() => pruef("fahrtprofil", aus), "plus erlaubt");
assert.throws(() => pruef("spiele_liste", aus), "minus gesperrt, auch wenn im Paket");
assert.doesNotThrow(() => pruef("mein_dienst", aus), "Rest des Pakets bleibt");
assert.throws(() => pruef("fahrtprofil", { person_id: "y", zugang: "aushilfe" }), "ohne Freischaltung weiter gesperrt");
assert.doesNotThrow(() => pruef("irgendwas", { zugang: "mitglied" }), "Mitglieder unberührt");
assert.ok(/return zugangExtraAnwenden\(ichAus\(p, r\)\);/.test(server) && /x\.plus\.includes\("protokolle"\) \? \{ protokolle: true \}/.test(server) && /x\.plus\.includes\("kontakte"\) \? \{ kontakte: true \}/.test(server), "bei der Anmeldung geladen; Rechte Protokolle/Kontakte über Freischaltung");
const rs = server.slice(server.indexOf('case "rolle_setzen": {'), server.indexOf('case "rolle_setzen": {') + 4000);
assert.ok(/nurAdmin\(ich\);/.test(rs) && /zeile\.zugang === "aushilfe" \|\| zeile\.zugang === "gast"/.test(rs) && /ZX\.bis = 0;/.test(rs), "nur Admin, nur Aushilfe/Gast, sofort wirksam");
assert.ok(/case "zugang_extra_laden": \{\s*\/\/[^\n]*\n\s*nurAdmin\(ich\);/.test(server), "Laden nur Admin");
assert.ok(/\$\{roExtraHtml\(\)\}/.test(app) && /extra: \(\(\) => \{/.test(app), "Fenster und Speichern");
// App-Regeln im Sandkasten: Aushilfe mit plus fahrten / minus spiele
{
  const von = app.indexOf("const ZUGANG_AKTIONEN"), bis = app.indexOf("const zugangAktion"), ende = app.indexOf("\n", bis);
  const mach = (ich) => new Function("ICH", app.slice(von, ende) + "; return { zugangKachel, zugangAktion };")(ich);
  const h = mach({ zugang: "aushilfe", extra: { plus: ["fahrten"], minus: ["spiele"] } }), o = mach({ zugang: "aushilfe" }), m = mach({ zugang: "mitglied", extra: { minus: ["spiele"] } });
  assert.ok(h.zugangKachel("fahrten") && h.zugangAktion("fahrtprofil") && !o.zugangKachel("fahrten") && !o.zugangAktion("fahrtprofil"), "App: plus zeigt Kachel und erlaubt Aufruf");
  assert.ok(!h.zugangKachel("spiele") && !h.zugangAktion("spiele_liste") && o.zugangKachel("spiele") && h.zugangKachel("mein_dienst"), "App: minus nimmt weg, Rest bleibt");
  assert.ok(m.zugangKachel("spiele") && m.zugangAktion("spiele_liste"), "Mitglieder unberührt");
}
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/zugang-einzeln.test.mjs"), "läuft in der CI");
console.log("zugang-einzeln: ok");
