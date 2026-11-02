// KC-CLUB-DB-AUSSETZER (02.11.2026, Wunsch Hansi „Datenbank hat nicht geantwortet … beides einbauen“): reine Abfragen bei kurzem Aussetzer
// von selbst noch einmal (nie Schreiben); Aussetzer-Minuten werden gezählt und im Verlauf gezeigt.
// Aufruf: node tests/db-aussetzer.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const mig = fs.readFileSync(new URL("../supabase/migrations/20261102_kc_club_db_aussetzer.sql", import.meta.url), "utf8");
assert.ok(/dbWeg: r\.status === 503 && j\?\.db === "weg"/.test(app), "Fehler erkennt den Datenbank-Aussetzer");
assert.ok(/const dbNochmalDarf = \(e, action, n\) => !!e\?\.dbWeg && \(API_LESEN\.test\(action\) \|\| DB_NOCHMAL_LESEN\.test\(action\)\) && n < DB_NOCHMAL_MAX && !document\.hidden;/.test(app)
  && /if \(dbNochmalDarf\(e, action, dbNochmal\)\) \{ await new Promise\(\(ok\) => setTimeout\(ok, 4000 \* \+\+dbNochmal\)\); continue; \}/.test(app) && /DB_NOCHMAL_MAX = 2/.test(app), "nur Lesen, höchstens 2-mal");
const re = eval(app.match(/DB_NOCHMAL_LESEN = (\/[^\n]*?\/);/)[1]), lesen = eval(app.match(/const API_LESEN = (\/[^\n]*\/);/)[1]);
for (const a of ["ungelesen_uebersicht", "init", "mitglieder", "admin_verlauf"]) assert.ok(re.test(a) || lesen.test(a), "wird wiederholt: " + a);
for (const a of ["nachricht_senden", "pinnwand_anheften", "treffen_antwort", "dienst_buchen"]) assert.ok(!re.test(a) && !lesen.test(a), "Schreiben nie wiederholen: " + a);
assert.ok(/from\("kc_club_db_aussetzer"\)\.select\("minute,zeitplaene,app"\)/.test(server) && /aussetzer: aus \?\? \[\]/.test(server), "Server liefert die Aussetzer im Verlauf");
assert.ok(/\$\{adAussetzerHtml\(d\.aussetzer, tage\)\}/.test(app), "Anzeige im Verlauf");
assert.ok(/grant select, insert, update, delete on public\.kc_club_db_aussetzer to service_role/.test(mig) && /'7,37 \* \* \* \*'/.test(mig) && /startup timeout/.test(mig), "Tabelle, Rechte, Zeitplan");
assert.ok(/p\.aktion = 'fehler_api' and p\.details->>'text' like 'Die Datenbank antwortet gerade nicht%'/.test(mig), "zählt nur den festen Fehlertext, keine Inhalte");
console.log("db-aussetzer: ok");
