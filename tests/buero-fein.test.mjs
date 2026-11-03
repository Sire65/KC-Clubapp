// KC-CLUB-BUERO-FEIN (Wunsch Hansi 03.11.2026). Aufruf: node tests/buero-fein.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
const bu = fs.readFileSync(new URL("../teile/buero.js", import.meta.url), "utf8"), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
const f = new Function(bu.slice(bu.indexOf("const BUE_FEIN_MAX"), bu.indexOf("const bueVersatzStil")) + "; return { bueRund, bueVersatzPruefen };")();
assert.equal(f.bueRund(99), 60); assert.equal(f.bueRund(-77.4), -60); assert.equal(f.bueRund("x"), 0);
assert.deepEqual(f.bueVersatzPruefen({ monitor: [12.4, -8], "Böse!": [1, 1], lampe: [0, 0], korb: "x" }), { monitor: [12, -8] });
assert.ok(bu.includes('style="grid-area:${platz[id]}${bueVersatzStil(id)}"'), "Versatz wird angewendet");
assert.ok(bu.includes("versatz: bueVersatzPruefen(BUE.versatz)") && bu.includes("BUE.versatz = { ...(BUE.vorher.versatz || {}) }") && bu.includes("BUE.versatz = {}; BUE.wahl = null"), "Speichern, Rückgängig, Grundaufstellung");
assert.ok(bu.includes('onclick="bueFein(0,-1)">▲</button>') && bu.includes("function bueFein(x, y, mitte)"), "Pfeile");
assert.ok(bu.includes("// KC-CLUB-BUERO-FEIN: nicht auf einem anderen Teil losgelassen → genau dort stehen lassen"), "Ziehen ohne Ziel = fein");
assert.ok(server.includes("// 2.844.0 KC-CLUB-BUERO-FEIN: Feinversatz je Teil") && server.includes("Math.max(-60, Math.min(60, Math.round(Number(Array.isArray(v) ? v[i] : 0) || 0)))"), "Server speichert den Versatz geprüft");
console.log("buero-fein: ok");
