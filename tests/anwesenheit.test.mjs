// KC-CLUB-ANWESENHEIT (03.11.2026, Wunsch Hansi „ja bau das ein, mit 20 Uhr einspielen“): Anwesenheit über Supabase Presence.
// Aufruf: node tests/anwesenheit.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
// Server: Kanal nicht erratbar (Geheimnis + Monat), Tischgäste bekommen keinen
assert.ok(server.includes('RT_CLUB.kanal = "club-anw-" + (await sha256("kc-club-anwesenheit:" + SERVICE + ":" + m)).slice(0, 32)'), "Kanal aus Geheimnis und Monat");
assert.ok(server.includes('rtClub: ich.zugang === "tischgast" ? null : await rtClubKanal().catch(() => null)'), "nur Mitglieder, Fehler → ohne");
// App: nur Zufallskennung, Nutzlast ohne Namen/Nummer
assert.ok(/anwKey: "g" \+ Math\.random\(\)\.toString\(36\)\.slice\(2, 12\)/.test(app), "Zufallskennung je Gerät");
assert.ok(app.includes('presence: { key: RT.anwKey }') && app.includes('payload: { type: "presence", event: "track", payload: { t: 1 } }'), "nur { t: 1 }");
const block = app.slice(app.indexOf("// KC-CLUB-ANWESENHEIT (03.11.2026"), app.indexOf("function rtSpaeter"));
assert.ok(!/person_id|ICH\.|vorname|INIT\.ich/.test(block.replace(/\/\/[^\n]*/g, "")), "keine Person im Anwesenheits-Kanal");
// Andere kommen/gehen → Server fragen (gebremst), eigener Schlüssel zählt nicht
assert.ok(app.includes("if (keys.some((k) => k !== RT.anwKey)) anwAnders();"));
assert.ok(app.includes("const ANW_TAKT_MS = 120000, ANW_ABSTAND_MS = 20000;") && app.includes("Math.max(2000 + Math.random() * 4000, RT.anwLetzt + ANW_ABSTAND_MS - Date.now())"), "höchstens alle 20 s, versetzt");
// Takt: nur mit Leitung + Anwesenheit alle 2 Min. (Regel KC-EINSPIELEN-RUHIG zählt 3 Min. – passt), sonst wie bisher
assert.ok(app.includes("sparTakt(rtAn() && RT.anw ? ANW_TAKT_MS : PUSH_AKTIV || rtAn() ? 60000 : 15000)"));
assert.ok(ANW() <= 180000, "Abgleich spätestens alle 3 Min.");
function ANW() { return Number(app.match(/const ANW_TAKT_MS = (\d+)/)[1]); }
// Leitung weg → Anwesenheit weg (wieder alter Takt)
assert.ok(app.includes("RT.ok = false; RT.anw = false; RT.ws = null;") && app.includes("RT.ws = null; RT.ok = false; RT.anw = false; try { ws?.close(); } catch {}"));
assert.ok(fs.readFileSync(new URL("../.github/workflows/tests.yml", import.meta.url), "utf8").includes("node tests/anwesenheit.test.mjs"), "läuft in der CI");
console.log("anwesenheit: ok");
