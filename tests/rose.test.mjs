// KC-CLUB-ROSE (24.10.2026, Wunsch Hansi): Rose aus der Schießbude – statische Prüfung (offline, ohne Server).
// Aufruf: node tests/rose.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";

const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = lies("app.js"), seite = lies("index.html"), server = lies("supabase/functions/kc-club/index.ts");
const fall = (name) => { const i = server.indexOf(`case "${name}": {`); assert.ok(i > 0, `Aktion ${name} fehlt`); return server.slice(i, server.indexOf("\n      case ", i + 10)); };
const block = app.slice(app.indexOf("// KC-CLUB-ROSE-ANFANG"), app.indexOf("// KC-CLUB-ROSE-ENDE"));
assert.ok(block.length > 1000, "Rosen-Block in app.js");

// 1. Server: rose_setzen nur Admin, Mitglied muss aktiv sein, schreibOk
{ const f = fall("rose_setzen");
  assert.ok(/nurAdmin\(ich\);/.test(f) && /active/.test(f) && /org_id !== ORG/.test(f), "nur Admin, aktives Mitglied");
  assert.ok(/schreibOk\(await db\.from\("kc_club_person_einstellung"\)\.upsert\(\{ person_id: pid, schluessel: "rose_schiessbude", wert: \{ an, gesetzt_von: ich\.person_id, gesetzt_am: jetzt\(\) \}/.test(f), "Merker mit an/gesetzt_von/gesetzt_am"); }
assert.ok(/nurAdmin\(ich\);/.test(fall("rose_liste")), "rose_liste nur Admin");
// 2. rose_erhalten: nur für mich, nur mit Häkchen, nur einmal
{ const f = fall("rose_erhalten");
  assert.ok(/eq\("person_id", ich\.person_id\)/.test(f) && /person_id: ich\.person_id, schluessel: "rose_erhalten"/.test(f), "nur für mich selbst");
  assert.ok(/if \(e\.rose_erhalten\) return json\(\{ ok: true, schon: true \}\);/.test(f) && /if \(!e\.rose_schiessbude\?\.an\) return json\(\{ ok: false \}\);/.test(f), "nie zweimal, nur mit Häkchen");
  assert.ok(/ignoreDuplicates: true/.test(f), "erster Zeitpunkt bleibt"); }
// 3. Mitglieder können die Merker nicht selbst setzen (nicht in EINSTELLUNGEN)
{ const e = server.slice(server.indexOf("const EINSTELLUNGEN: Record"), server.indexOf("\n};", server.indexOf("const EINSTELLUNGEN: Record")));
  assert.ok(!/rose_/.test(e), "rose_* nicht über einstellung_setzen"); }
// 4. init: ohne zusätzliche Abfrage, Merker verborgen, nur „rose“
assert.ok(/const rose = roseFaellig\(einstellungen\); for \(const k of ROSE_KEYS\) delete einstellungen\[k\];/.test(server) && /einstellungen, rose, /.test(server), "init gibt nur rose: true/false");
assert.ok(/const roseFaellig = \(e: Record<string, any>\) => !!e\.rose_schiessbude\?\.an && !e\.rose_erhalten;/.test(server), "fällig = an und nicht erhalten");
// 5. Mitgliedskarte: Merker nur für den Admin, in derselben Abfrage wie das Bild
assert.ok(/in\("schluessel", ich\.admin \? \["avatar", \.\.\.ROSE_KEYS(, VERTRETUNG_KEY)?\] : \["avatar"\]\)/.test(server) && /\.\.\.\(ich\.admin \? \{ rose: roseStand\(mdEinst\)(, vertretung: vertretungIds\(mdEinst\[VERTRETUNG_KEY\]\))? \} : \{\}\)/.test(server), "Admin sieht Stand");
assert.ok(/\$\{ICH\?\.admin && m\.rose \? roseAdminKarte\(m\) : ""\}/.test(app) && /api\("rose_setzen", \{ person_id: pid, an \}/.test(app) && /Rose aus der Schießbude \(einmalig\)/.test(app), "Admin-Häkchen");
// 6. Bedingungen im Browser
assert.ok(/if \(!INIT\?\.rose \|\| INIT\._offline \|\| !ICH \|\| ROSE\.gezeigt\) return;/.test(block), "nur wenn fällig, nicht aus dem Offline-Stand");
assert.ok(/if \(s && s\.pid === ICH\.person_id\) \{ ROSE\.gezeigt = true; return roseMelden\(\); \}/.test(block), "nie zweimal auf demselben Gerät, Meldung nachholen");
assert.ok(/document\.hidden \|\| aktuelleAnsicht !== "start"/.test(block) && /ROSE_MS = 20000;/.test(block) && /\(ROSE\.ms \+= d\) < ROSE_MS \|\| !roseFrei\(\)/.test(block), "20 Sekunden sichtbare Startseite (2.652.0)");
assert.ok(/\.blatt:not\(\.versteckt\)/.test(block) && /INPUT\|TEXTAREA\|SELECT/.test(block) && /isContentEditable/.test(block), "nicht über Fenstern oder beim Tippen");
assert.ok(/JZB\.saison === "kirmes" && JZB\.imBild/.test(block) && /jzSimJueZeit\(\)/.test(block) && /!SPAR\?\.an/.test(block), "Schießbude nur bei sichtbarer Sim-Jü-Szene");
assert.ok(/roseSzeneDa\(\) \? roseQuelle\(\) : null/.test(block) && /Ein Gruß aus der Schießbude/.test(block), "sonst Gruß-Variante");
assert.ok(/roseLsSetzen\(\{ pid: ICH\.person_id, am: [^}]+gemeldet: false \}\);\s*roseZeigen\([^;]+;\s*roseMelden\(\);/.test(block), "erst merken, zeigen, dann melden");
assert.ok(/prefers-reduced-motion: reduce/.test(block) && /!!SPAR\?\.an/.test(block), "weniger Bewegung/Sparmodus ohne Flug");
assert.ok(/Nur für dich/.test(block) && /💝 Danke/.test(block) && /<svg class="rose-svg"/.test(block), "Schild, Danke, Bild");
assert.ok(/KC-CLUB-ROSE-CSS-ANFANG/.test(seite) && /\.rose-schicht \{/.test(seite), "CSS in index.html");
assert.ok(!/\|\|=|\?\?=|&&=/.test(block), "keine neue Syntax für alte Handys");
console.log("rose.test.mjs: alles grün");
