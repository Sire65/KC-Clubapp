// KC-CLUB-TA-HERAUSNEHMEN (16.11.2026, Wunsch Hansi „nimm Karla raus aus der Terminbestätigung … in Zukunft muss ich das als Admin auch können“)
// Aufruf: node tests/ta-herausnehmen.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const srv = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const c = srv.slice(srv.indexOf('case "terminanfrage_empfaenger_entfernen"'), srv.indexOf("\n      }\n", srv.indexOf('case "terminanfrage_empfaenger_entfernen"')));
assert.ok(c.length > 100, "Server-Aktion da");
assert.ok(c.includes('if (a.erstellt_von !== ich.person_id && !ich.admin) throw new Fehler('), "nur wer angefragt hat oder der Admin");
assert.ok(c.includes('a.status === "abgesagt"') && c.includes("(em ?? []).length <= 1"), "nicht bei abgesagten, letzter Empfänger bleibt");
assert.ok(c.includes('.delete().eq("anfrage_id", a.id).eq("person_id", pid)'), "nur diese eine Person");
assert.ok(!/senden\(|routerSenden\(/.test(c), "still – keine Nachricht");
assert.ok(c.includes('protokoll(ich.person_id, "terminanfrage_empfaenger_entfernt"'), "im Protokoll");
assert.ok(/\(a\.vonMir \|\| ICH\?\.admin\) && !ab && a\.empfaenger\.length > 1 \? ` <button type="button" class="ta-raus"/.test(app), "✕ für Anfragenden und Admin, nicht beim letzten");
assert.ok(/api\("terminanfrage_empfaenger_entfernen", \{ id, person_id: pid \}\)/.test(app) && /async function taHerausnehmen\(id, pid\) \{[\s\S]{0,200}await frage\(/.test(app), "mit Rückfrage");
assert.ok(/\.ta-raus \{/.test(html), "Knopf gestaltet");
console.log("✅ ta-herausnehmen: alle Prüfungen bestanden");
