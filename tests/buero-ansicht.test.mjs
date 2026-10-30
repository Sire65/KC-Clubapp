// 2.765.0 KC-CLUB-BUERO-ANSICHT (Wunsch Hansi 30.10.2026 „das Büro für alle zur Ansicht freischalten – allen nur read only: ansehen alles, aber nix
// auslösen und verändern; Zeitknöpfe 12, 24, 48 Std., Woche, Monat, bis auf Widerruf“)
import assert from "node:assert/strict";
import fs from "node:fs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), server = lies("supabase/functions/kc-club/index.ts");

// 1) Server-Logik nachgebaut (Typen entfernt) und durchgespielt
let src = server.slice(server.indexOf("const BUERO_ANSICHT_DAUER"), server.indexOf("const nurBueroLesen = "));
for (const [a, b] of [[": Record<string, number | null>", ""], [": Promise<{ bis: string | null; seit: string; von: string } | null>", ""], ["const w: any", "const w"], ["(ich: Ich): Promise<Ich>", "(ich)"]]) {
  assert.ok(src.includes(a), "Baustein: " + a); src = src.split(a).join(b); }
let KONFIG = null;
const S = new Function("konfigZeile", src + "\nreturn { BUERO_ANSICHT_DAUER, bueroAnsichtLesen, bueroAnsichtAnwenden };")(async () => ({ data: KONFIG ? { wert: KONFIG } : null }));
const mitglied = { person_id: "KC-P-M0009", buero: null, zugang: "mitglied" };
const in1h = new Date(Date.now() + 3600000).toISOString(), vor1h = new Date(Date.now() - 3600000).toISOString();
KONFIG = null; assert.equal((await S.bueroAnsichtAnwenden(mitglied)).buero, null, "aus: kein Büro");
KONFIG = { an: true, bis: in1h }; let x = await S.bueroAnsichtAnwenden(mitglied);
assert.equal(x.buero, "lesen", "an: nur lesen"); assert.deepEqual(x.bueroAnsicht, { bis: in1h });
KONFIG = { an: true, bis: null }; assert.equal((await S.bueroAnsichtAnwenden(mitglied)).bueroAnsicht.bis, null, "bis auf Widerruf");
KONFIG = { an: true, bis: vor1h }; assert.equal((await S.bueroAnsichtAnwenden(mitglied)).buero, null, "abgelaufen: von selbst zu");
KONFIG = { an: false, bis: null }; assert.equal((await S.bueroAnsichtAnwenden(mitglied)).buero, null, "ausgeschaltet");
KONFIG = { an: true, bis: null };
for (const z of ["gast", "aushilfe"]) assert.equal((await S.bueroAnsichtAnwenden({ ...mitglied, zugang: z })).buero, null, z + " nie");
assert.equal((await S.bueroAnsichtAnwenden({ ...mitglied, buero: "schreiben" })).buero, "schreiben", "eigenes Schreibrecht bleibt");
assert.equal((await S.bueroAnsichtAnwenden({ ...mitglied, buero: "schreiben" })).bueroAnsicht, undefined);
assert.deepEqual(S.BUERO_ANSICHT_DAUER, { "12h": 12, "24h": 24, "48h": 48, woche: 168, monat: 720, dauernd: null }, "Zeitknöpfe");

