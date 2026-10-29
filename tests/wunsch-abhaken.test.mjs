// KC-CLUB-WUNSCH-ABHAKEN (2.754.0, 29.10.2026, Wunsch Hansi „ich selber kann die Wünsche nicht als erledigt abhaken“):
// ✅ Erledigt bei offenen Punkten und Rückfragen, mit Nachfrage; der Server nimmt „erledigt“ nur vom Admin an. Aufruf: node tests/wunsch-abhaken.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");

// wuZeile herauslösen und mit Test-Daten ausführen
const start = app.indexOf("function wuZeile(x, art)"), ende = app.indexOf("\n}\n", start) + 2;
const quelle = app.slice(start, ende);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const WU_STATUS = { offen: "🆕 offen", in_arbeit: "🔧 Claude arbeitet daran", rueckfrage: "❓ Rückfrage", erledigt: "✅ erledigt", zurueckgestellt: "⏸ zurückgestellt" };
const zeile = (x, art) => new Function("WU", "WU_STATUS", "esc", "oaAnzeige", "oaFeld", quelle + "return wuZeile;")({ bearbeiten: null }, WU_STATUS, esc, () => "", () => "")(x, art);
const punkt = (status) => ({ id: "W1", nr: 46, text: "Namen im Kopf", bereich: "Club-App", wichtig: false, status, erstellt_am: "2026-10-28T08:00:00Z" });

assert.match(zeile(punkt("offen"), "offen"), /onclick="wuErledigt\('W1'\)">✅ Erledigt</, "offener Punkt: ✅ Erledigt fehlt");
assert.match(zeile(punkt("in_arbeit"), "offen"), /wuErledigt\('W1'\)/, "Punkt in Arbeit: ✅ Erledigt fehlt");
assert.match(zeile(punkt("rueckfrage"), "rueckfrage"), /wuErledigt\('W1'\)/, "Rückfrage: ✅ Erledigt fehlt");
assert.ok(!/wuErledigt/.test(zeile(punkt("erledigt"), "erledigt")), "erledigt: kein zweites Abhaken");
assert.match(zeile(punkt("erledigt"), "erledigt"), /wuStatus\('W1', 'offen'\)">↩️ Nochmal öffnen/, "erledigt: Nochmal öffnen fehlt");
assert.ok(!/wuErledigt/.test(zeile(punkt("zurueckgestellt"), "zurueck")), "zurückgestellt: erst wieder aufnehmen");

// Nachfrage vor dem Abhaken, Fehler werden gemeldet (keine Erfolgsmeldung ohne Speichern)
const fn = app.slice(app.indexOf("async function wuErledigt(id)"), app.indexOf("\n}\n", app.indexOf("async function wuErledigt(id)")) + 2);
assert.match(fn, /await frage\(`Punkt #\$\{x\.nr\} als erledigt abhaken\?`, \{ ja: "✅ Erledigt" \}\)/, "Nachfrage fehlt");
assert.match(fn, /try \{ await api\("wl_status", \{ id, status: "erledigt" \}\);.*melde\(`✅ #\$\{x\.nr\} ist abgehakt`\); \} catch \(e\) \{ meldeFehler\(e\); \}/, "Speichern/Meldung falsch");

// Server: nur Admin, „erledigt“ erlaubt und setzt das Datum
const wl = server.slice(server.indexOf('case "wl_status":'), server.indexOf('case "wl_loeschen":'));
assert.match(wl, /nurAdmin\(ich\);/, "wl_status ohne Admin-Prüfung");
assert.match(wl, /\["offen", "zurueckgestellt", "erledigt"\]\.includes\(String\(p\.status\)\)/, "Server nimmt „erledigt“ nicht an");
assert.match(wl, /neu\.erledigt_am = p\.status === "erledigt" \? new Date\(\)\.toISOString\(\) : null/, "Erledigt-Datum fehlt");

assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/wunsch-abhaken.test.mjs"), "läuft in der CI");
console.log("wunsch-abhaken: ok");
