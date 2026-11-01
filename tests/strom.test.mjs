// KC-CLUB-STROM (2.799.0, 01.11.2026, Wunsch #55 Hansi „Stromverbrauch senken und im Adminbereich zeigen – alles bauen, aber sparsam“).
// Aufruf: node tests/strom.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const lies = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");
const app = programmText(), html = lies("index.html"), server = lies("supabase/functions/kc-club/index.ts"), mig = lies("supabase/migrations/20261101_kc_club_strom.sql");
// 1) Ruhe: nach 3 Min. ohne Bedienung und im Hintergrund stehen alle CSS-Animationen – nicht beim Zuschauen (Video, Rückseite, Tisch live)
assert.ok(html.includes(":root.kc-strom-ruhe *, :root.kc-strom-ruhe *::before, :root.kc-strom-ruhe *::after { animation-play-state: paused !important; }"));
assert.ok(app.includes("const STROM_RUHE_MS = 180000") && app.includes("const ruhe = document.hidden || (Date.now() - STROM.bedient > STROM_RUHE_MS && !stromZuschauen());"));
assert.ok(app.includes("if (RG?.an || ES?.offen ||") && app.includes('return [...document.querySelectorAll("video, audio")].some((m) => !m.paused && !m.ended);'));
// 2) Übersicht: nachgeladener Teil, Admin-Kachel, Anzeige ohne eigene Abfragen außer strom_uebersicht
assert.ok(app.includes('strom: { einstieg: ["stromBlatt", "stromZeichnen"], sri: "sha384-') && lies("sw.js").includes('"strom"'), "Teil angemeldet");
assert.ok(app.includes('["strom", "🔋", "Stromverbrauch", "app"]') && app.includes('if (id === "strom") return stromBlatt();'));
assert.ok(lies("teile/strom.js").includes("Dieses Gerät gibt den Akkustand nicht heraus (iPhone"), "iPhone: nicht messbar");
// 3) Messung: nur sichtbar und ohne Laden, einmal am Tag gemeldet, nur Zahlen; Server prüft und begrenzt
assert.ok(app.includes("if (alt && !a.charging && alt.bereich && lv <= alt.lv + .01)") && app.includes("if (min > 0 && min < 30)"));
assert.ok(app.includes('filter((k) => k < heuteIso())') && app.includes('api("strom_melden", { tage:'));
assert.ok(server.includes('if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(tag) || tag >= heute || tag < frueh) continue;') && server.includes('if (!/^[a-z_]{1,30}$/.test(bereich)'));
assert.ok(server.includes('case "strom_uebersicht": {\n        nurAdmin(ich);'), "Übersicht nur Admin");
assert.ok(!/display_name|vorname/.test(server.slice(server.indexOf('case "strom_uebersicht"'), server.indexOf('case "waechter_lage"'))), "ohne Namen");
assert.match(mig, /grant select, insert, update, delete on public\.kc_club_strom to service_role;/);
assert.match(mig, /'kc_club_strom', 'Club-App', 'normal', false, false, false/);
assert.ok(lies(".github/workflows/tests.yml").includes("node tests/strom.test.mjs"), "läuft in der CI");
console.log("strom: ok");
