// KC-CLUB-EINSPIELEN-FENSTER (28.10.2026, Wunsch Hansi „wenn sich genau beim Einspielen ein Mitglied anmelden will: kurz ein blaues Wartungsfenster“).
// Aufruf: node tests/einspielen-fenster.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const seite = fs.readFileSync(new URL("../.github/workflows/seite-veroeffentlichen.yml", import.meta.url), "utf8");
const srv = fs.readFileSync(new URL("../.github/workflows/server-hochladen.yml", import.meta.url), "utf8");
const sh = fs.readFileSync(new URL("../tools/einspielen-melden.sh", import.meta.url), "utf8");
// Server: nur die zwei Abläufe (GitHub-Token), nur App-Start, nie der Admin, erlischt von selbst
assert.ok(/audience: "kc-einspielen"/.test(server) && /seite-veroeffentlichen\.yml@refs\/heads\/main": "seite"/.test(server) && /server-hochladen\.yml@refs\/heads\/main": "server"/.test(server), "nur die Einspiel-Abläufe dürfen melden");
assert.ok(/if \(a === "einspielen_melden"\) return await einspielenMelden\(req, p\);/.test(server), "Meldung vor der normalen Anmeldung");
assert.ok(/if \(a === "init" && !ich\.admin\) \{[^]*?einspielen: true, vorname: ich\.vorname, bis, fertig \}, 423\);/.test(server), "nur beim App-Start, nie der Admin, mit Vornamen");
assert.ok(/const EINSPIEL_MAX_MIN = 10;/.test(server) && /x < j \+ \(EINSPIEL_MAX_MIN \+ 1\) \* 60000/.test(server) && /catch \{ \/\* im Zweifel nie aussperren \*\/ \}/.test(server), "erlischt von selbst, im Zweifel offen");
assert.ok(/const el = p\.einspielen \? await einspielenLage\(\) : null, einspielen = el \? !!el\.bis : undefined, einspielenFertig = el\?\.fertig \?\? undefined;/.test(server), "Nachfragen über ping (mit Schätzung)");
assert.ok(/const EINSPIEL_DAUER_S: Record<string, number> = \{ seite: 60, server: 60 \};/.test(server) && /w\[quelle \+ "_fertig"\] = an \?/.test(server), "Schätzung je Ablauf");
// App: Fenster mit Vornamen, Knopf, Nachfragen, Neuladen
assert.ok(/if \(r\.status === 423 && j\?\.einspielen\) \{ einspielenZeigen\(j\.vorname, j\.fertig\);/.test(app), "App erkennt das Einspielen");
assert.ok(/<img src="kc-kochmuetze-weiss\.webp"[^>]*>\n\s*<h2[^>]*>🔧 Kurze Wartung<\/h2>/.test(app) && /Dauert voraussichtlich noch etwa \$\{m\} Minuten\./.test(app) && /Gleich fertig – nur noch einen Moment\./.test(app), "Kochmütze + Schätzung der Dauer");
assert.ok(/führen gerade eine kurze Wartung durch\. Versuche es in ein paar Minuten erneut\. Danke für dein Verständnis\./.test(app) && /`Hey \$\{esc\(String\(vorname\)\.trim\(\)\)\}, wir`/.test(app), "Text mit Vornamen");
assert.ok(/↻ Jetzt nochmal/.test(app) && /api\("ping", \{ einspielen: true \}\)/.test(app) && /r\.einspielen === false\) return location\.reload\(\)/.test(app) && /EINSPIEL_TAKT_S = 20/.test(app), "Knopf + alle 20 s nachfragen, dann neu laden");
// Abläufe: an vor dem Hochladen, aus danach (immer), nie ein Abbruch
assert.ok(/Wartungsfenster an\n\s+run: tools\/einspielen-melden\.sh an 5\n\s+- id: seite\n\s+uses: actions\/deploy-pages@[0-9a-f]{40} # v4\n\s+- name: Wartungsfenster aus\n\s+if: always\(\)/.test(seite), "Seite: an/aus um das Veröffentlichen");
assert.ok(/id-token: write/.test(srv) && /Wartungsfenster an\n\s+run: tools\/einspielen-melden\.sh an 5\n\s+- name: Edge Function hochladen/.test(srv) && /Wartungsfenster aus\n\s+if: always\(\)/.test(srv), "Server: an/aus um das Hochladen");
assert.ok(/^set \+e$/m.test(sh) && /exit 0\s*$/.test(sh) && /audience=kc-einspielen/.test(sh), "Meldung bricht den Ablauf nie ab");
console.log("einspielen-fenster: alle Prüfungen bestanden");
