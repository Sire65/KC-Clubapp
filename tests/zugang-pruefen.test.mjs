// KC-CLUB-ZUGANG-AUFRAEUMEN (2.607.0, 23.10.2026): Bewertung der persönlichen Zugangslinks.
// Aufruf: node tests/zugang-pruefen.test.mjs (offline)
import assert from "node:assert/strict";
import { ZG, zgBewerten, zgAuffaellig, ZG_REIHE } from "../supabase/functions/kc-club/zugang-pruefen.js";

const T = Date.parse("2026-10-23T08:00:00Z"), vor = (tage) => new Date(T - tage * 86400000).toISOString(), mg = { active: true };
assert.equal(ZG.nieTage, 21); assert.equal(ZG.ruheTage, 60);
assert.equal(zgBewerten({ aktiv: false }, mg, T).stufe, "aus");
assert.equal(zgBewerten({ aktiv: true, zuletzt_gesehen: vor(1) }, { active: false }, T).stufe, "ausgetreten", "ausgetreten zählt vor allem anderen");
assert.equal(zgBewerten({ aktiv: true, zuletzt_gesehen: vor(1) }, null, T).stufe, "ausgetreten", "unbekannte Person");
assert.deepEqual(zgBewerten({ aktiv: true, erstellt_am: vor(24) }, mg, T), { stufe: "nie", text: "Link seit 24 Tagen nie benutzt" });
assert.equal(zgBewerten({ aktiv: true, erstellt_am: vor(10) }, mg, T).stufe, "ok", "neuer Link darf noch ungenutzt sein");
assert.equal(zgBewerten({ aktiv: true, erstellt_am: vor(400), zuletzt_gesehen: vor(61) }, mg, T).stufe, "ruht");
assert.equal(zgBewerten({ aktiv: true, erstellt_am: vor(400), zuletzt_gesehen: vor(60) }, mg, T).stufe, "ok");
assert.equal(zgBewerten({ aktiv: true, zuletzt_gesehen: vor(0) }, mg, T).text, "heute in der App");
assert.equal(zgBewerten({ aktiv: true, zuletzt_gesehen: vor(1) }, mg, T).text, "vor 1 Tag in der App");
assert.ok(zgAuffaellig("nie") && zgAuffaellig("ruht") && zgAuffaellig("ausgetreten") && !zgAuffaellig("ok") && !zgAuffaellig("aus"));
assert.deepEqual(ZG_REIHE, ["ausgetreten", "nie", "ruht", "ok", "aus"]);
console.log("OK – Zugangslinks: Bewertung geprüft");
