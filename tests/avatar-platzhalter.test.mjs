// KC-CLUB-AVATAR-PLATZHALTER (27.11.2026): Platzhalter für noch nicht geladene Profilfotos muss ein vollständiges, gültiges GIF sein
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText();
const m = app.match(/AVF_LEER = "data:image\/gif;base64,([A-Za-z0-9+/=]+)"/);
assert.ok(m, "AVF_LEER vorhanden");
const b = Buffer.from(m[1], "base64");
assert.equal(b.slice(0, 6).toString(), "GIF89a", "GIF-Kopf");
assert.equal(b[b.length - 1], 0x3b, "GIF-Ende (Trailer 0x3B) vorhanden – sonst meldet der Browser einen Ladefehler");
assert.ok(b.length >= 35, "nicht abgeschnitten");
console.log("avatar-platzhalter: ok");
