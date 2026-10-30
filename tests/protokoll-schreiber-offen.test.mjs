// KC-CLUB-PROTOKOLL-SCHREIBER-OFFEN (2.783.0, 30.10.2026, Wunsch Hansi „steht noch nicht fest – wird noch geklärt bzw. Zeile erst mal leer lassen“).
// Aufruf: node tests/protokoll-schreiber-offen.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), server = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261030_kc_club_protokoll_schreiber_offen.sql");
assert.match(mig, /add column if not exists verfasser_offen boolean not null default false/);
// neue Entwürfe: Schriftführer offen; Liste/Laden liefern offen; leere Wahl = offen, Person = fest; Veröffentlichen erst mit Schriftführer
assert.ok(server.includes("verfasser: ich.person_id, verfasser_offen: true })"), "Büro-Entwurf offen");
assert.ok(server.includes("verfasser: ich.person_id, verfasser_offen: true };"), "neues Protokoll offen");
assert.equal((server.match(/offen: !!pr\.verfasser_offen/g) || []).length, 2, "Liste und Laden");
assert.ok(server.includes("verfasser,verfasser_offen,veroeffentlicht_am"));
assert.match(server, /if \(p\.verfasser === ""\) upd\.verfasser_offen = true;/);
assert.match(server, /upd\.verfasser_offen = false;/);
assert.match(server, /if \(pr\.verfasser_offen\) throw new Fehler\("Bitte vor dem Veröffentlichen eintragen, wer das Protokoll geschrieben hat/);
// App: Auswahl „wird noch geklärt“, Anzeige ohne Namen
assert.match(app, /<option value="" \$\{p\.verfasser\.offen \? "selected" : ""\}>— wird noch geklärt —<\/option>/);
assert.match(app, /function prSchreiber\(p\) \{ return p\?\.verfasser\?\.offen \? "" : p\?\.verfasser\?\.name \|\| ""; \}/);
assert.match(app, /<tr><th>Schriftführer<\/th><td>\$\{esc\(prSchreiber\(p\)\)\}<\/td><\/tr>/, "Druck: Zeile leer");
assert.ok(!/esc\(p\.verfasser\.name/.test(app), "kein Name an prSchreiber vorbei");
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/protokoll-schreiber-offen.test.mjs"), "läuft in der CI");
console.log("protokoll-schreiber-offen: ok");
