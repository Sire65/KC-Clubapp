// KC-CLUB-RT-CLUBABEND-MITFAHRT (10.11.2026, Wunsch Hansi „ja beides bauen“): Clubabend Live und Mitfahrgelegenheiten über die direkte Leitung.
// Aufruf: node tests/rt-clubabend-mitfahrt.test.mjs (offline). Browser: tools/hilfe/rt-clubabend-mitfahrt-browser.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), srv = lies("supabase/functions/kc-club/index.ts");
// Server: nur an Leute, die gerade in der App sind, ohne den Auslöser, nur die Art (kein Inhalt), über kc_club_rt_klingeln (Zähler, Sparbremse)
const f = srv.slice(srv.indexOf("async function rtKlingelnInApp"), srv.indexOf("async function onlineJetzt"));
assert.match(f, /gte\("zuletzt_gesehen", new Date\(Date\.now\(\) - IN_APP_SEK \* 1000\)/);
assert.match(f, /filter\(\(id\) => id !== ohne\)/);
assert.match(f, /db\.rpc\("kc_club_rt_klingeln", \{ p_personen: ids, p_art: art \}\)/);
const ca = srv.slice(srv.indexOf('case "clubabend_setzen"'), srv.indexOf('case "protokoll_vorlage"'));
assert.match(ca, /await rtKlingelnInApp\("clubabend", ich\.person_id\);/);
for (const c of ["mitfahrt_anbieten", "mitfahrt_platz", "mitfahrt_suchen", "mitfahrt_loeschen"]) {
  const b = srv.slice(srv.indexOf(`case "${c}"`), srv.indexOf("case ", srv.indexOf(`case "${c}"`) + 10));
  assert.match(b, /await rtKlingelnInApp\("mitfahrt", ich\.person_id\);/, c);
}
// App: Signal lädt sofort, Takt nur noch alle 2 Min. bei stehender Leitung; Mitfahrten nie mitten ins Eintippen
assert.match(app, /if \(s\.art === "clubabend"\) \{ if \(\$\("caBlatt"\) && CA\.holen\)/);
assert.match(app, /if \(rtAn\(\) && \+\+CA\.tick % 6\) return; CA\.holen\(\); \}, CA_TAKT_MS\);/);
assert.match(app, /if \(s\.art === "mitfahrt"\) \{ if \(!document\.hidden && \(aktuelleAnsicht === "termine" \|\| aktuelleAnsicht === "aktion"\)\)/);
assert.match(app, /document\.querySelector\(FENSTER_OFFEN\) \|\| \$\("mfAnbieten"\) \|\| \/\^\(INPUT\|TEXTAREA\|SELECT\)\$\/\.test/);
console.log("rt-clubabend-mitfahrt: alles grün");
