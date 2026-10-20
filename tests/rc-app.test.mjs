// KC-CLUB-RC-PRUEFUNG (20.10.2026): statische Prüfung der Funde aus der Release-Candidate-Prüfung (offline, ohne Server).
// Aufruf: node tests/rc-app.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";

const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), seite = lies("index.html");

// 1. KOCH/KOCH_EMO stehen vor dem Start-Block (sonst Zugriff vor der Zuweisung, wenn der Start schon Twinkey malt)
{
  const start = app.indexOf("(function start() {");
  assert.ok(start > 0, "Start-Block gefunden");
  for (const n of ["const KOCH_EMO =", "const KOCH_RE =", "const KOCH ="]) {
    const i = app.indexOf(n); assert.ok(i > 0 && i < start, n + " vor dem Start-Block");
    assert.equal(app.split(n).length, 2, n + " genau einmal");
  }
}
// 2. Zurück in die App: höchstens 1× je 60 s alles neu laden
assert.ok(/visibilitychange", \(\) => \{ updWeg\(document\.hidden\); if \(!document\.hidden\) \{ if \(ST\.eigen\) stMelden\(true\); if \(Date\.now\(\) - NEU_ZULETZT >= 60000\) neuLaden\(\);/.test(app), "Neuladen beim Zurückkommen gedrosselt");
// 3. JSON in onclick-Attributen: & mitmaskiert (hlJs / esc), keine alte Handmaskierung mehr
assert.ok(/const hlJs = \(v\) => \(JSON\.stringify\(v\) \?\? "null"\)\.replace\(\/&\/g, "&amp;"\)/.test(app), "hlJs maskiert &");
assert.ok(!/JSON\.stringify\((?:[^()\n]|\([^()\n]*\))*\)\.replace\(\/'\/g, "&#39;"\)/.test(app), "keine onclick-JSON ohne &-Maskierung (einfache Anführungszeichen)");
assert.ok(!/=\$\{JSON\.stringify\([^)]*\)\.replace\(\/"\/g, "&quot;"\)\}/.test(app) && !/, \$\{JSON\.stringify\(m\.treffpunkt \|\| ""\)\.replace/.test(app), "keine onclick-JSON ohne &-Maskierung (doppelte Anführungszeichen)");
for (const s of ["zeAmt(${hlJs(a)})", "aeRueckChat(${hlJs(x.ansprech)}, ${hlJs(name || \"\")})", "treffenForm(${hlJs(bearbeiten)})", "${hlJs(o)})'", "gruppeWahl(${hlJs(a)})",
  "HL.angebotForm.titel=${esc(JSON.stringify(t))}", "${esc(JSON.stringify(m.treffpunkt || \"\"))}"]) assert.ok(app.includes(s), "onclick gehärtet: " + s);
assert.ok(/js = \(x\) => JSON\.stringify\(x\)\.replace\(\/&\/g, "&amp;"\)/.test(app), "Kalender-Knöpfe maskieren &");
// 4. Tippflächen ≥ 44 px
assert.ok(/\.sc-blatt \.knoepfe \.knopf, \.sc-blatt \.knopf\.klein \{ min-height: 44px; font-size: \.9rem; \}/.test(seite), "Schulungs-Knöpfe 44 px");
assert.ok(/\.il-zu::after, \.bo-mini button::after, \.lv-weg::after, \.druckknopf\.klein::after \{ content: ""; position: absolute; inset: -8px; \}/.test(seite), "kleine Schließen-Knöpfe mit größerer Trefferfläche");
assert.ok(/\.bf-zu::after/.test(seite) && /\.anl-chip \.anl-weg::after/.test(seite) && /\.na-seite button::after/.test(seite), "weitere kleine Knöpfe mit Trefferfläche");
assert.ok(/\.bu-top-knoepfe button, \.ar-farben button \{ min-width: 40px; min-height: 40px; \}/.test(seite), "dichte Reihen mindestens 40 px");
// 5. Einstellungs-Reiter lesbar
assert.ok(/\.rk-tab \{ opacity: 1; \} \.rk-tab small \{ font-size: \.8rem; line-height: 1\.15; max-width: 84px; white-space: normal;/.test(seite), "Reiter-Beschriftung groß, umbrechend, nicht blass");
// 7. Rot im Dunkelmodus lesbar
assert.ok(!/color:#c62828/.test(app), "kein fest eingestelltes Rot mehr in app.js-Texten");
assert.ok(/<h3 style="color:var\(--textRot, #c62828\)">⚠️ Dieser Link gilt nicht mehr<\/h3>/.test(seite), "Link-ungültig-Überschrift mit --textRot");
assert.ok(/:root\.dunkel \{ --textRot:/.test(seite) && /--textRot: #741521/.test(seite), "--textRot hell und dunkel definiert");
// 8. Symbol-Knöpfe mit Beschriftung für Vorlesehilfen
assert.ok(app.includes(`onclick="wuLoeschen('\${x.id}')" aria-label="Löschen" title="Löschen">🗑️</button>`), "🗑️ mit aria-label");
assert.ok(app.includes(`onclick="$('wuBlatt').remove()" aria-label="Schließen" title="Schließen">✕</button>`) && app.includes(`onclick="$('ausweisBlatt').remove()" aria-label="Schließen" title="Schließen">✕</button>`), "✕ mit aria-label");
// 9. Einstellung nicht still verschlucken – Hinweis höchstens einmal je Sitzung
assert.ok(/function einstNurLokal\(\) \{\n  try \{ if \(sessionStorage\.getItem\("kc_club_einst_lokal"\)\) return;/.test(app) && app.includes('melde("Nur auf diesem Gerät gespeichert – der Server war gerade nicht erreichbar.", true)'), "Hilfsfunktion einstNurLokal");
for (const k of ["ansicht", "tipps", "unterstuetzung", "sende_effekt"]) assert.ok(new RegExp(`schluessel: "${k}"[^\\n]*\\.catch\\(einstNurLokal\\)`).test(app), "Einstellung " + k + " meldet Fehler");
// 10. Leere Suche in Mitglieder-Auswahlen
for (const id of ["pwListe", "mfListe", "psListe", "empfListe", "taListe"]) {
  const i = app.indexOf(`$("${id}").innerHTML`); assert.ok(i > 0, id);
  assert.ok(app.slice(i, app.indexOf("\n", app.indexOf('.join("")', i))).includes(`.join("") || '<p class="hinweis">Niemand gefunden.</p>'`), id + ": „Niemand gefunden.“");
}
{ const i = app.indexOf('$("grListe").innerHTML = MITGLIEDER.filter'); assert.ok(i > 0 && app.slice(i, app.indexOf("\n", app.indexOf('.join("")', i))).includes("Niemand gefunden."), "grListe: „Niemand gefunden.“"); }
// 11. Abmelden räumt auch „Wichtig“-Frage und Einweisung-zu weg
assert.ok(/\/\^\(kc_wichtig_frage\|kc-einw-zu\)\/\.test\(k\)/.test(app) && /const WF_KEY = "kc_wichtig_frage"/.test(app) && /const EINW_ZU_KEY = "kc-einw-zu"/.test(app), "geraetAbmelden löscht kc_wichtig_frage und kc-einw-zu");
// 12. Toter Code entfernt
for (const n of ["kachelKlein", "rgRegName", "esTafelFarbe", "esTafelDicke", "esTafelWerkzeug", "esTafelZurueck", "esTafelTeilen", "JZB_EXTRAS", "dvLeitung", "DOPPELTIPP_MS"])
  assert.ok(!new RegExp(`(?:const|function) ${n}\\b`).test(app), n + " entfernt");
assert.ok(!/const kalenderAbo = kalVerbinden/.test(app), "Alias kalenderAbo entfernt");
// 13. Druck-Knöpfe einheitlich
assert.ok(!/>🖨️ Ausdrucken \(PDF\)</.test(app) && !/>🖨️ Ausdrucken \/ als PDF</.test(app), "alte Druck-Beschriftungen weg");
assert.ok(/rcAngebotAntwort\('\$\{esc\(a\.id\)\}', 'druck'\)">🖨️ Drucken \/ PDF<\/button>/.test(app) && /rcDrucken\('\$\{esc\(id\)\}'\)">🖨️ Drucken \/ PDF<\/button>/.test(app), "Reise-Checkliste: „🖨️ Drucken / PDF“");
// 14. Speichern-Knöpfe mit 💾
assert.ok(!/class="knopf haupt[^"]*"[^>]*>Speichern<\/button>/.test(app + seite), "kein Speichern-Hauptknopf ohne 💾");
assert.ok(/onclick="statusSpeichern\(\)">💾 Speichern<\/button>/.test(seite) && /id="bsSpeichern" onclick="bsSpeichern\(this\)">💾 Speichern<\/button>/.test(app), "💾 Speichern");

console.log("rc-app: alle Prüfungen bestanden");

// KC-CLUB-MINDESTVERSION (RC 20.10.2026): Mindestversion in version.json, App aktualisiert sich, Server bittet beim Start um ein Update
{
  const vj = JSON.parse(lies("version.json"));
  const srvM = lies("supabase/functions/kc-club/index.ts");
  const appM = lies("app.js");
  assert.ok(/^\d+\.\d+\.\d+$/.test(vj.mindest || ""), "version.json hat mindest");
  assert.ok(srvM.includes(`const MINDEST_APP_VERSION = "${vj.mindest}";`), "Server und version.json gleich");
  assert.ok(/versionAelter\(v, MINDEST_APP_VERSION\) && !ich\.admin\)\s*throw new Fehler\(`Deine Club-App ist veraltet/.test(srvM), "init bittet alte Apps um ein Update");
  assert.ok(/function mindestPflicht\(v\)/.test(appM) && /v\.mindest && versionNeuer\(String\(v\.mindest\), APP_VERSION\)\) mindestPflicht\(v\)/.test(appM), "App aktualisiert sich bei zu alter Version");
}
