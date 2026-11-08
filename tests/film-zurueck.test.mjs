// KC-CLUB-FILM-ZURUECK (2.895.0, Fund Hansi 08.11.2026): die Zurück-Taste schließt zuerst den Film (wie ✕) – nicht die App. Aufruf: node tests/film-zurueck.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
const app = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
assert.ok(/let FILM_ZU = null;/.test(app), "Merker für den offenen Film");
const fz = app.slice(app.indexOf("function filmZeigen(id)"), app.indexOf("function filmZeigen(id)") + 3500);
assert.ok(/FILM_ZU = \(\) => s\.querySelector\("\[data-zu\]"\)\?\.click\(\);/.test(fz), "Zurück = derselbe Weg wie ✕ (Wege-Eintrag, „kurz“ unter 60 s)");
assert.ok(/s\.remove\(\); document\.body\.style\.overflow = ""; FILM_ZU = null;/.test(fz), "nach dem Schließen nichts mehr offen");
const pop = app.slice(app.indexOf('window.addEventListener("popstate", (e) => {'), app.indexOf('window.addEventListener("popstate", (e) => {') + 400);
assert.ok(/^window\.addEventListener\("popstate", \(e\) => \{\n  if \(FILM_ZU && \$\("filmSchicht"\)\) \{ FILM_ZU\(\); if \(VERLAUF\.state\) history\.pushState\(VERLAUF\.state, "", VERLAUF\.url\); return; \}/.test(pop), "Zurück schließt als Erstes den Film und bleibt auf der Seite");
console.log("film-zurueck: ok");
