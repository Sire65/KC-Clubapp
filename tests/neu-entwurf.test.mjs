// KC-CLUB-NEU-ENTWURF (27.10.2026, Fund Hansi „Nachricht vorbereitet, kurz rausgegangen – jetzt finde ich sie nicht mehr“): statische Prüfung (offline).
// Aufruf: node tests/neu-entwurf.test.mjs
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs"; // 2.726.0 KC-CLUB-TEILE: app.js + teile/*.js
const app = programmText();
assert.ok(/if \(!chatId\) return neuEntwurfMerken\(\);/.test(app), "neue Nachricht (noch ohne Chat) wird gemerkt");
const f = app.slice(app.indexOf("function neuEntwurfMerken("), app.indexOf("function neuEntwurfHolen("));
assert.ok(/if \(!e \|\| empfTest\(\)\) return;/.test(f) && /localStorage\.setItem\(neuEntwurfSchluessel\(\), JSON\.stringify\(\{ e, b: neuEntwurf\?\.betreff \|\| "", t: t\.slice\(0, 4000\), am: Date\.now\(\) \}\)\)/.test(f), "Empfänger, Betreff, Text auf dem Gerät – nie der Test an mich");
assert.ok(!/api\(/.test(app.slice(app.indexOf("function neuEntwurfMerken("), app.indexOf("function entwurfWeg("))), "nie auf dem Server");
assert.ok(/NEU_ENTWURF_TAGE = 14/.test(app), "14 Tage");
assert.ok(/const nd = ohneEntwurf \? null : neuEntwurfHolen\(\);/.test(app) && /return neuEntwurfFortsetzen\(\);/.test(app), "„Neue Nachricht“ fragt zuerst");
assert.ok(/if \(chatId\) entwurfWeg\(chatId\); else neuEntwurfWeg\(\);/.test(app), "nach dem Senden weg");
assert.ok(/const neuKopf = UH\.archivAnsicht \? "" : neuEntwurfKopf\(\);/.test(app) && (app.match(/innerHTML = neuKopf \+ archKopf/g) || []).length === 2, "Hinweis oben in der Chat-Liste");
assert.ok(/function neuEntwurfVerwerfen\(\)[\s\S]{0,300}↩️ Rückgängig/.test(app), "Verwerfen mit Rückgängig");
console.log("neu-entwurf: alle Prüfungen bestanden");
