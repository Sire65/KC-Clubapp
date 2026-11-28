// 3.56.0 KC-CLUB-GARTEN-AUSHILFEN (Hansi 28.11.2026 „Aushilfen dürfen auch mitmachen“): Mein Garten für Mitglieder UND Aushilfen – Gäste nicht.
// Aufruf: node tests/garten-aushilfen.test.mjs (offline)
import fs from "node:fs";
import assert from "node:assert/strict";
import { programmText } from "./programm.mjs";
const app = programmText(), server = fs.readFileSync(new URL("../supabase/functions/kc-club/index.ts", import.meta.url), "utf8");
assert.ok(/const gartenDarf = async \(ich: Ich\) => \(ich\.zugang === "mitglied" \|\| ich\.zugang === "aushilfe"\) && \(ich\.admin \|\| \(await freigaben\(\)\)\.garten === "alle"\)/.test(server), "Server: Mitglieder + Aushilfen, Freigabe nötig");
const liste = (q) => q.slice(q.indexOf("aushilfe: [", q.indexOf("ZUGANG_AKTIONEN")), q.indexOf("]", q.indexOf("aushilfe: [", q.indexOf("ZUGANG_AKTIONEN"))));
for (const q of [server, app]) for (const a of ["garten_tag", "garten_saeen", "garten_pflege", "garten_auto", "garten_club", "garten_clubgarten"])
  assert.ok(liste(q).includes(`"${a}"`), `${a} für Aushilfen (App und Server)`);
const basis = (q) => q.slice(q.indexOf("basis: [", q.indexOf("ZUGANG_AKTIONEN")), q.indexOf("aushilfe: [", q.indexOf("ZUGANG_AKTIONEN")));
assert.ok(!/"garten_/.test(basis(server)), "Gäste nicht");
assert.ok(/aushilfe: \[[^\]]*"garten"[^\]]*\]/.test(app.slice(app.indexOf("const ZUGANG_KACHELN"))), "Kachel für Aushilfen");
assert.ok(/zugang\(\) !== "mitglied" && zugang\(\) !== "aushilfe"\) \|\| !zugangKachel\("garten"\)/.test(app), "Tageszählung auch für Aushilfen");
console.log("garten-aushilfen: ok");
