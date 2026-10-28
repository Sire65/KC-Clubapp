// KC-CLUB-HILFE-PASSEND (28.10.2026, Fund Hansi: Twinkey bot im Admin-Fenster das Start-Video an – „das muss besser laufen … sonst nur den richtigen Erklärtext“).
// Aufruf: node tests/hilfe-passend.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs"; // 2.737.0 KC-CLUB-TEILE: app.js + teile/*.js
const app = programmText();
const v = app.slice(app.indexOf("function hsVideo("), app.indexOf("function hsBlatt("));
assert.ok(/const id = HS_VIDEO_SICHT\[v\] \|\| v;/.test(v) && !/TW_VIDEOS/.test(v), "Video nur feste Zuordnung oder gleiche ID – keine Umwege über verwandte Hilfen");
for (const [s, id] of [["protokolle", "lesen"], ["dokumente", "lesen"], ["neu", "nachricht"], ["programme", "technik"]]) assert.ok(new RegExp(`${s}: "${id}"`).test(app), `${s} → ${id}`);
assert.ok(/function hsKontext\(\) \{\n  const b = hsBlatt\(\); if \(!b\) return \{ key: HS\.v, v: HS\.v \};/.test(app), "offenes Fenster gilt, nicht der Bereich darunter");
assert.ok(/if \(K\.blatt \? !\(K\.hilfe \|\| hsBlattSuche\(K\.titel\)\) : !HZ_SICHT_HILFEN\[v\]\) return false;/.test(app), "im Fenster nur mit passender Hilfe – sonst kein Angebot");
assert.ok(/const vid = K\.blatt \? \(K\.videoId \?/.test(app), "im Fenster nur ein ausdrücklich zugeordnetes Video");
assert.ok(/adBlatt: \(\) => \(AD\.offen === "notfall" \? \{ hilfe: "e:b-notfall-fahrplan", video: "admin" \}/.test(app) && /adminBlatt: \(\) => \(\{ hilfe: "e:b-admin-zentrale" \}\)/.test(app), "Admin-Fenster mit eigenem Erklärtext");
for (const id of ["b-notfall-fahrplan", "b-leitstand", "b-admin-zentrale"]) assert.ok(new RegExp(`\\{ id: "${id}", blatt: true, [^\\n]*nur: \\(\\) => !!ICH\\?\\.admin, x: "`).test(app), `Erklärtext ${id} (nur Admin)`);
console.log("hilfe-passend: alle Prüfungen bestanden");