// 2) Wirkt bei jeder Anmeldung (auch aus dem Merker), Schalten nur Admin, Protokoll
assert.match(server, /ANMELDUNG_TREFFER = true;\s+return bueroAnsichtAnwenden\(\{ \.\.\.c\.ich, aemter: \[\.\.\.c\.ich\.aemter\] \}\);/, "Merker-Weg");
assert.match(server, /ANMELDUNGEN\.set\(hash, \{ ich: \{ \.\.\.ich, aemter: \[\.\.\.ich\.aemter\] \}[^\n]*\n\s+return bueroAnsichtAnwenden\(ich\);/, "frisch angemeldet (Merker ohne Freischaltung)");
const setzen = server.slice(server.indexOf('case "buero_ansicht_setzen": {'), server.indexOf('case "buero_rechte_setzen": {'));
assert.match(server, /case "buero_ansicht": nurAdmin\(ich\);/); assert.match(setzen, /^case "buero_ansicht_setzen": \{\s+nurAdmin\(ich\);/);
assert.ok(/schluessel: "buero_ansicht"/.test(setzen) && /anmeldungenVergessen\(\);/.test(setzen) && /protokoll\(ich\.person_id, "buero_ansicht_gesetzt"/.test(setzen));

// 3) „Nur lesen“ heißt wirklich nur lesen: jede Büro-Aktion, die nur Leserecht verlangt, schreibt und sendet nichts
const faelle = [...server.matchAll(/\n      case "(buero_[a-z_]+)": /g)].map((m) => m[1]);
for (const f of faelle) {
  const a = server.indexOf(`case "${f}":`), b = server.indexOf("\n      case \"", a + 10), body = server.slice(a, b);
  if (/nurBueroSchreiben\(ich\)|nurAdmin\(ich\)/.test(body)) continue;
  if (f === "buero_eingang_paket") { assert.ok(/aktionAusfuehren\(t, \{\}/.test(body), "Paket ruft nur andere Aktionen mit deren Prüfung auf"); continue; }
  if (f === "buero_mail_senden") { assert.ok(/nurBueroSchreiben\(ich\)/.test(body)); continue; }
  assert.ok(!/\.insert\(|\.update\(|\.upsert\(|\.delete\(|routerSenden|sendenGewaehlt/.test(body), `${f} verändert etwas, obwohl nur Leserecht nötig ist`);
}
for (const f of ["bueroSitzung", "bueroNaechste"]) { const a = server.indexOf(`async function ${f}(`), b = server.indexOf("\nasync function ", a + 10);
  assert.ok(a > 0 && !/\.insert\(|\.update\(|\.upsert\(|\.delete\(/.test(server.slice(a, b)), f + " liest nur"); }

// 4) App: Knöpfe = Server-Schlüssel, Hinweis für Mitglieder, nur Admin schaltet
const knoepfe = eval(app.slice(app.indexOf("const BU_ANSICHT_DAUER = ") + 25, app.indexOf(";", app.indexOf("const BU_ANSICHT_DAUER = "))));
assert.deepEqual(knoepfe.map((k) => k[0]), Object.keys(S.BUERO_ANSICHT_DAUER), "Knöpfe = Server-Registry");
assert.deepEqual(knoepfe.map((k) => k[1]), ["12 Std.", "24 Std.", "48 Std.", "1 Woche", "1 Monat", "Bis auf Widerruf"]);
assert.match(app, /onclick="buAnsichtSetzen\('aus', this\)">⛔ Jetzt wieder schließen<\/button>/);
assert.match(app, /return `\$\{buAnsichtKarte\(\)\}<div class="karte"><h3 style="margin-top:0">🔐 Büro-Freigaben<\/h3>/, "im Fenster Büro-Freigaben (nur Admin)");
assert.match(app, /\$\("buInhalt"\)\.innerHTML = buAnsichtHinweis\(\) \+ \(BU\.sicht === "ordner"/, "Hinweis oben im Büro");
assert.match(app, /const buAnsichtHinweis = \(\) => ICH\?\.bueroAnsicht \?/);
assert.match(app, /<span class="mk-sym">👀<\/span><span class="mk-titel">Für alle zur Ansicht<\/span>/, "Schnellzugang in der Verwaltung");
assert.match(app, /const buSchreiben = \(\) => ICH\?\.buero === "schreiben";/, "Leser sehen keine Schreib-Knöpfe");
assert.match(app, /id: "buero_ansicht", thema: "club", sym: "👀", nur: \(\) => !!ICH\?\.admin/, "Hilfe (nur Admin)");
console.log("OK – KC-CLUB-BUERO-ANSICHT (2.765.0)");
